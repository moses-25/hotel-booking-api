import Boom from '@hapi/boom';
import { ConversationService } from '../../services/conversationServices.js';

const conversationManager = new ConversationService();

export const listChatConversations = async (req, res, next) => {
  try {
    const response = await conversationManager.listForChatUser(req.user);
    return res.status(200).json({
      success: true,
      message: 'Conversations found successfully',
      total: response.total,
      conversations: response.conversationsData,
      authentication: res.locals.newUserToken,
    });
  } catch (err) {
    if (Boom.isBoom(err)) return next(err);
    return next(
      Boom.boomify(err, { message: 'Unable to load chat conversations' }),
    );
  }
};

export const openChatConversation = async (req, res, next) => {
  try {
    const response = await conversationManager.openForGuest(req.user);
    const conversation = response.conversationData;
    const io = req.app.get('io');

    io?.to('role:Staff').emit('conversation:created', conversation);
    io?.to(`user:${req.user.id}`).emit('conversation:created', conversation);

    return res.status(201).json({
      success: true,
      message: 'Conversation opened successfully',
      conversation,
      authentication: res.locals.newUserToken,
    });
  } catch (err) {
    if (Boom.isBoom(err)) return next(err);
    return next(Boom.boomify(err, { message: 'Unable to open conversation' }));
  }
};

export const claimChatConversation = async (req, res, next) => {
  try {
    const response = await conversationManager.claimForStaff(
      req.user,
      req.body.conversationId,
    );
    const conversation = response.conversationData;
    const io = req.app.get('io');

    io?.to('role:Staff').emit('conversation:updated', conversation);
    io?.to(`user:${conversation.guest.id}`).emit(
      'conversation:updated',
      conversation,
    );

    return res.status(200).json({
      success: true,
      message: 'Conversation claimed successfully',
      conversation,
      authentication: res.locals.newUserToken,
    });
  } catch (err) {
    if (Boom.isBoom(err)) return next(err);
    return next(Boom.boomify(err, { message: 'Unable to claim conversation' }));
  }
};
