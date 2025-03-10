import express from 'express';
import { commentController } from './comment.controller';
import auth from '../../middlewares/auth';
const router = express.Router();

router.get('/:forumId', auth(), commentController.getCommentsOnForum);
router.post(
  '/create-comment/:forumId',
  auth(),
  commentController.createComment,
);
router.delete('/:commentId', auth(), commentController.deleteUserComment);

export const commentRoutes = router;
