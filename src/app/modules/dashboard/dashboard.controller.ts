import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { DashboardServices } from './dashboard.service';

const createAdmin = catchAsync(async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  const result = await DashboardServices.createAdmin({
    name,
    email,
    password,
    phoneNumber,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Admin created successfully',
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const adminId = req.params.id;
  const result = await DashboardServices.deleteAdmin(adminId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Admin deleted successfully',
    data: result,
  });
});

export const DashboardControllers = {
  createAdmin,
  deleteAdmin,
};
