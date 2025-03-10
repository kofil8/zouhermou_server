import httpStatus from 'http-status';
import config from '../../../config';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';

const getMyProfileFromDB = async (id: string) => {
  const profile = await prisma.user.findUnique({
    where: {
      id: id,
    },
    include: {
      athlete: true,
    },
  });

  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { password, ...rest } = profile;

  const filteredProfile = Object.fromEntries(
    Object.entries(rest).filter(([_, value]) => value !== null),
  );

  return filteredProfile;
};

const updateMyProfileIntoDB = async (id: string, payload: any, file: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, profileImage: true },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const profileImage =
    file && file.originalname
      ? `${config.backend_image_url}/uploads/profile/${file.originalname}`
      : existingUser.profileImage;

  // Check if payload is a string and parse it if necessary
  let parsedPayload = payload;
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payload format');
    }
  }

  // Now update using only valid keys
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      profileImage,
      ...parsedPayload,
    },
  });

  const { password, ...rest } = updatedUser;

  const filteredProfile = Object.fromEntries(
    Object.entries(rest).filter(([_, value]) => value !== null),
  );

  return filteredProfile;
};

export const ProfileServices = {
  getMyProfileFromDB,
  updateMyProfileIntoDB,
};
