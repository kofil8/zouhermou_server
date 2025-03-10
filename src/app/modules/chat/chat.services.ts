import { PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';

const prisma = new PrismaClient();

const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  const result = await prisma.conversation.create({
    data: {
      user1Id,
      user2Id,
    },
  });
  return result;
};

const getConversationsByUserIdIntoDB = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  return result;
};

// Get messages for a specific conversation between two users
const getMessagesByConversationIntoDB = async (
  user1Id: string,
  user2Id: string,
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return conversation || [];
};

// Create a message in a specific conversation
const createMessageIntoDB = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const result = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
    },
  });

  return result;
};
const getChatUsersForUser = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Extract the unique list of users the user is chatting with and their last message
  const chatUsersData = conversations.map((conversation) => {
    const chatUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0];
    return {
      chatUser,
      lastMessage,
    };
  });

  return chatUsersData;
};

const deleteConversation = async (id: string) => {
  return await prisma.$transaction(async (prisma) => {
    const isConversationExist = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: true },
    });

    if (!isConversationExist) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found');
    }

    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    const result = await prisma.conversation.delete({
      where: { id },
    });

    if (!result) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Could not delete conversation',
      );
    }

    return result;
  });
};

const countUnreadMessages = async (userId: string, chatroomId: string) => {
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: chatroomId,
      receiverId: userId,
      isRead: false,
    },
  });

  return unreadCount;
};

const markMessagesAsRead = async (userId: string, chatroomId: string) => {
  console.log(userId, chatroomId);
  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      conversationId: chatroomId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

const getMyChat = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const chatList = await Promise.all(
    result.map(async (conversation) => {
      const lastMessage = conversation.messages[0];
      const targetUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      const targetUserProfile = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          profileImage: true,
        },
      });

      return {
        conversationId: conversation.id,
        user: targetUserProfile || null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageDate: lastMessage ? lastMessage.createdAt : null,
      };
    }),
  );

  return chatList;
};

const getAllConversationMessages = async (
  chatroomId: string,
  userId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      conversationId: chatroomId,
      receiverId: userId,
    },
    skip,
    take: limit,
    select: {
      id: true,
      content: true,
      senderId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return messages;
};

export const chatServices = {
  createConversationIntoDB,
  getConversationsByUserIdIntoDB,
  getMessagesByConversationIntoDB,
  createMessageIntoDB,
  getChatUsersForUser,
  deleteConversation,
  countUnreadMessages,
  markMessagesAsRead,
  getMyChat,
  getAllConversationMessages,
};
