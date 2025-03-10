import { Request, Response } from 'express';
import { likeService } from './like.service';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const createLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const forumId = req.params.forumId;
  const like = await likeService.createLike(userId, forumId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Forum liked successfully.',
    data: like,
  });
});

const getLikesOnPost = catchAsync(async (req: Request, res: Response) => {
  const { forumId } = req.params;
  const { likes, likeCount } = await likeService.getLikesOnPost(forumId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Likes retrieved successfully.',
    data: {
      likes,
      likeCount,
    },
  });
});

const removeLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const forumId = req.params.forumId;

  await likeService.removeLike(userId, forumId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Like removed successfully.',
    data: null,
  });
});

export const likeController = {
  createLike,
  getLikesOnPost,
  removeLike,
};
