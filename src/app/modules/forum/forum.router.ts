import express from 'express';
import auth from '../../middlewares/auth';
import { ForumControllers } from './forum.controller';

const router = express.Router();

router.post('/create-forum', auth(), ForumControllers.createForum);
router.get('/', auth(), ForumControllers.getForums);
router.get('/:forumId', auth(), ForumControllers.getForum);
router.patch('/update-forum/:id', auth(), ForumControllers.updateForum);
router.delete('/delete-forum/:id', auth(), ForumControllers.deleteForum);

export const ForumRouters = router;
