import {
  FightingStatus,
  Gender,
  JoinStatus,
  MartialType,
  Prisma,
} from '@prisma/client';
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
  fighting?: FightingStatus;
  height?: number;
  weight?: number;
  age?: number;
  gender?: Gender;
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

const getAthletes = async (
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

  const andConditions: Prisma.AthleteWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { experience: { contains: searchTerm, mode: 'insensitive' } },
        { titles: { contains: searchTerm, mode: 'insensitive' } },
        { reach: { contains: searchTerm, mode: 'insensitive' } },
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

    const athletes = await prisma.athlete.findMany({
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

    const filteredAthletes = athletes.filter((athlete) => {
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        athlete.user.latitude as number,
        athlete.user.longitude as number,
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
                filteredAthletes[0].user.latitude as number,
                filteredAthletes[0].user.longitude as number,
              ),
            },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.AthleteWhereInput = {
    AND: andConditions.length > 0 ? andConditions : undefined,
  };

  const validSortFields = [
    'id',
    'userId',
    'fighting',
    'martialArts',
    'experience',
    'gender',
    'country',
    'height',
    'weight',
    'age',
    'wins',
    'losses',
    'draws',
    'titles',
    'reach',
    'fightingStances',
  ];

  if (!validSortFields.includes(sortBy)) {
    throw new Error(`Invalid sortBy field: ${sortBy}`);
  }

  const [result, total] = await prisma.$transaction([
    prisma.athlete.findMany({
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
    prisma.athlete.count({
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
      name: athlete.user.name,
      experience: athlete.experience,
      titles: athlete.titles,
      reach: athlete.reach,
      martialArts: athlete.martialArts,
      fighting: athlete.fighting,
      gender: athlete.gender,
      country: athlete.country,
      height: athlete.height,
      weight: athlete.weight,
      age: athlete.age,
      wins: athlete.wins,
      losses: athlete.losses,
      draws: athlete.draws,
      fightingStances: athlete.fightingStances,
    })),
  };
};

const sendCoachRequest = async (athleteId: string, coachId: string) => {
  const [athlete, coach] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        userId: athleteId,
      },
      include: {
        user: true,
      },
    }),
    prisma.coach.findUnique({
      where: {
        id: coachId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!coach) {
    throw new Error('Coach not found');
  }

  const existingRequest = await prisma.coachRequest.findUnique({
    where: {
      athleteId_coachId: {
        athleteId: athlete.id,
        coachId: coach.id,
      },
    },
  });

  if (existingRequest && existingRequest.status === JoinStatus.PENDING) {
    throw new Error('A pending request already exists');
  }

  const result = await prisma.coachRequest.create({
    data: {
      athleteId: athlete.id,
      coachId: coach.id,
      status: JoinStatus.PENDING,
    },
  });

  // Optionally, send a notification to the coach
  // const notificationBody: NotificationBody = {
  //   title: 'New Coach Request',
  //   body: `${athlete.user.name} has sent you a request to become their coach.`,
  // };
  // await notificationServices.sendSingleNotification({
  //   params: {
  //     userId: coach.userId,
  //   },
  //   body: notificationBody,
  // });

  return result;
};

const removeCoach = async (athleteId: string, coachRequestId: string) => {
  const [athlete, coachRequest] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.coachRequest.findUnique({
      where: {
        id: coachRequestId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!coachRequest) {
    throw new Error('Coach Request not found');
  }

  const result = await prisma.coachRequest.delete({
    where: {
      id: coachRequestId,
    },
  });

  return result;
};

const sendGymJoinRequest = async (athleteId: string, gymId: string) => {
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
  });

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  const existingRequest = await prisma.gymMembership.findUnique({
    where: {
      athleteId_gymId: {
        athleteId: athlete.id,
        gymId: gymId,
      },
    },
  });

  if (existingRequest && existingRequest.status === JoinStatus.PENDING) {
    throw new Error('A pending request already exists');
  }

  const result = await prisma.gymMembership.create({
    data: {
      athleteId: athlete.id,
      gymId: gymId,
      status: JoinStatus.PENDING,
    },
  });

  // Optionally, send a notification to the gym owner
  // const notificationBody: NotificationBody = {
  //   title: 'New Gym Membership Request',
  //   body: `${athlete.user.name} has requested to join your gym.`,
  // };
  // await notificationServices.sendSingleNotification({
  //   params: {
  //     userId: gym.userId,
  //   },
  //   body: notificationBody,
  // });

  return result;
};
const cancelGymJoinRequest = async (athleteId: string, gymId: string) => {
  const [athlete, gym] = await prisma.$transaction([
    prisma.athlete.findUnique({
      where: {
        id: athleteId,
      },
    }),
    prisma.gym.findUnique({
      where: {
        id: gymId,
      },
    }),
  ]);

  if (!athlete) {
    throw new Error('Athlete not found');
  }

  if (!gym) {
    throw new Error('Gym not found');
  }

  const result = prisma.gymMembership.deleteMany({
    where: {
      userId: athleteId,
      gymId: gymId,
    },
  });

  return result;
};

const fetchAssignedCoaches = async (
  athleteId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.AthleteWhereInput = {
    id: athleteId,
  };

  const [result, total] = await prisma.$transaction([
    prisma.athlete.findMany({
      where: whereConditions,
      include: {
        coach: true,
      },
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.athlete.count({
      where: whereConditions,
    }),
  ]);

  const meta = {
    page,
    limit,
    total_docs: total,
    total_pages: Math.ceil(total / limit),
  };

  return [
    meta,
    result.map((coach) => ({
      id: coach.id,
      name: coach.coach?.bio,
      martialArts: coach.coach?.martialArts,
      yearesOfExp: coach.coach?.country,
    })),
  ];
};

const fetchJoinedGyms = async (
  athleteId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: Prisma.GymMembershipWhereInput = {
    userId: athleteId,
    status: 'ACCEPTED',
  };

  const [result, total] = await prisma.$transaction([
    prisma.gymMembership.findMany({
      where: whereConditions,
      include: {
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

  return [
    meta,
    result.map((gym) => ({
      id: gym.id,
      country: gym.gym.country,
      location: gym.gym.location,
    })),
  ];
};

export const athleteService = {
  getAthletes,
  sendCoachRequest,
  removeCoach,
  sendGymJoinRequest,
  cancelGymJoinRequest,
  fetchAssignedCoaches,
  fetchJoinedGyms,
};
