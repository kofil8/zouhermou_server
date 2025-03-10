import { FightingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import { jwtHelpers } from '../../../helpars/jwtHelpers';
import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';
import { generateTokenReset } from '../../utils/generateTokenForReset';
import { generateOtpReg } from '../../utils/otpGenerateReg';
import { generateOtp } from '../../utils/otpGenerateResetP';
import config from '../../../config';
import { getDistance } from 'geolib';

const registerUserIntoDB = async (
  file: Express.Multer.File | undefined,
  payload: any,
) => {
  const parsedPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload;

  const existingUser = await prisma.user.findUnique({
    where: { email: parsedPayload.email },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'User already exists with this email',
    );
  }

  const profileImage = file?.originalname
    ? `${config.backend_image_url}/uploads/profile/${file.originalname}`
    : '';

  const hashedPassword = await bcrypt.hash(parsedPayload.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    // Create user
    const createdUser = await tx.user.create({
      data: {
        email: parsedPayload.email,
        password: hashedPassword,
        name: parsedPayload.name,
        profileImage,
        role: parsedPayload.role,
        isVerified: false,
        location: parsedPayload.location,
      },
    });

    const roleData = getRoleData(parsedPayload, createdUser.id);
    if (roleData) {
      await tx[parsedPayload.role.toLowerCase()].create({
        data: roleData,
      });
    }

    return createdUser;
  });

  const { otp, otpExpiry } = await generateOtpReg({
    email: parsedPayload.email,
  });
  await prisma.otp.create({
    data: {
      email: parsedPayload.email,
      otp,
      expiry: otpExpiry,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    role: user.role,
    isVerified: user.isVerified,
  };
};

const getRoleData = (payload: any, userId: string) => {
  switch (payload.role) {
    case 'ATHLETE':
      return {
        userId,
        fighting: payload.fighting
          ? FightingStatus.PRO
          : FightingStatus.AMATEUR,
        martialArts: payload.martialArts,
        experience: payload.experience,
        fightingStances: payload.fightingStances,
        country: payload.country,
        gender: payload.gender,
        height: payload.height,
        weight: payload.weight,
        age: payload.age,
        wins: payload.wins,
        losses: payload.losses,
        draws: payload.draws,
        titles: payload.titles,
        reach: payload.reach,
      };
    case 'COACH':
      return {
        userId,
        bio: payload.bio,
        age: payload.age,
        certifications: payload.certifications,
        martialArts: payload.martialArts,
        experience: payload.experience,
        gender: payload.gender,
        country: payload.country,
      };
    case 'GYM_OWNER':
      return {
        userId,
        description: payload.description,
        location: payload.location,
        trainingTime: payload.trainingTime,
        gymFacilities: payload.gymFacilities,
      };
    case 'PROMOTER':
      return {
        location: payload.location,
      };
    default:
      return null;
  }
};

const resendOtpReg = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const { otp, otpExpiry } = await generateOtpReg({ email: payload.email });

  // Find otp in database
  const otpData = await prisma.otp.findFirst({
    where: {
      id: userData.id,
    },
  });

  if (!otpData) {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.update({
      where: {
        id: userData.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  }

  return { otpExpiry };
};

const verifyOtp = async (payload: { email: string; otp: number }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  // Check if the OTP is valid
  const otpData = await prisma.otp.findFirst({
    where: {
      email: payload.email,
      otp: payload.otp,
    },
  });

  if (otpData?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (otpData?.expiry < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  // Delete the OTP
  await prisma.otp.delete({
    where: {
      id: otpData.id,
    },
  });

  // Mark the user as verified
  const updatedUser = await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      isVerified: true,
      isOnline: true,
    },
    select: {
      isVerified: true,
      isOnline: true,
    },
  });

  return updatedUser;
};

const getAllUsersFromDB = async () => {
  const result = await prisma.user.findMany({
    where: {
      isVerified: true,
    },
  });

  const filtered = result.map((user) => {
    const { password, ...rest } = user;
    return Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => value !== null),
    );
  });

  return filtered;
};

const getUserDetailsFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const { password, ...rest } = user;

  const filteredProfile = Object.fromEntries(
    Object.entries(rest).filter(([_, value]) => value !== null),
  );
  return filteredProfile;
};

const deleteUser = async (id: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }
  const result = await prisma.user.delete({
    where: {
      id: id,
    },
  });
  return;
};

const forgotPassword = async (payload: { email: string }) => {
  const { otp, otpExpiry } = await generateOtp(payload);

  // Check if OTP already exists for the user
  const existingOtp = await prisma.otp.findFirst({
    where: { email: payload.email },
  });

  if (existingOtp) {
    await prisma.otp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  }
};

const resendOtpRest = async (payload: { email: string }) => {
  const { otp, otpExpiry } = await generateOtp(payload);

  // Check if OTP already exists for the user
  const existingOtp = await prisma.otp.findFirst({
    where: { email: payload.email },
  });

  if (existingOtp) {
    await prisma.otp.update({
      where: {
        id: existingOtp.id,
      },
      data: {
        otp,
        expiry: otpExpiry,
      },
    });
  } else {
    await prisma.otp.create({
      data: {
        email: payload.email,
        otp,
        expiry: otpExpiry,
      },
    });
  }

  return { otpExpiry };
};

const verifyResetOtp = async (payload: { email: string; otp: number }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const otpData = await prisma.otp.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (otpData?.otp !== payload.otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (otpData?.expiry < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  await prisma.otp.delete({
    where: {
      id: otpData.id,
    },
  });

  const accessToken = generateTokenReset(
    {
      id: userData.id,
      email: userData.email,
      isVerified: userData.isVerified,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    message: 'OTP verified successfully for reset password',
    accessToken,
  };
};

const resetPassword = async (
  accessToken: string,
  payload: { password: string },
) => {
  if (!accessToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  const decodedToken = jwtHelpers.verifyToken(
    accessToken,
    config.jwt.jwt_secret as Secret,
  );

  const email = decodedToken?.email;

  if (!email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
  }

  const userData = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return;
};

const changePassword = async (userId: string, payload: any) => {
  if (!payload.oldPassword || !payload.newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Both old and new passwords are required',
    );
  }
  const userData = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isPasswordCorrect = await bcrypt.compare(
    payload.oldPassword,
    userData.password,
  );
  if (!isPasswordCorrect) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid old password');
  }

  if (payload.oldPassword === payload.newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'New password should be different from old password',
    );
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return;
};

const updateLocation = async (
  userId: string,
  longitude: number,
  latitude: number,
) => {
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      latitude,
      longitude,
    },
  });

  return result;
};

const getNearByUsers = async (
  longitude: number,
  latitude: number,
  maxDistance: number,
) => {
  const users = await prisma.user.findMany({
    where: {
      latitude: {
        gte: latitude - maxDistance,
        lte: latitude + maxDistance,
      },
      longitude: {
        gte: longitude - maxDistance,
        lte: longitude + maxDistance,
      },
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  });

  return users
    .filter((user) => user.latitude !== null && user.longitude !== null)
    .filter((user) => {
      const distance = getDistance(
        { latitude, longitude },
        {
          latitude: user.latitude as number,
          longitude: user.longitude as number,
        },
      );
      return distance <= maxDistance;
    });
};

export const UserServices = {
  registerUserIntoDB,
  resendOtpReg,
  getAllUsersFromDB,
  getUserDetailsFromDB,
  deleteUser,
  forgotPassword,
  resendOtpRest,
  resetPassword,
  verifyResetOtp,
  verifyOtp,
  changePassword,
  updateLocation,
  getNearByUsers,
};
