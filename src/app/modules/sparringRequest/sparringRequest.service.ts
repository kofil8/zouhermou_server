import { Prisma, SparringRequestStatus } from '@prisma/client';
import httpStatus from 'http-status';
import { paginationHelpers } from '../../../helpars/paginationHelper';
import ApiError from '../../errors/ApiErrors';
import prisma from '../../helpers/prisma';
import { notificationServices } from '../notifications/notification.service';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';

interface NotificationBody {
  title: string;
  body: string;
}

const createSparringRequest = async (senderId: string, receiverId: string) => {
  const [user1, user2] = [senderId, receiverId].sort();
  if (senderId === receiverId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You cannot send sparring request to yourself.',
    );
  }
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }

  const existingRequest = await prisma.sparringRequest.findFirst({
    where: {
      senderId: senderId,
      receiverId: receiverId,
      OR: [
        { user1: user1, user2: user2 },
        { user1: user2, user2: user1 },
      ],
    },
  });

  if (existingRequest) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already sent a sparring request to this user.',
    );
  }

  const sparringRequest = await prisma.sparringRequest.create({
    data: {
      senderId,
      receiverId,
      status: SparringRequestStatus.PENDING,
      user1,
      user2,
    },
  });

  const notificationBody: NotificationBody = {
    title: 'Sparring Request',
    body: `${user1} sent you a sparring request.`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: receiverId,
    },
    body: notificationBody,
  });
  return sparringRequest;
};

const deleteSparringRequest = async (userId: string, requestId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  const sparringRequest = await prisma.sparringRequest.findUnique({
    where: {
      id: requestId,
    },
  });
  if (!sparringRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sparring request not found.');
  }
  if (
    sparringRequest.receiverId !== userId &&
    sparringRequest.senderId !== userId
  ) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to delete the request.',
    );
  }
  await prisma.sparringRequest.delete({
    where: {
      id: sparringRequest.id,
    },
  });
  return;
};

const deleteSparringRequestProfile = async (
  userId: string,
  viewProfileId: string,
) => {
  const [user1, user2] = [userId, viewProfileId].sort();
  const sparringRequest = await prisma.sparringRequest.findFirst({
    where: {
      user1: user1,
      user2: user2,
    },
  });
  if (!sparringRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Sparring request not found.');
  }
  if (
    sparringRequest.receiverId !== userId &&
    sparringRequest.senderId !== userId
  ) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to delete the request.',
    );
  }
  await prisma.sparringRequest.delete({
    where: {
      id: sparringRequest.id,
    },
  });
  return;
};

const acceptSparringRequest = async (userId: string, requestId: string) => {
  const sparringRequest = await prisma.sparringRequest.findFirst({
    where: {
      id: requestId,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }
  if (!sparringRequest) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'The request is not available anymore.',
    );
  }
  if (sparringRequest.receiverId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to perform this action.',
    );
  }

  const updatedSparringRequest = await prisma.sparringRequest.update({
    where: { id: requestId },
    data: { status: SparringRequestStatus.ACCEPTED },
  });
  const notificationBody: NotificationBody = {
    title: 'Sparring Request Accepted',
    body: `${user.name} accepted your sparring request.`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: sparringRequest.senderId,
    },
    body: notificationBody,
  });
  return updatedSparringRequest;
};

const rejectSparringRequest = async (userId: string, requestId: string) => {
  const sparringRequest = await prisma.sparringRequest.findUnique({
    where: {
      id: requestId,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }
  if (!sparringRequest) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'The request is not available anymore.',
    );
  }
  if (sparringRequest.receiverId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to perform this action.',
    );
  }

  const updatedSparringRequest = await prisma.sparringRequest.update({
    where: { id: requestId },
    data: { status: SparringRequestStatus.REJECTED },
  });
  const notificationBody: NotificationBody = {
    title: 'Sparring Request Rejected',
    body: `${user.name} rejected your sparring request.`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: sparringRequest.senderId,
    },
    body: notificationBody,
  });
  return updatedSparringRequest;
};

const getSparringSuggestions = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      athlete: true,
    },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }

  const { limit, skip } =
    paginationHelpers.calculatePagination(paginationOptions);

  const existingRequests = await prisma.sparringRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });

  const existingUserIds = new Set<string>();
  existingRequests.forEach((request) => {
    existingUserIds.add(request.senderId);
    existingUserIds.add(request.receiverId);
  });

  existingUserIds.delete(userId);

  const whereConditions: Prisma.UserWhereInput = {
    id: {
      notIn: Array.from(existingUserIds),
    },
    athlete: {
      isNot: null,
    },
  };

  const [sparringSuggestions, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        athlete: true,
      },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: whereConditions,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return {
    meta: {
      total,
      totalPages,
      currentPage,
      limit,
    },
    data: sparringSuggestions,
  };
};

const getSparringList = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }

  const { limit, skip } = calculatePagination(paginationOptions);

  const existingRequests = await prisma.sparringRequest.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });

  const existingUserIds = new Set<string>();
  existingRequests.forEach((request) => {
    existingUserIds.add(request.senderId);
    existingUserIds.add(request.receiverId);
  });

  existingUserIds.delete(userId);

  const whereConditions: Prisma.UserWhereInput = {
    id: {
      notIn: Array.from(existingUserIds),
      not: userId,
    },
    athlete: {
      isNot: null,
    },
  };

  const [athletes, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        athlete: true,
      },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: whereConditions,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return {
    meta: {
      total,
      totalPages,
      currentPage,
      limit,
    },
    data: athletes,
  };
};

const getSparringRequests = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  const { limit, skip } = calculatePagination(paginationOptions);

  const whereConditions: Prisma.SparringRequestWhereInput = {
    receiverId: userId,
    status: SparringRequestStatus.PENDING,
  };

  const [requests, total] = await prisma.$transaction([
    prisma.sparringRequest.findMany({
      where: whereConditions,
      select: {
        id: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.sparringRequest.count({
      where: whereConditions,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return {
    meta: {
      total,
      totalPages,
      currentPage,
      limit,
    },
    data: requests,
  };
};

export const sparringRequestService = {
  createSparringRequest,
  deleteSparringRequest,
  deleteSparringRequestProfile,
  acceptSparringRequest,
  rejectSparringRequest,
  getSparringSuggestions,
  getSparringList,
  getSparringRequests,
};
