import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ratingService } from './rating.service';

const createRating = catchAsync(async (req: Request, res: Response) => {
  const { rateeId, score, comment } = req.body;
  const raterId = req.user.id;
  const result = await ratingService.createRating(
    raterId,
    rateeId,
    score,
    comment,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Rating created successfully',
    data: result,
  });
});

const getRatingByUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const result = await ratingService.getRatingByUser(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Rating retrieved successfully',
    data: result,
  });
});

const getratingAvarage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const result = await ratingService.getratingAvarage(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Rating retrieved successfully',
    data: result,
  });
});

export const ratingController = {
  createRating,
  getRatingByUser,
  getratingAvarage,
};
