import express from 'express';
import auth from '../../middlewares/auth';
import { AthleteController } from './athlete.controller';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.get('/get-athletes', auth(), AthleteController.getAthletes);

router.post(
  '/assign-coach/:coachId',
  auth(UserRole.ATHLETE),
  AthleteController.sendCoachRequest,
);

router.delete(
  '/unassign-coach',
  auth(UserRole.ATHLETE),
  AthleteController.removeCoach,
);

router.post(
  '/send-gym-join-request/:gymId',
  auth(UserRole.ATHLETE),
  AthleteController.sendGymJoinRequest,
);

router.delete(
  '/cancel-gym-join-request',
  auth(UserRole.ATHLETE),
  AthleteController.cancelGymJoinRequest,
);

router.get(
  '/assigned-coachs',
  auth(UserRole.ATHLETE),
  AthleteController.fetchAssignedCoaches,
);

router.get(
  '/joined-gyms',
  auth(UserRole.ATHLETE),
  AthleteController.fetchJoinedGyms,
);

export const AthleteRouters = router;
