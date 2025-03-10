import express from 'express';
import auth from '../../middlewares/auth';
import { GymOwnerController } from './gym.controller';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get(
  '/get-gyms',
  auth(UserRole.GYM_OWNER),
  GymOwnerController.getGymOwners,
);

router.post(
  '/respond-athlete/:requestId',
  auth(UserRole.GYM_OWNER),
  GymOwnerController.respondToGymJoinRequestAthlete,
);

router.post(
  '/respond-coach/:requestId',
  auth(UserRole.GYM_OWNER),
  GymOwnerController.respondToGymJoinRequestCoach,
);

router.get(
  '/all-requests',
  auth(UserRole.GYM_OWNER),
  GymOwnerController.getAllRequests,
);

router.get(
  '/gym-membership-list',
  auth(UserRole.GYM_OWNER),
  GymOwnerController.gymMembershipList,
);

export const GymRouters = router;
