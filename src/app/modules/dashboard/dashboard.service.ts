import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';
import httpStatus from 'http-status';
import * as bcrypt from 'bcrypt';

const createAdmin = async (payload: {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'User already exists with this email',
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  const createAdmin = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      phoneNumber: payload.phoneNumber,
    },
  });

  const filteredAdmin = Object.fromEntries(
    Object.entries(createAdmin).filter(([_, value]) => value !== null),
  );

  return filteredAdmin;
};

const deleteAdmin = async (adminId: string) => {
  const existingAdmin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
  });

  if (!existingAdmin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  const deleteAdmin = await prisma.user.delete({
    where: {
      id: adminId,
    },
  });

  return deleteAdmin;
};

export const DashboardServices = {
  createAdmin,
  deleteAdmin,
};
