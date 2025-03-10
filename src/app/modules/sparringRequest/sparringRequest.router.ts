import express from 'express';
import { sparringRequestController } from './sparringRequest.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router
  .route('/send-request/:receiverId')
  .post(
    auth(UserRole.ATHLETE),
    sparringRequestController.createSparringRequest,
  );

router
  .route('/detete-request/:requestId')
  .delete(
    auth(UserRole.ATHLETE),
    sparringRequestController.deleteSparringRequest,
  );

// router
//   .route('/remove-request/:viewProfileId')
//   .delete(auth(), sparringRequestController.deleteSparringRequestProfile);

router
  .route('/accept-request/:requestId')
  .post(
    auth(UserRole.ATHLETE),
    sparringRequestController.acceptSparringRequest,
  );

router
  .route('/reject-request/:requestId')
  .post(
    auth(UserRole.ATHLETE),
    sparringRequestController.rejectSparringRequest,
  );

router
  .route('/suggestions')
  .get(
    auth(UserRole.ATHLETE),
    sparringRequestController.getSparringSuggestions,
  );

router
  .route('/')
  .get(auth(UserRole.ATHLETE), sparringRequestController.getSparringList);

router
  .route('/requests')
  .get(auth(UserRole.ATHLETE), sparringRequestController.getSparringRequests);

export const sparringRequestRoutes = router;
