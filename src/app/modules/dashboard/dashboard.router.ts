import express from 'express';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { DashboardControllers } from './dashboard.controller';

const router = express.Router();

router.post(
  '/create-admin',
  auth(UserRole.SUPER_ADMIN),
  DashboardControllers.createAdmin,
);

router.delete(
  '/delete-admin/:id',
  auth(UserRole.SUPER_ADMIN),
  DashboardControllers.deleteAdmin,
);

export const AdminRouters = router;
