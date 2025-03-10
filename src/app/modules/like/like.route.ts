import express from 'express';
import { likeController } from './like.controller';
import auth from '../../middlewares/auth';
const router = express.Router({ mergeParams: true });

router.post('/:forumId', auth(), likeController.createLike);

router.get('/:forumId', auth(), likeController.getLikesOnPost);

router.delete('/:forumId', auth(), likeController.removeLike);

export const LikeRoutes = router;
