import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { commentService } from './comment.service';
import pick from '../../../helpars/pick';

const createComment = catchAsync(async (req: Request, res: Response) => {
  const payLoad = req.body;
  const authorId = req.user.id;
  const forumId = req.params.forumId;

  const comment = await commentService.createComment(
    payLoad,
    authorId,
    forumId,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Comment created succesfully.',
    data: comment,
  });
});

const getCommentsOnForum = catchAsync(async (req: Request, res: Response) => {
  const forumId = req.params.forumId;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const commentsOnPost = await commentService.getCommentsOnPost(
    forumId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'comments retrieved successfully',
    data: commentsOnPost,
  });
});

const deleteUserComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  await commentService.deleteUserComment(req.user.id, commentId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comment deleted successfully',
    data: null,
  });
});
export const commentController = {
  createComment,
  getCommentsOnForum,
  deleteUserComment,
};
