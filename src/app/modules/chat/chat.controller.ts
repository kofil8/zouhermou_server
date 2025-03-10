import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { chatServices } from './chat.services';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

// Create a new conversation (chatroom) between two users
const createConversation = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.body;
  const result = await chatServices.createConversationIntoDB(user1Id, user2Id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Conversation created successfully',
    data: result,
  });
});

// Get a specific chatroom (conversation) between two users
const getConversationByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user1Id, user2Id } = req.query;
    const result = await chatServices.getMessagesByConversationIntoDB(
      user1Id as string,
      user2Id as string,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Chatroom messages retrieved successfully',
      data: result,
    });
  },
);

// Get a single chatroom (conversation) by conversation ID
const getSingleMassageConversation = catchAsync(
  async (req: Request, res: Response) => {
    const id1 = req.params.id1;
    const id2 = req.params.id2;
    const result = await chatServices.getMessagesByConversationIntoDB(id1, id2);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Chatroom retrieved successfully',
      data: result,
    });
  },
);

// Send a message in a specific conversation (chatroom)
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, senderId, senderName, content } = req.body;
  const result = await chatServices.createMessageIntoDB(
    conversationId,
    senderId,
    senderName,
    content,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

// Get all messages in a specific chatroom (conversation)
const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.query;
  const result = await chatServices.getMessagesByConversationIntoDB(
    user1Id as string,
    user2Id as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});
const getUserChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await chatServices.getChatUsersForUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'chat users retrieved successfully',
    data: result,
  });
});

// Delete a specific message in a specific chatroom (conversation)
const deleteConversion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await chatServices.deleteConversation(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'conversation deleted successfully',
    data: result,
  });
});

const getMyChat = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user.id;
    const result = await chatServices.getMyChat(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Chat Retrieve successfully',
      data: result,
    });
  },
);

const getAllConversationMessages = catchAsync(
  async (req: Request, res: Response) => {
    const { chatroomId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const conversationMessages = await chatServices.getAllConversationMessages(
      chatroomId,
      userId,
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Messages retrieved successfully.',
      data: conversationMessages,
    });
  },
);

export const ChatControllers = {
  createConversation,
  sendMessage,
  getMessages,
  getConversationByUserId,
  getSingleMassageConversation,
  getUserChat,
  deleteConversion,
  getMyChat,
  getAllConversationMessages,
};
