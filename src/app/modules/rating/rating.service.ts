import { PrismaClient } from '@prisma/client';
import ApiError from '../../errors/ApiErrors';
import httpStatus from 'http-status';
import { notificationServices } from '../notifications/notification.service';
const prisma = new PrismaClient();

interface NotificationBody {
  title: string;
  body: string;
}

const createRating = async (
  raterId: string,
  rateeId: string,
  score: number,
  comment?: string,
) => {
  if (raterId === rateeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot rate yourself');
  }
  const users = await prisma.user.findMany({
    where: {
      id: { in: [raterId, rateeId] },
    },
  });

  if (users.length !== 2) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const rating = await prisma.rating.create({
    data: {
      raterId,
      rateeId,
      score,
      comment,
    },
  });

  const notificationBody: NotificationBody = {
    title: 'New Rating',
    body: `${users[0].name} has rated you with ${score} stars`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: rateeId,
    },
    body: notificationBody,
  });
  return rating;
};

const getRatingByUser = async (userId: string) => {
  const rater = await prisma.rating.findMany({
    where: {
      raterId: userId,
    },
  });

  if (!rater) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rater not found');
  }
  const rating = await prisma.rating.findMany({
    where: {
      rateeId: userId,
    },
    include: {
      rater: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return rating;
};

const getratingAvarage = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const result = await prisma.rating.aggregate({
    where: { rateeId: userId },
    _avg: { score: true },
    _count: { score: true },
  });

  if (result._count.score === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No ratings found');
  }

  return {
    average: result._avg.score,
    count: result._count.score,
  };
};

export const ratingService = {
  createRating,
  getRatingByUser,
  getratingAvarage,
};
