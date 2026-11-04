/**
 * @module services/conversationServices
 * @description Service layer for Conversation CRUD.
 *
 * Handles creation, update (status transition and optional staff
 * reassignment), deletion, and retrieval of conversations. Every retrieval
 * embeds the guest, staff, and status records as nested objects (via
 * `CATALOG_INCLUDES`), so the client can render the conversation list
 * without extra round-trips.
 *
 * @class ConversationService
 */
import { Conversation } from '../db/models/conversation.js';
import { User } from '../db/models/user.js';
import { UserRole } from '../db/models/userRole.js';
import { ConversationStatus } from '../db/models/conversationStatus.js';
import Boom from '@hapi/boom';
import { Op } from 'sequelize';
import { sequelize } from '../libraries/DBConnection.js';

export class ConversationService {

  /**
   * Creates a new conversation between a guest and a staff member.
   *
   * Business rules enforced here (not in the schema — these require DB
   * lookups that Joi can't perform):
   *   1. `guest` and `staff` must reference DIFFERENT users.
   *   2. The guest user must exist and have the 'Guest' role.
   *   3. The staff user must exist and have the 'Staff' or 'Administrator'
   *      role (Administrators are allowed to act as chat agents).
   *   4. The status must reference an existing conversation_status row.
   *
   * The checks are read-only and idempotent, so they run outside a
   * transaction. Any race between a check and the INSERT is caught by the
   * database's FOREIGN KEY constraint and mapped to a 404/409 below.
   *
   * @async
   * @param {Object} newConversation - Creation payload.
   * @param {number|string} newConversation.guestId - FK to the guest user.
   * @param {number|string} newConversation.staffId - FK to the staff user.
   * @param {number|string} newConversation.statusId - FK to the conversation status.
   * @returns {Promise<{ status: string, conversationData: Object }>} Result
   * object with a success status and the created conversation (with its
   * catalogs embedded).
   * @throws {Boom} `Boom.badRequest` if guest and staff are the same, or if
   * the referenced users do not have the required roles; `Boom.notFound` if
   * the guest, staff, or status does not exist; a wrapped Boom error for any
   * other failure.
   */
  async createOne(newConversation) {

    const { guestId, staffId, statusId } = newConversation;

    // Rule 1: guest and staff must be distinct users.
    if (String(guestId) === String(staffId)) {
      throw Boom.badRequest('A conversation cannot be opened with yourself');
    }

    try {
      // Rule 2: the guest must exist and hold the 'Guest' role.
      const guest = await User.findByPk(guestId, {
        include: [{ model: UserRole, as: 'roleData', attributes: ['id', 'name'] }],
      });
      if (!guest) throw Boom.notFound('Guest user not found');
      if (guest.roleData?.name !== 'Guest') {
        throw Boom.badRequest('The guest user must have the Guest role');
      }

      // Rule 3: the staff must exist and hold 'Staff' or 'Administrator'.
      const staff = await User.findByPk(staffId, {
        include: [{ model: UserRole, as: 'roleData', attributes: ['id', 'name'] }],
      });
      if (!staff) throw Boom.notFound('Staff user not found');
      if (!['Staff', 'Administrator'].includes(staff.roleData?.name)) {
        throw Boom.badRequest('The staff user must have the Staff or Administrator role');
      }

      // Rule 4: the status must exist.
      const status = await ConversationStatus.findByPk(statusId);
      if (!status) throw Boom.notFound('Conversation status not found');

      // Insert.
      const created = await Conversation.create({
        guest: guestId,
        staff: staffId,
        status: statusId,
      });

      // Re-fetch with the catalogs eagerly loaded so the caller receives
      // the fully-shaped object (matching the list endpoints' contract).
      const full = await Conversation.findByPk(created.id, {
        include: ConversationService.CATALOG_INCLUDES,
      });

      return {
        status: 'CREATED SUCCESSFULLY',
        conversationData: ConversationService._formatConversation(full),
      };

    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        throw Boom.badRequest('A referenced record (guest, staff or status) does not exist');
      }
      throw Boom.boomify(err, { message: 'Unable to create conversation' });
    }
  }

  /**
   * Updates an existing conversation's status and, optionally, its staff.
   *
   * `statusId` is required (a status transition is the core operation).
   * `staffId`, when supplied, reassigns the conversation to a different
   * staff member and is validated against the same rules as in `createOne`.
   *
   * @async
   * @param {number|string} conversationId - Id of the conversation to update.
   * @param {Object} newData - Update payload.
   * @param {number|string} newData.statusId - New status id.
   * @param {number|string} [newData.staffId] - New staff id (optional).
   * @returns {Promise<{ status: string, conversationData: Object }>} Result
   * object with a success status and the post-update conversation.
   * @throws {Boom} `Boom.notFound` if the conversation / status / staff does
   * not exist; `Boom.badRequest` if the new staff lacks the required role;
   * a wrapped Boom error for any other failure.
   */
  async updateOne(conversationId, newData) {

    if (!newData || !newData.statusId) {
      throw Boom.badRequest('No data provided');
    }

    try {
      // Explicit existence check gives a clean 404 before any write.
      const existing = await Conversation.findByPk(conversationId);
      if (!existing) throw Boom.notFound('Conversation not found');

      // Verify the target status exists.
      const status = await ConversationStatus.findByPk(newData.statusId);
      if (!status) throw Boom.notFound('Conversation status not found');

      // Validate the reassigned staff, if any.
      if (newData.staffId) {
        const staff = await User.findByPk(newData.staffId, {
          include: [{ model: UserRole, as: 'roleData', attributes: ['id', 'name'] }],
        });
        if (!staff) throw Boom.notFound('Staff user not found');
        if (!['Staff', 'Administrator'].includes(staff.roleData?.name)) {
          throw Boom.badRequest('The staff user must have the Staff or Administrator role');
        }
      }

      // Build the update payload: only the fields actually supplied.
      const updatePayload = { status: newData.statusId };
      if (newData.staffId) updatePayload.staff = newData.staffId;

      await Conversation.update(updatePayload, { where: { id: conversationId } });

      // Re-fetch with catalogs for the response.
      const full = await Conversation.findByPk(conversationId, {
        include: ConversationService.CATALOG_INCLUDES,
      });

      return {
        status: 'UPDATED SUCCESSFULLY',
        conversationData: ConversationService._formatConversation(full),
      };

    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        throw Boom.badRequest('A referenced record (status or staff) does not exist');
      }
      throw Boom.boomify(err, { message: 'Unable to update conversation' });
    }
  }

  /**
   * Deletes a conversation by id.
   *
   * The `message` table references `conversation` with
   * `onDelete: 'CASCADE'`, so its messages are removed automatically by
   * the database — no explicit cleanup is needed here.
   *
   * @async
   * @param {number|string} conversationId - Id of the conversation to delete.
   * @returns {Promise<{ status: string }>} Result object with a success status.
   * @throws {Boom} `Boom.notFound` if the conversation does not exist, or a
   * wrapped Boom error for any other failure.
   */
  async deleteOne(conversationId) {

    if (!conversationId) {
      throw Boom.badRequest('No conversation identifier provided');
    }

    try {
      const deletedRows = await Conversation.destroy({
        where: { id: conversationId },
      });

      if (!deletedRows) throw Boom.notFound('Conversation not found');

      return { status: 'DELETED SUCCESSFULLY' };

    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      throw Boom.boomify(err, { message: 'Unable to delete conversation' });
    }
  }

  /**
   * Retrieves a single conversation by id, with the guest, staff, and
   * status records embedded as nested objects.
   *
   * @async
   * @param {number|string} conversationId - Id of the conversation.
   * @returns {Promise<{ status: string, conversationData: Object }>} Result
   * object with a success status and the formatted conversation.
   * @throws {Boom} `Boom.badRequest` if no id is provided, `Boom.notFound`
   * if the conversation does not exist, or a wrapped Boom error.
   */
  async listOne(conversationId) {

    if (!conversationId) {
      throw Boom.badRequest('No conversation identifier provided');
    }

    try {
      const theConversation = await Conversation.findByPk(conversationId, {
        include: ConversationService.CATALOG_INCLUDES,
      });

      if (!theConversation) throw Boom.notFound('Conversation not found');

      return {
        status: 'CONVERSATION FOUND SUCCESSFULLY',
        conversationData: ConversationService._formatConversation(theConversation),
      };

    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      throw Boom.boomify(err, { message: 'Unable to find conversation' });
    }
  }

  /**
   * Retrieves every conversation, ordered by id ascending.
   *
   * This method is intentionally unscoped: it is only reachable through
   * Administrator-gated routes. Guest and Staff use `listForChatUser`
   * instead, which scopes the result to their own inbox and staff queue.
   *
   * @async
   * @returns {Promise<{ status: string, total: number, conversationsData: Object[] }>}
   * Result object with a success status, the record count, and the list.
   * @throws {Boom} A wrapped Boom error if the lookup fails.
   */
  async listAll() {

    try {
      const allConversations = await Conversation.findAll({
        order: [['id', 'ASC']],
        include: ConversationService.CATALOG_INCLUDES,
      });

      const records = allConversations.map(ConversationService._formatConversation);

      return {
        status: 'CONVERSATIONS FOUND SUCCESSFULLY',
        total: records.length,
        conversationsData: records,
      };

    } catch (err) {
      throw Boom.boomify(err, { message: 'Unable to find conversations' });
    }
  }

  /**
   * Retrieves every conversation in which the given user participates —
   * either as the guest or as the staff member. Used by Administrator
   * "show me everything for this user" views.
   *
   * @async
   * @param {number|string} userId - The user whose conversations to list.
   * @returns {Promise<{ status: string, total: number, conversationsData: Object[] }>}
   * Result object with a success status, the record count, and the list.
   * @throws {Boom} `Boom.badRequest` if no userId is provided, or a wrapped
   * Boom error if the lookup fails.
   */
  async listByUser(userId) {

    if (!userId) {
      throw Boom.badRequest('No user identifier provided');
    }

    try {
      const userConversations = await Conversation.findAll({
        where: {
          [Op.or]: [{ guest: userId }, { staff: userId }],
        },
        order: [['id', 'ASC']],
        include: ConversationService.CATALOG_INCLUDES,
      });

      const records = userConversations.map(ConversationService._formatConversation);

      return {
        status: 'CONVERSATIONS FOUND SUCCESSFULLY',
        total: records.length,
        conversationsData: records,
      };

    } catch (err) {
      throw Boom.boomify(err, { message: 'Unable to find conversations for the user' });
    }
  }

  /**
   * Lists the caller's conversations. Staff also receive unclaimed Open
   * conversations so they can take work from the support queue.
   *
   * @param {{ id: number|string, role: string }} user - Verified JWT claims.
   * @returns {Promise<{ status: string, total: number, conversationsData: Object[] }>}
   */
  async listForChatUser(user) {
    if (!user?.id || !['Guest', 'Staff'].includes(user.role)) {
      throw Boom.forbidden('Only guests and staff may access the chat inbox');
    }

    try {
      let where;
      if (user.role === 'Guest') {
        where = { guest: user.id };
      } else {
        const openStatus = await ConversationStatus.findOne({
          where: { name: 'Open' },
        });
        if (!openStatus) {
          throw Boom.internal('Conversation status "Open" is not configured');
        }

        where = {
          [Op.or]: [
            { staff: user.id },
            { staff: null, status: openStatus.id },
          ],
        };
      }

      const conversations = await Conversation.findAll({
        where,
        order: [['id', 'ASC']],
        include: ConversationService.CATALOG_INCLUDES,
      });
      const records = conversations.map(ConversationService._formatConversation);

      return {
        status: 'CONVERSATIONS FOUND SUCCESSFULLY',
        total: records.length,
        conversationsData: records,
      };
    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      throw Boom.boomify(err, { message: 'Unable to find chat conversations' });
    }
  }

  /**
   * Opens one unassigned conversation for a guest. Locking the guest row
   * serializes concurrent open requests so a guest cannot create duplicates.
   *
   * @param {{ id: number|string, role: string }} user - Verified JWT claims.
   * @returns {Promise<{ status: string, conversationData: Object }>}
   */
  async openForGuest(user) {
    if (!user?.id || user.role !== 'Guest') {
      throw Boom.forbidden('Only guests may open a conversation');
    }

    try {
      return await sequelize.transaction(async (transaction) => {
        const guest = await User.findByPk(user.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!guest) throw Boom.notFound('Guest user not found');

        const [openStatus, closedStatus] = await Promise.all([
          ConversationStatus.findOne({
            where: { name: 'Open' },
            transaction,
          }),
          ConversationStatus.findOne({
            where: { name: 'Closed' },
            transaction,
          }),
        ]);
        if (!openStatus || !closedStatus) {
          throw Boom.internal('Conversation statuses are not configured');
        }

        const activeConversation = await Conversation.findOne({
          where: {
            guest: user.id,
            status: { [Op.ne]: closedStatus.id },
          },
          transaction,
        });
        if (activeConversation) {
          throw Boom.conflict('You already have an active conversation');
        }

        const created = await Conversation.create(
          {
            guest: user.id,
            staff: null,
            status: openStatus.id,
          },
          { transaction },
        );
        const full = await Conversation.findByPk(created.id, {
          include: ConversationService.CATALOG_INCLUDES,
          transaction,
        });

        return {
          status: 'CREATED SUCCESSFULLY',
          conversationData: ConversationService._formatConversation(full),
        };
      });
    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      throw Boom.boomify(err, { message: 'Unable to open conversation' });
    }
  }

  /**
   * Claims an unassigned Open conversation for a staff member. The conditional
   * update makes claiming atomic when multiple staff members race for it.
   *
   * @param {{ id: number|string, role: string }} user - Verified JWT claims.
   * @param {number|string} conversationId - Conversation to claim.
   * @returns {Promise<{ status: string, conversationData: Object }>}
   */
  async claimForStaff(user, conversationId) {
    if (!user?.id || user.role !== 'Staff') {
      throw Boom.forbidden('Only staff may claim a conversation');
    }
    if (!conversationId) {
      throw Boom.badRequest('No conversation identifier provided');
    }

    try {
      const openStatus = await ConversationStatus.findOne({
        where: { name: 'Open' },
      });
      const assignedStatus = await ConversationStatus.findOne({
        where: { name: 'Assigned' },
      });
      if (!openStatus || !assignedStatus) {
        throw Boom.internal('Conversation statuses are not configured');
      }

      return await sequelize.transaction(async (transaction) => {
        const [claimed] = await Conversation.update(
          { staff: user.id, status: assignedStatus.id },
          {
            where: {
              id: conversationId,
              staff: null,
              status: openStatus.id,
            },
            transaction,
          },
        );

        if (!claimed) {
          const existing = await Conversation.findByPk(conversationId, {
            transaction,
          });
          if (!existing) throw Boom.notFound('Conversation not found');
          throw Boom.conflict('This conversation is no longer available to claim');
        }

        const full = await Conversation.findByPk(conversationId, {
          include: ConversationService.CATALOG_INCLUDES,
          transaction,
        });
        return {
          status: 'UPDATED SUCCESSFULLY',
          conversationData: ConversationService._formatConversation(full),
        };
      });
    } catch (err) {
      if (Boom.isBoom(err)) throw err;
      throw Boom.boomify(err, { message: 'Unable to claim conversation' });
    }
  }

  // ---------------------------------------------------------------------------
  // STATIC UTILITIES
  // ---------------------------------------------------------------------------

  /**
   * The set of Sequelize includes shared by every read method to embed the
   * guest, staff, and status rows as nested objects.
   *
   * The aliases (`guestData`, `staffData`, `statusData`) match the
   * `belongsTo` associations declared in `src/db/models/index.js`.
   *
   * The `User` includes expose only the minimum fields a client needs to
   * render a participant chip — never the password hash, role FK, status
   * FK, or timestamps.
   *
   * @static
   * @type {Array<Object>}
   */
  static CATALOG_INCLUDES = [
    {
      model: User,
      as: 'guestData',
      attributes: ['id', 'firstName', 'firstLastName', 'email'],
    },
    {
      model: User,
      as: 'staffData',
      attributes: ['id', 'firstName', 'firstLastName', 'email'],
    },
    {
      model: ConversationStatus,
      as: 'statusData',
      attributes: ['id', 'name'],
    },
  ];

  /**
   * Reshapes a Conversation Sequelize instance (with `CATALOG_INCLUDES`
   * eagerly loaded) into a plain object where the raw FK ids (`guest`,
   * `staff`, `status`) are replaced by nested objects and the alias keys
   * (`guestData`, …) disappear from the output.
   *
   * @private
   * @static
   * @param {Conversation} conv - The Sequelize instance to format.
   * @returns {{ id, guest, staff, status, createdAt }}
   * The formatted, plain conversation object.
   */
  static _formatConversation(conv) {
    const {
      guest, staff, status,
      guestData, staffData, statusData,
      ...rest
    } = conv.toJSON();

    return {
      ...rest,
      guest: guestData ?? null,
      staff: staffData ?? null,
      status: statusData ?? null,
    };
  }
}
