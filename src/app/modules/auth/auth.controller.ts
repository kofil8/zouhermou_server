import httpStatus from 'http-status';
import { AuthServices } from './auth.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const loginUser = catchAsync(async (req, res) => {
  const { email, password, fcmToken } = req.body;
  const result = await AuthServices.loginUserFromDB({
    email,
    password,
    fcmToken,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User successfully logged in',
    data: result,
  });
});

const logoutUser = catchAsync(async (req, res) => {
  const id = req.user.id;
  await AuthServices.logoutUser(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Successfully logged out',
    data: null,
  });
});

export const AuthControllers = { loginUser, logoutUser };
