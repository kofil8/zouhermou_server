import { PrismaClient } from '@prisma/client';
import ApiError from '../../errors/ApiError';
const prisma = new PrismaClient();
import httpStatus from 'http-status';

const getToalViews = async (forumId: string) => {
  const forum = await prisma.forum.findUnique({
    where: { id: forumId },
  });
  if (!forum) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Forum not found');
  }
  const totalViews = await prisma.forumView.count({
    where: { forumId },
  });
  return totalViews;
};

export const forumViewService = {
  getToalViews,
};
