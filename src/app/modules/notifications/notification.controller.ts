import { Request, Response } from 'express';
import { notificationServices } from './notification.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const sendNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationServices.sendSingleNotification(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'notification sent successfully',
    data: notification,
  });
});

const sendNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notifications = await notificationServices.sendNotifications(
    userId,
    req,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'notifications sent successfully',
    data: notifications,
  });
});

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = await notificationServices.getNotificationsFromDB(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications retrieved successfully',
    data: notifications,
  });
});

const getSingleNotificationById = catchAsync(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId;
    const notification = await notificationServices.getSingleNotificationFromDB(
      req,
      notificationId,
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Notification retrieved successfully',
      data: notification,
    });
  },
);

export const notificationController = {
  sendNotification,
  sendNotifications,
  getNotifications,
  getSingleNotificationById,
};
