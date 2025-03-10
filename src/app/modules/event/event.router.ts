import express from 'express';
import auth from '../../middlewares/auth';
import { fileUploader } from '../../../helpars/fileUploader';
import { eventController } from './event.controller';
import parseBodyData from '../../../helpars/parseBodyData';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post(
  '/create-event',
  auth(UserRole.GYM_OWNER, UserRole.PROMOTER),
  parseBodyData,
  fileUploader.uploadEventImage,
  eventController.createEvent,
);

router.patch(
  '/update-event/:eventId',
  auth(UserRole.GYM_OWNER, UserRole.PROMOTER),
  parseBodyData,
  fileUploader.uploadEventImage,
  eventController.updateEvent,
);

router.delete(
  '/delete-event/:eventId',
  auth(UserRole.GYM_OWNER, UserRole.PROMOTER),
  eventController.deleteEvent,
);

router.get('/all-events', auth(), eventController.getAllEvents);

router.post(
  '/join-event/:eventId',
  auth(UserRole.ATHLETE),
  eventController.requestJoinEvent,
);

router.post(
  '/accept-event/:eventId/requests/:athleteId',
  auth(UserRole.GYM_OWNER, UserRole.PROMOTER),
  eventController.responseEvent,
);

router.post(
  '/leave-event/:eventId',
  auth(UserRole.ATHLETE),
  eventController.leaveEvent,
);

router.get('/single-event/:eventId', auth());

router.get('/my-events', auth());

router.get('/attendees/:eventId', auth(), eventController.attendeesList);

export const EventRouters = router;
