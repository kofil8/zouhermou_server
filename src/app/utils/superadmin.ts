import * as bcrypt from "bcrypt";
import config from "../../config";
import { Role } from "@prisma/client";
import prisma from "../../shared/prisma";

const superAdminData = {
  firstName: "Super",
  lastName: "Admin",
  email: "admin@gmail.com",
  password: "",
  phoneNumber: "+880123456789",
  isVerified: true,
  role: Role.SUPER_ADMIN,
};

const seedSuperAdmin = async () => {
  let superAdmin;
  try {
    // Check if a super admin already exists
    const isSuperAdminExists = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    // If not, create one
    if (isSuperAdminExists === null) {
      superAdminData.password = await bcrypt.hash(
        config.super_admin_password as string,
        Number(config.salt) || 12
      );

      const fullName = `${superAdminData.firstName} ${superAdminData.lastName}`;

      superAdmin = await prisma.user.create({
        data: superAdminData,
      });

      if (!superAdmin) {
        throw new Error("Failed to create Super Admin");
      }
      console.log("Super Admin created 🚀:", superAdmin);
    } else {
      console.log("Super Admin already exists ❗⚠️ ❗");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
  }

  return superAdmin;
};

export default seedSuperAdmin;
