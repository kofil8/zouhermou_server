import { PrismaClient } from '@prisma/client';
import ApiError from '../../errors/ApiErrors';
import httpStatus from 'http-status';
import { notificationServices } from '../notifications/notification.service';
const prisma = new PrismaClient();

interface NotificationBody {
  title: string;
  body: string;
}
const createLike = async (userId: string, forumId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'The user is not available anymore',
    );
  }

  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
  });
  if (!forum) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This post is not available anymore',
    );
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId,
      forumId,
    },
  });

  if (existingLike) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already liked this post',
    );
  }

  const like = await prisma.like.create({
    data: {
      userId,
      forumId,
    },
  });

  const notificationBody: NotificationBody = {
    title: 'Like on your post',
    body: `${user.name} liked your post`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: forum.authorId,
    },
    body: notificationBody,
  });

  return like;
};

const getLikesOnPost = async (forumId: string) => {
  const forumWithLikes = await prisma.forum.findUnique({
    where: { id: forumId },
    select: {
      id: true,
      likes: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { likes: true },
      },
    },
  });

  if (!forumWithLikes) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This post is not available right now.',
    );
  }

  const likes = forumWithLikes.likes.map((like) => like.user);

  const likeCount = forumWithLikes._count.likes;

  return {
    likes,
    likeCount,
  };
};

const removeLike = async (userId: string, forumId: string) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_forumId: {
        userId,
        forumId,
      },
    },
  });

  if (!existingLike) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Like not found for this user on the specified forum.',
    );
  }

  const deletedLike = await prisma.like.delete({
    where: {
      userId_forumId: {
        userId,
        forumId,
      },
    },
  });

  return deletedLike;
};

export const likeService = {
  createLike,
  getLikesOnPost,
  removeLike,
};
