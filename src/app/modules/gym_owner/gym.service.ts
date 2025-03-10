import { JoinStatus, MartialType, Prisma } from '@prisma/client';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
import geolib from 'geolib';
import { notificationServices } from '../notifications/notification.service';

export type Filters = {
  searchTerm?: string;
  martialArts?: MartialType;
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

const getGymOwners = async (
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

  const andConditions: Prisma.GymWhereInput[] = [];

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

    const gymOwners = await prisma.gym.findMany({
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

    const filteredgymOwners = gymOwners.filter((gym) => {
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        gym.user.latitude as number,
        gym.user.longitude as number,
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
                filteredgymOwners[0].user.latitude as number,
                filteredgymOwners[0].user.longitude as number,
              ),
            },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.GymWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const validSortFields = ['id', 'userId', 'martialArts'];

  if (!validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sortBy field: ${sortBy}`);
  }

  const [result, total] = await prisma.$transaction([
    prisma.gym.findMany({
      where: whereConditions,
      include: {
        user: true,
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.gym.count({
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
    data: result.map((gym) => ({
      id: gym.id,
      name: gym.user.name,
      martialArts: gym.martialArts,
      country: gym.country,
    })),
  };
};

const respondToGymJoinRequestAthlete = async (
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
) => {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status. Must be either ACCEPTED or REJECTED.');
  }

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.gymMembership.findUnique({
      where: { id: requestId },
      include: {
        athlete: { include: { user: true } },
        gym: { include: { user: true } },
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const updatedRequest = await tx.gymMembership.update({
      where: { id: requestId },
      data: { status: status as JoinStatus },
    });

    // const notificationBody = {
    //   title: `Gym Membership Request ${status}`,
    //   body: `Your request to join ${request.gym.user.name} has been ${status.toLowerCase()}.`,
    // };
    // await notificationServices.sendSingleNotification({
    //   params: { userId: request.athlete.userId },
    //   body: notificationBody,
    // });

    return updatedRequest;
  });

  return updatedRequest;
};

const respondToGymJoinRequestCoach = async (
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED',
) => {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status. Must be either ACCEPTED or REJECTED.');
  }

  const updatedRequest = await prisma.$transaction(async (tx) => {
    const request = await tx.gymMembership.findUnique({
      where: { id: requestId },
      include: {
        coach: { include: { user: true } },
        gym: { include: { user: true } },
      },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    const updatedRequest = await tx.gymMembership.update({
      where: { id: requestId },
      data: { status: status as JoinStatus },
    });

    // const notificationBody = {
    //   title: `Gym Membership Request ${status}`,
    //   body: `Your request to join ${request.gym.user.name} has been ${status.toLowerCase()}.`,
    // };
    // await notificationServices.sendSingleNotification({
    //   params: { userId: request.athlete.userId },
    //   body: notificationBody,
    // });

    return updatedRequest;
  });

  return updatedRequest;
};

const getAllRequests = async (
  membershipId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.GymMembershipWhereInput = {
    gymId: membershipId,
  };

  const [result, total] = await prisma.$transaction([
    prisma.gymMembership.findMany({
      where: whereConditions,
      include: {
        User: true,
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
    })),
  };
};

const gymMembershipList = async (
  gymId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.GymMembershipWhereInput = {
    gymId: gymId,
    status: 'ACCEPTED',
  };

  const [result, total] = await prisma.$transaction([
    prisma.gymMembership.findMany({
      where: whereConditions,
      include: {
        user: true,
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
      profileImage: membership.user.profileImage,
    })),
  };
};

export const GymOwnerService = {
  getGymOwners,
  respondToGymJoinRequestAthlete,
  respondToGymJoinRequestCoach,
  getAllRequests,
  gymMembershipList,
};
