import express from 'express';
import auth from '../../middlewares/auth';
import { CoachesController } from './coach.controller';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/get-coaches', auth(), CoachesController.getCoaches);

router.post(
  '/respond-athlete/:requestId',
  auth(UserRole.COACH),
  CoachesController.resposndToAthlete,
);

router.post(
  '/send-gym-join-request/:gymId',
  auth(UserRole.COACH),
  CoachesController.sendGymJoinRequest,
);

router.get(
  '/assigned-athletes',
  auth(UserRole.COACH),
  CoachesController.getAssignedAthletes,
);

router.get(
  '/joined-gyms',
  auth(UserRole.COACH),
  CoachesController.getJoinedGyms,
);

export const CoachRouters = router;
