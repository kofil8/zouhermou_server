import admin from '../../../helpars/firebaseAdmin';
import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';

// Send notification to a single user
interface NotificationRequest {
  params: {
    userId: string;
  };
  body: {
    title: string;
    body: string;
  };
}

const sendSingleNotification = async (req: NotificationRequest) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
  });

  if (!user || !user.fcmToken) {
    throw new ApiError(404, 'User not found or FCM token is missing');
  }

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    token: user.fcmToken,
  };

  await prisma.notifications.create({
    data: {
      senderId: req.params.userId,
      receiverId: req.params.userId,
      title: req.body.title,
      body: req.body.body,
    },
  });

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error: any) {
    if (error.code === 'messaging/invalid-registration-token') {
      throw new ApiError(400, 'Invalid FCM registration token');
    } else if (error.code === 'messaging/registration-token-not-registered') {
      throw new ApiError(404, 'FCM token is no longer registered');
    } else {
      throw new ApiError(500, 'Failed to send notification');
    }
  }
};

// Send notifications to all users with valid FCM tokens
const sendNotifications = async (senderId: string, req: any) => {
  const users = await prisma.user.findMany({
    where: {
      fcmToken: {},
    },
    select: {
      id: true,
      fcmToken: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(404, 'No users found with FCM tokens');
  }

  const fcmTokens = users.map((user) => user.fcmToken);

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    tokens: fcmTokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message as any);

  // Find indices of successful responses
  const successIndices = response.responses
    .map((res, idx) => (res.success ? idx : null))
    .filter((idx) => idx !== null) as number[];

  // Filter users by success indices
  const successfulUsers = successIndices.map((idx) => users[idx]);

  // Prepare notifications data for only successfully notified users
  const notificationData = successfulUsers.map((user) => ({
    senderId: senderId,
    receiverId: user.id,
    title: req.body.title,
    body: req.body.body,
  }));

  // Save notifications only if there is data
  if (notificationData.length > 0) {
    await prisma.notifications.createMany({
      data: notificationData,
    });
  }

  // Collect failed tokens
  const failedTokens = response.responses
    .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
    .filter((token) => token !== null);

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens,
  };
};

const getNotificationsFromDB = async (req: any) => {
  const { date } = req.query;

  let dateFilter = {};
  if (date) {
    const dates = date.split(' to ');
    if (dates.length === 1) {
      dateFilter = {
        createdAt: {
          gte: new Date(dates[0]),
          lt: new Date(
            new Date(dates[0]).setDate(new Date(dates[0]).getDate() + 1),
          ),
        },
      };
    } else if (dates.length === 2) {
      dateFilter = {
        createdAt: {
          gte: new Date(dates[0]),
          lte: new Date(dates[1]),
        },
      };
    }
  }

  const notifications = await prisma.notifications.findMany({
    where: {
      receiverId: req.user.id,
      ...dateFilter,
    },
    orderBy: { createdAt: 'desc' },
  });

  return notifications;
};

const getSingleNotificationFromDB = async (
  req: any,
  notificationId: string,
) => {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: notificationId,
      receiverId: req.user.id,
    },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  const updatedNotification = await prisma.notifications.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return updatedNotification;
};

export const notificationServices = {
  sendSingleNotification,
  sendNotifications,
  getNotificationsFromDB,
  getSingleNotificationFromDB,
};
