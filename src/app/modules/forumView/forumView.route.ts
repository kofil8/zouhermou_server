import express from 'express';
import auth from '../../middlewares/auth';
import { forumViewController } from './forumView.controller';

const router = express.Router();

router.get('/:forumId', auth(), forumViewController.getToalViews);

export const ForumViewRoutes = router;
