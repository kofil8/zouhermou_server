import { Prisma } from '@prisma/client';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';

const createForum = async (
  title: string,
  description: string,
  authorId: string,
) => {
  const forum = await prisma.forum.create({
    data: {
      title,
      description,
      author: {
        connect: {
          id: authorId,
        },
      },
    },
  });
  return forum;
};

const getForums = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.ForumWhereInput = {
    authorId: userId,
  };

  const [forums, total] = await prisma.$transaction([
    prisma.forum.findMany({
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
    prisma.forum.count({ where: whereConditions }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };
  return {
    meta,
    data: forums,
  };
};

const getForum = async (forumId: string, userId: string) => {
  await logForumView(forumId, userId);

  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
    },
  });
  return forum;
};

const updateForum = async (
  forumId: string,
  title: string,
  description: string,
) => {
  const [forum] = await prisma.$transaction([
    prisma.forum.findUnique({
      where: { id: forumId },
    }),
    prisma.forum.update({
      where: { id: forumId },
      data: {
        title,
        description,
      },
    }),
  ]);

  if (!forum) {
    throw new Error('Forum not found');
  }
  return forum;
};

const deleteForum = async (forumId: string) => {
  const [forum] = await prisma.$transaction([
    prisma.forum.findUnique({
      where: { id: forumId },
    }),
    prisma.forum.delete({
      where: { id: forumId },
    }),
  ]);

  if (!forum) {
    throw new Error('Forum not found');
  }

  return forum;
};

//Log ForumView
const logForumView = async (forumId: string, userId: string) => {
  const forumView = await prisma.forumView.create({
    data: {
      forumId,
      userId,
    },
  });
  return forumView;
};

export const ForumServices = {
  createForum,
  getForums,
  getForum,
  updateForum,
  deleteForum,
  logForumView,
};
