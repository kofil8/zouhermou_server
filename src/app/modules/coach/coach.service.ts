import { Gender, JoinStatus, MartialType, Prisma } from '@prisma/client';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
import geolib from 'geolib';
import { notificationServices } from '../notifications/notification.service';

interface NotificationBody {
  title: string;
  body: string;
}

export type Filters = {
  searchTerm?: string;
  martialArts?: MartialType;
  age?: number;
  gender?: Gender;
  experience?: number;
  minDistance?: number;
  maxDistance?: number;
  userLatitude?: number;
  userLongitude?: number;
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  return geolib.getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 },
  );
};

const getCoaches = async (
  paginationOptions: IPaginationOptions,
  params: Filters,
) => {
  const {
    page,
    limit,
    skip,
    sortBy = 'id',
    sortOrder = 'asc',
  } = calculatePagination(paginationOptions);

  const {
    searchTerm,
    minDistance,
    maxDistance,
    userLatitude,
    userLongitude,
    ...restParams
  } = params;

  const andConditions: Prisma.CoachWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { country: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (Object.keys(restParams).length) {
    andConditions.push({
      AND: Object.keys(restParams).map((key) => ({
        [key]: { equals: restParams[key] },
      })),
    });
  }

  if (minDistance && maxDistance && userLatitude && userLongitude) {
    andConditions.push({
      AND: [
        {
          user: {
            latitude: {
              gte: userLatitude - maxDistance,
              lte: userLatitude + maxDistance,
            },
          },
        },
        {
          user: {
            longitude: {
              gte: userLongitude - maxDistance,
              lte: userLongitude + maxDistance,
            },
          },
        },
      ],
    });

    const coaches = await prisma.coach.findMany({
      select: {
        id: true,
        user: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const filteredCoaches = coaches.filter((coach) => {
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        coach.user.latitude as number,
        coach.user.longitude as number,
      );
      return distance >= minDistance && distance <= maxDistance;
    });
    andConditions.push({
      OR: [
        {
          user: {
            latitude: {
              gte: calculateDistance(
                userLatitude,
                userLongitude,
                filteredCoaches[0].user.latitude as number,
                filteredCoaches[0].user.longitude as number,
              ),
            },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.CoachWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const validSortFields = [
    'id',
    'userId',
    'martialArts',
    'experience',
    'gender',
    'age',
  ];

  if (!validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sortBy field: ${sortBy}`);
  }

  const result = await prisma.coach.findMany({
    where: whereConditions,
    include: {
      user: true,
    },
    take: limit,
    skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.coach.count({
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
    data: result.map((coach) => ({
      id: coach.id,
      name: coach.user.name,
      experience: coach.experience,
      martialArts: coach.martialArts,
      gender: coach.gender,
      age: coach.age,
      country: coach.country,
    })),
  };
};

const respondToCoachRequest = async (
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
) => {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status. Must be either ACCEPTED or REJECTED.');
  }

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.coachRequest.findUnique({
      where: { id: requestId },
      include: {
        athlete: { include: { user: true } },
        coach: { include: { user: true } },
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== JoinStatus.PENDING) {
      throw new Error('Request has already been processed');
    }

    const updatedRequest = await tx.coachRequest.update({
      where: { id: requestId },
      data: { status: status as JoinStatus },
    });

    if (status === 'ACCEPTED') {
      await tx.athlete.update({
        where: { id: request.athlete?.id },
        data: { coachId: request.coachId },
      });

      // Optionally, send a notification to the athlete
      // const notificationBody: NotificationBody = {
      //   title: 'Coaching Request Accepted',
      //   body: 'Your coaching request has been accepted.',
      // };
      // await notificationServices.sendSingleNotification({
      //   params: { userId: request.athlete.userId },
      //   body: notificationBody,
      // });
    } else if (status === 'REJECTED') {
      // Optionally, send a notification to the athlete
      // const notificationBody: NotificationBody = {
      //   title: 'Coaching Request Rejected',
      //   body: 'Your coaching request has been rejected.',
      // };
      // await notificationServices.sendSingleNotification({
      //   params: { userId: request.athlete.userId },
      //   body: notificationBody,
      // });
    }

    return updatedRequest;
  });

  return updatedRequest;
};

const sendGymJoinRequest = async (coachId: string, gymId: string) => {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachId },
  });

  if (!coach) {
    throw new Error('Coach not found');
  }

  const existingRequest = await prisma.gymMembership.findUnique({
    where: {
      coachId_gymId: {
        coachId: coach.id,
        gymId: gymId,
      },
    },
  });

  if (existingRequest && existingRequest.status === JoinStatus.PENDING) {
    throw new Error('A pending request already exists');
  }

  const result = await prisma.gymMembership.create({
    data: {
      coachId: coach.id,
      gymId: gymId,
      status: JoinStatus.PENDING,
    },
  });

  // Optionally, send a notification to the gym owner
  // const notificationBody: NotificationBody = {
  //   title: 'New Gym Membership Request',
  //   body: `${coach.user.name} has requested to join your gym.`,
  // };
  // await notificationServices.sendSingleNotification({
  //   params: {
  //     userId: gym.userId,
  //   },
  //   body: notificationBody,
  // });

  return result;
};

const fetchAssignedAthletes = async (
  coachId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.CoachRequestWhereInput = {
    coachId,
    status: 'ACCEPTED',
  };

  const [result, total] = await prisma.$transaction([
    prisma.coachRequest.findMany({
      where: whereConditions,
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.coachRequest.count({
      where: whereConditions,
    }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: result.map((athlete) => ({
      id: athlete.id,
      name: athlete.athlete.user.name,
      martialArts: athlete.athlete.martialArts,
      experience: athlete.athlete.experience,
      gender: athlete.athlete.gender,
      age: athlete.athlete.age,
      country: athlete.athlete.country,
    })),
  };
};

const fetchJoinedGyms = async (
  coachId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.GymMembershipWhereInput = {
    id: coachId,
  };

  const [result, total] = await prisma.$transaction([
    prisma.gymMembership.findMany({
      where: whereConditions,
      include: {
        user: true,
        gym: true,
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.gymMembership.count({
      where: whereConditions,
    }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return {
    meta,
    data: result.map((membership) => ({
      id: membership.id,
      name: membership.user.name,
      location: membership.gym.location,
      description: membership.gym.description,
    })),
  };
};

export const CoachesService = {
  getCoaches,
  respondToCoachRequest,
  sendGymJoinRequest,
  fetchAssignedAthletes,
  fetchJoinedGyms,
};
