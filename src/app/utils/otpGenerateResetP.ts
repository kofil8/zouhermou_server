import httpStatus from 'http-status';
import sentEmailUtility from './sentEmailUtility';
import prisma from '../helpers/prisma';
import ApiError from '../errors/ApiError';
import { emailTemplate } from '../../helpars/emailtempForOTP';

export const generateOtp = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email, isVerified: true },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000);

  const emailSubject = 'OTP Verification for Password Reset';

  // Plain text version
  const emailText = `Your OTP is: ${otp}`;

  const textForResetPassword = `We have received a request to reset your password. Please enter the verification code to reset your password.`;

  // HTML content for the email design
  const emailHTML = emailTemplate(otp, textForResetPassword);

  // Send email
  await sentEmailUtility(payload.email, emailSubject, emailText, emailHTML);

  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);

  return {
    otp,
    otpExpiry,
  };
};
