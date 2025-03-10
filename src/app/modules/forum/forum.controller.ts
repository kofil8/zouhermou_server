import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ForumServices } from './forum.service';
import pick from '../../../helpars/pick';

const createForum = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  const authorId = req.user.id;
  const forum = await ForumServices.createForum(title, description, authorId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Forum created successfully',
    data: forum,
  });
});

const getForums = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const forums = await ForumServices.getForums(userId, paginationOptions);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Forums retrieved successfully',
    data: forums,
  });
});

const getForum = catchAsync(async (req, res) => {
  const forumId = req.params.forumId;
  const userId = req.user.id;
  const forum = await ForumServices.getForum(forumId, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Forum retrieved successfully',
    data: forum,
  });
});

const updateForum = catchAsync(async (req, res) => {
  const { forumId } = req.params;
  const { title, description } = req.body;
  const forum = await ForumServices.updateForum(forumId, title, description);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Forum updated successfully',
    data: forum,
  });
});

const deleteForum = catchAsync(async (req, res) => {
  const { forumId } = req.params;
  const forum = await ForumServices.deleteForum(forumId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Forum deleted successfully',
    data: forum,
  });
});

export const ForumControllers = {
  createForum,
  getForums,
  getForum,
  updateForum,
  deleteForum,
};
