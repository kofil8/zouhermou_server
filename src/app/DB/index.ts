import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import config from '../../config';
import prisma from '../helpers/prisma';

const superAdminData = {
  name: config.super_admin_name,
  email: config.super_admin_email,
  password: config.super_admin_password,
  phoneNumber: config.super_admin_phone,
  role: UserRole.SUPER_ADMIN,
  isVerified: true,
};

const seedSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: UserRole.SUPER_ADMIN,
      },
    });

    // If not, create one
    if (!isSuperAdminExists) {
      superAdminData.password = await bcrypt.hash(
        config.super_admin_password as string,
        Number(config.salt) || 12,
      );
      await prisma.user.create({
        data: superAdminData,
      });
      console.log('Super Admin created 🚀:');
    } else {
      return;
      console.log('Super Admin already exists.');
    }
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

export default seedSuperAdmin;
