import { UserRole } from '@prisma/client';
import express from 'express';
import { fileUploader } from '../../../helpars/fileUploader';
import parseBodyData from '../../../helpars/parseBodyData';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidations } from './user.validation';

const router = express.Router();

router.post(
  '/register',
  fileUploader.uploadprofileImage,
  parseBodyData,
  UserControllers.registerUser,
);

router.post(
  '/verify-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.verifyOtp,
);

router.post(
  '/resend-otp-reg',
  validateRequest(UserValidations.resendOtp),
  UserControllers.resendOtpReg,
);
router.post(
  '/reset-password',
  auth(),
  validateRequest(UserValidations.resetPassword),
  UserControllers.resetPassword,
);

router.get('/', auth(UserRole.ADMIN), UserControllers.getAllUsers);

router.get('/:id', auth(UserRole.ADMIN), UserControllers.getUserDetails);

router.delete('/:id', auth(UserRole.ADMIN), UserControllers.deleteUser);

router.post(
  '/forgot-password',
  validateRequest(UserValidations.forgotPassword),
  UserControllers.forgotPassword,
);

router.post(
  '/resend-otp-rest',
  validateRequest(UserValidations.resendOtp),
  UserControllers.resendOtpRest,
);

router.post(
  '/change-password',
  validateRequest(UserValidations.changePassword),
  auth(),
  UserControllers.changePassword,
);

router.post(
  '/reset-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.ResetOtpVerify,
);

router.post(
  '/verify-reset-otp',
  validateRequest(UserValidations.verifyOtp),
  UserControllers.ResetOtpVerify,
);

//live location
router.patch('/update-location', auth(), UserControllers.updateLocation);

router.get('/nearby-users', auth(), UserControllers.getNearByUsers);

export const UserRouters = router;
