import { Prisma, PrismaClient } from '@prisma/client';
import ApiError from '../../errors/ApiErrors';
import httpStatus from 'http-status';
import { notificationServices } from '../notifications/notification.service';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
const prisma = new PrismaClient();

const createComment = async (
  payLoad: any,
  authorId: string,
  forumId: string,
) => {
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
  });
  if (!forum) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This forum is not available anymore.',
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: authorId },
  });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This user is not available anymore.',
    );
  }

  const comment = await prisma.comment.create({
    data: {
      ...payLoad,
      authorId,
      forumId,
    },
  });

  const notificationBody = {
    title: 'New Comment',
    body: `${user.name} commented on your post`,
  };

  await notificationServices.sendSingleNotification({
    params: {
      userId: forum.authorId,
    },
    body: notificationBody,
  });

  return comment;
};

const getCommentsOnPost = async (
  forumId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.CommentWhereInput = {
    forumId: forumId,
  };

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.comment.count({ where: whereConditions }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: comments,
  };
};

const deleteUserComment = async (userId: string, commentId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      forum: {
        select: {
          authorId: true,
        },
      },
    },
  });

  if (!comment) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'This comment is not available anymore.',
    );
  }

  if (comment.authorId !== userId && comment.forum.authorId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'You are not authorized to delete this comment.',
    );
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return null;
};

export const commentService = {
  createComment,
  getCommentsOnPost,
  deleteUserComment,
};
