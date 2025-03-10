import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { forumViewService } from './forumView.service';

const getToalViews = catchAsync(async (req: Request, res: Response) => {
  const forumId = req.params.forumId;
  const result = await forumViewService.getToalViews(forumId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Total views retrieved successfully',
    data: result,
  });
});

export const forumViewController = {
  getToalViews,
};
