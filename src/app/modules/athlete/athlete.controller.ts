import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { athleteService, Filters } from './athlete.service';
import pick from '../../../helpars/pick';

const getAthletes = catchAsync(async (req, res) => {
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const filter = pick(req.query, [
    'searchTerm',
    'martialArts',
    'fighting',
    'height',
    'weight',
    'age',
    'gender',
    'minDistance',
    'maxDistance',
    'userLatitude',
    'userLongitude',
  ]);

  const athletes = await athleteService.getAthletes(
    paginationOptions,
    filter as Filters,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Athletes retrieved successfully',
    data: athletes,
  });
});

const sendCoachRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { coachId } = req.params;
  console.log(athleteId, coachId);
  const data = await athleteService.sendCoachRequest(athleteId, coachId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coach assigned request sent successfully',
    data,
  });
});

const removeCoach = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { coachRequestId } = req.params;
  const data = await athleteService.removeCoach(athleteId, coachRequestId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coach Request removed successfully',
    data,
  });
});

const sendGymJoinRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { gymId } = req.params;
  const data = await athleteService.sendGymJoinRequest(athleteId, gymId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym join request sent successfully',
    data,
  });
});

const cancelGymJoinRequest = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const { gymId } = req.params;

  const data = await athleteService.cancelGymJoinRequest(athleteId, gymId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym join request cancelled successfully',
    data,
  });
});

const fetchAssignedCoaches = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const data = await athleteService.fetchAssignedCoaches(
    athleteId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved assigned coach successfully',
    data,
  });
});

const fetchJoinedGyms = catchAsync(async (req, res) => {
  const athleteId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const data = await athleteService.fetchJoinedGyms(
    athleteId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved joined gyms successfully',
    data,
  });
});

export const AthleteController = {
  getAthletes,
  sendCoachRequest,
  removeCoach,
  sendGymJoinRequest,
  cancelGymJoinRequest,
  fetchAssignedCoaches,
  fetchJoinedGyms,
};
