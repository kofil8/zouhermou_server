import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../../helpars/pick';
import { GymOwnerService, Filters } from './gym.service';

const getGymOwners = catchAsync(async (req, res) => {
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const filter = pick(req.query, [
    'searchTerm',
    'martialArts',
    'minDistance',
    'maxDistance',
    'userLatitude',
    'userLongitude',
  ]);

  const getGymOwners = await GymOwnerService.getGymOwners(
    paginationOptions,
    filter as Filters,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'GymOwners retrieved successfully',
    data: getGymOwners,
  });
});

const respondToGymJoinRequestAthlete = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const result = await GymOwnerService.respondToGymJoinRequestAthlete(
    requestId,
    status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Athlete Membership request handled successfully',
    data: result,
  });
});

const respondToGymJoinRequestCoach = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const result = await GymOwnerService.respondToGymJoinRequestAthlete(
    requestId,
    status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coach Membership request handled successfully',
    data: result,
  });
});

const getAllRequests = catchAsync(async (req, res) => {
  const { membershipId } = req.body;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const result = await GymOwnerService.getAllRequests(
    membershipId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All requests retrieved successfully',
    data: result,
  });
});

const gymMembershipList = catchAsync(async (req, res) => {
  const { gymId } = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const result = await GymOwnerService.gymMembershipList(
    gymId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym membership list retrieved successfully',
    data: result,
  });
});

export const GymOwnerController = {
  getGymOwners,
  respondToGymJoinRequestAthlete,
  respondToGymJoinRequestCoach,
  getAllRequests,
  gymMembershipList,
};
