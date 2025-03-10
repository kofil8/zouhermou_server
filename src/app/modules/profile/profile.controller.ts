import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { ProfileServices } from './profile.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const result = await ProfileServices.getMyProfileFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const payload = req.body.bodyData;
  const file = req.file as any;
  const result = await ProfileServices.updateMyProfileIntoDB(id, payload, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});
export const ProfileControllers = {
  getMyProfile,
  updateMyProfile,
};
