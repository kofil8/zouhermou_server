import express from 'express';
import { UserRouters } from '../modules/user/user.router';
import { AuthRouters } from '../modules/auth/auth.router';
import { ProfileRouters } from '../modules/profile/profile.router';
import { AdminRouters } from '../modules/dashboard/dashboard.router';
import { ForumRouters } from '../modules/forum/forum.router';
import { LikeRoutes } from '../modules/like/like.route';
import { commentRoutes } from '../modules/comment/comment.route';
import { ForumViewRoutes } from '../modules/forumView/forumView.route';
import { NotificationsRouters } from '../modules/notifications/notification.routes';
import { Ratingrouter } from '../modules/rating/rating.route';
import { sparringRequestRoutes } from '../modules/sparringRequest/sparringRequest.router';
import { EventRouters } from '../modules/event/event.router';
import { AthleteRouters } from '../modules/athlete/athlete.route';
import { CoachRouters } from '../modules/coach/coach.route';
import { GymRouters } from '../modules/gym_owner/gym.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/dashboard',
    route: AdminRouters,
  },
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/athletes',
    route: AthleteRouters,
  },
  {
    path: '/coaches',
    route: CoachRouters,
  },
  {
    path: '/gym',
    route: GymRouters,
  },
  {
    path: '/profile',
    route: ProfileRouters,
  },
  {
    path: '/forums',
    route: ForumRouters,
  },
  {
    path: '/forum-views',
    route: ForumViewRoutes,
  },
  {
    path: '/likes',
    route: LikeRoutes,
  },
  {
    path: '/comments',
    route: commentRoutes,
  },
  {
    path: '/notifications',
    route: NotificationsRouters,
  },
  {
    path: '/ratings',
    route: Ratingrouter,
  },
  {
    path: '/sprarings',
    route: sparringRequestRoutes,
  },
  {
    path: '/events',
    route: EventRouters,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
