import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import prisma from '../../helpers/prisma';
import { JoinStatus, Prisma, UserRole } from '@prisma/client';
import config from '../../../config';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
import { notificationServices } from '../notifications/notification.service';
import { join } from 'path';

interface NotificationBody {
  title: string;
  body: string;
}

const createEventIntoDB = async (userId: string, payload: any, file: any) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (user.role !== UserRole.GYM_OWNER && user.role !== UserRole.PROMOTER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only gym owner and promoters can create events',
    );
  }

  const image = file.originalname
    ? `${config.backend_image_url}/uploads/events/${file.originalname}`
    : '';

  let parsedPayload = payload;
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error: any) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payload format');
    }
  }

  const event = await prisma.event.create({
    data: {
      title: parsedPayload.title,
      description: parsedPayload.description,
      location: parsedPayload.location,
      date: parsedPayload.date,
      time: parsedPayload.time,
      image: image,
      ticketLink: parsedPayload.ticketLink,
      creatorId: user.id,
    },
  });

  return event;
};

const updateEventIntoDB = async (eventId: string, payload: any, file: any) => {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  const image = file.originalname
    ? `${config.backend_image_url}/uploads/events/${file.originalname}`
    : '';

  let parsedPayload = payload;
  if (typeof payload === 'string') {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error: any) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payload format');
    }
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      title: parsedPayload.title,
      description: parsedPayload.description,
      location: parsedPayload.location,
      date: parsedPayload.date,
      time: parsedPayload.time,
      image: image,
      ticketLink: parsedPayload.ticketLink,
    },
  });

  return updatedEvent;
};

const deleteEventIntoDB = async (eventId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (user.role !== UserRole.GYM_OWNER && user.role !== UserRole.PROMOTER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only gym owner and promoters can delete events',
    );
  }
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  const deletedEvent = await prisma.event.delete({
    where: {
      id: eventId,
    },
  });

  return deletedEvent;
};

const getAllEventsFromDB = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.EventWhereInput = {
    creatorId: userId,
  };

  const events = await prisma.event.findMany({
    where: whereConditions,
    include: {
      _count: {
        select: {
          attendees: true,
        },
      },
    },
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.event.count({
    where: whereConditions,
  });

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: events,
  };
};

const getEventByIdFromDB = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  return event;
};

const requestJoinEvent = async (athleteId: string, eventId: string) => {
  const [user, event] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.event.findUnique({
      where: {
        id: eventId,
      },
    }),
  ]);

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const request = await prisma.eventAttendee.create({
    data: {
      athleteId: athleteId,
      eventId: eventId,
      status: JoinStatus.PENDING,
    },
  });

  const notificationBody: NotificationBody = {
    title: 'Request for Joining Event',
    body: `${user.name} sent you a joining request to event ${event.title}.`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: event.creatorId,
    },
    body: notificationBody,
  });

  return request;
};

const responseEventJoiningRequest = async (
  userId: string,
  eventId: string,
  athleteId: string,
  status: JoinStatus,
) => {
  const [user, event] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
    }),
    prisma.event.findUnique({
      where: {
        id: eventId,
        attendees: {
          some: {
            status: JoinStatus.PENDING,
            athleteId: athleteId,
          },
        },
      },
    }),
  ]);

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (user.role !== UserRole.GYM_OWNER && user.role !== UserRole.PROMOTER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Only gym owner and promoters can respond to joining requests',
    );
  }

  const updatedRequest = await prisma.eventAttendee.update({
    where: {
      eventId_athleteId: {
        eventId: eventId,
        athleteId: athleteId,
      },
    },
    data: {
      status: status,
    },
  });

  if (updatedRequest.status === JoinStatus.ACCEPTED) {
    const notificationBody: NotificationBody = {
      title: 'Successfully accepted joining request',
      body: `${user.name} accepted your joining request to event ${event.title}.`,
    };
    notificationServices.sendSingleNotification({
      params: {
        userId: athleteId,
      },
      body: notificationBody,
    });
  }

  if (updatedRequest.status === JoinStatus.REJECTED) {
    const notificationBody: NotificationBody = {
      title: 'Successfully rejected joining request',
      body: `${user.name} rejected your joining request to event ${event.title}.`,
    };
    notificationServices.sendSingleNotification({
      params: {
        userId: athleteId,
      },
      body: notificationBody,
    });

    await prisma.eventAttendee.delete({
      where: {
        eventId_athleteId: {
          eventId: eventId,
          athleteId: athleteId,
        },
      },
    });
  }

  return updatedRequest;
};

const leaveEvent = async (athleteId: string, eventId: string) => {
  const [user, event] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.event.findUnique({
      where: {
        id: eventId,
      },
    }),
  ]);

  if (!event) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Event not found');
  }

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  await prisma.eventAttendee.delete({
    where: {
      eventId_athleteId: {
        eventId: eventId,
        athleteId: athleteId,
      },
    },
  });

  const notificationBody: NotificationBody = {
    title: 'Successfully left the event',
    body: `${user.name} left the event ${event.title}.`,
  };
  notificationServices.sendSingleNotification({
    params: {
      userId: event.creatorId,
    },
    body: notificationBody,
  });

  return {
    message: 'Successfully left the event',
  };
};

const attendeesList = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const attendees = await prisma.eventAttendee.findMany({
    where: {
      eventId: eventId,
      status: JoinStatus.ACCEPTED,
    },
    select: {
      athlete: {
        select: {
          name: true,
          profileImage: true,
        },
      },
    },
  });

  return attendees.map((attendee) => attendee.athlete);
};

export const eventServices = {
  createEventIntoDB,
  updateEventIntoDB,
  deleteEventIntoDB,
  getAllEventsFromDB,
  getEventByIdFromDB,
  requestJoinEvent,
  responseEventJoiningRequest,
  leaveEvent,
  attendeesList,
};
