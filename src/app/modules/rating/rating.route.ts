import { Router } from 'express';
import auth from '../../middlewares/auth';
import { ratingController } from './rating.controller';
const router = Router();

router.post('/create', auth(), ratingController.createRating);
router.get('/:userId', auth(), ratingController.getRatingByUser);
router.get('/average/:userId', auth(), ratingController.getratingAvarage);

export const Ratingrouter = router;
