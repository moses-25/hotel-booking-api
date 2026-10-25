import { RoomType } from "../db/models/roomType.js";
import Boom from "@hapi/boom";

/**
 * Service layer for room-type catalog operations.
 *
 * Keeps database access and consistent HTTP-friendly errors out of controllers.
 * Request validation should be applied by the route before calling these methods.
 */
export class RoomTypeService {
  /**
   * Creates a room type.
   *
   * @param {{name: string, description: string, pricePerNight: number, maxOccupancy: number, amenities: string[]}} roomTypeData
   * @returns {Promise<{status: string, roomType: Object}>}
   * @throws {Boom} Throws a conflict if the name already exists.
   */
  async createOne(roomTypeData) {
    if (!roomTypeData || typeof roomTypeData !== "object") {
      throw Boom.badRequest("Room type data must be provided");
    }

    try {
      const roomType = await RoomType.create({
        name: roomTypeData.name,
        description: roomTypeData.description,
        pricePerNight: roomTypeData.pricePerNight,
        maxOccupancy: roomTypeData.maxOccupancy,
        amenities: roomTypeData.amenities,
      });

      return {
        status: "ROOM TYPE CREATED SUCCESSFULLY",
        roomType: roomType.toJSON(),
      };
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        throw Boom.conflict("A room type with this name already exists");
      }
      throw Boom.boomify(err, { message: "Unable to create room type" });
    }
  }

  /**
   * Retrieves a room type by its primary key.
   *
   * @param {string|number} roomTypeId
   * @returns {Promise<{status: string, roomType: Object}>}
   * @throws {Boom} Throws a bad request if the ID is missing, or not found if
   * no room type has that ID.
   */
  async listOne(roomTypeId) {
    if (!roomTypeId) {
      throw Boom.badRequest("No room type identifier provided");
    }

    try {
      const roomType = await RoomType.findByPk(roomTypeId);
      if (!roomType) {
        throw Boom.notFound("Room type not found");
      }

      return {
        status: "ROOM TYPE FOUND SUCCESSFULLY",
        roomType: roomType.toJSON(),
      };
    } catch (err) {
      if (Boom.isBoom(err)) {
        throw err;
      }
      throw Boom.boomify(err, { message: "Unable to find room type" });
    }
  }

  /**
   * Retrieves all room types ordered by ID.
   *
   * @returns {Promise<{status: string, total: number, roomTypes: Object[]}>}
   */
  async listAll() {
    try {
      const roomTypes = await RoomType.findAll({
        order: [["id", "ASC"]],
      });
      const records = roomTypes.map((roomType) => roomType.toJSON());

      return {
        status: "ROOM TYPES FOUND SUCCESSFULLY",
        total: records.length,
        roomTypes: records,
      };
    } catch (err) {
      throw Boom.boomify(err, { message: "Unable to find room types" });
    }
  }

  /**
   * Updates the supplied fields of an existing room type.
   *
   * @param {string|number} roomTypeId
   * @param {Object} roomTypeData
   * @returns {Promise<{status: string, roomType: Object}>}
   * @throws {Boom} Throws a bad request for missing input or not found if the
   * room type does not exist.
   */
  async updateOne(roomTypeId, roomTypeData) {
    if (!roomTypeId) {
      throw Boom.badRequest("No room type identifier provided");
    }
    if (!roomTypeData || typeof roomTypeData !== "object") {
      throw Boom.badRequest("Room type data must be provided");
    }

    const allowedFields = [
      "name",
      "description",
      "pricePerNight",
      "maxOccupancy",
      "amenities",
    ];
    const updates = Object.fromEntries(
      allowedFields
        .filter((field) => roomTypeData[field] !== undefined)
        .map((field) => [field, roomTypeData[field]]),
    );

    if (Object.keys(updates).length === 0) {
      throw Boom.badRequest("At least one room type field must be provided");
    }

    try {
      const roomType = await RoomType.findByPk(roomTypeId);
      if (!roomType) {
        throw Boom.notFound("Room type not found");
      }

      await roomType.update(updates);
      return {
        status: "ROOM TYPE UPDATED SUCCESSFULLY",
        roomType: roomType.toJSON(),
      };
    } catch (err) {
      if (Boom.isBoom(err)) {
        throw err;
      }
      if (err.name === "SequelizeUniqueConstraintError") {
        throw Boom.conflict("A room type with this name already exists");
      }
      throw Boom.boomify(err, { message: "Unable to update room type" });
    }
  }

  /**
   * Deletes a room type by its primary key.
   *
   * Database foreign-key constraints may reject deletion while rooms still
   * reference this room type.
   *
   * @param {string|number} roomTypeId
   * @returns {Promise<{status: string}>}
   * @throws {Boom} Throws a bad request if the ID is missing, or not found if
   * no room type has that ID.
   */
  async deleteOne(roomTypeId) {
    if (!roomTypeId) {
      throw Boom.badRequest("No room type identifier provided");
    }

    try {
      const deletedRows = await RoomType.destroy({
        where: { id: roomTypeId },
      });
      if (!deletedRows) {
        throw Boom.notFound("Room type not found");
      }

      return { status: "ROOM TYPE DELETED SUCCESSFULLY" };
    } catch (err) {
      if (Boom.isBoom(err)) {
        throw err;
      }
      throw Boom.boomify(err, { message: "Unable to delete room type" });
    }
  }
}
