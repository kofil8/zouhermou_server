import { Router } from 'express';
import { ChatControllers } from './chat.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.post('/conversation', ChatControllers.createConversation);

router.get('/conversation', ChatControllers.getConversationByUserId);

router.get(
  '/conversation/:id1/:id2',
  ChatControllers.getSingleMassageConversation,
);

router.post('/message', ChatControllers.sendMessage);

router.get('/:chatroomId/messages', ChatControllers.getMessages);

router.get('/:id/chatUsers', ChatControllers.getUserChat);

router.delete('/conversation/:id', ChatControllers.deleteConversion);
router.get('/getMyChat', auth(), ChatControllers.getMyChat);

router.get(
  '/conversation/:id',
  auth(),
  ChatControllers.getAllConversationMessages,
);

export const ChatRouters = router;
