import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../../helpars/pick';
import { CoachesService, Filters } from './coach.service';

const getCoaches = catchAsync(async (req, res) => {
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const filter = pick(req.query, [
    'searchTerm',
    'martialArts',
    'age',
    'gender',
    'experience',
    'minDistance',
    'maxDistance',
    'userLatitude',
    'userLongitude',
  ]);

  const coaches = await CoachesService.getCoaches(
    paginationOptions,
    filter as Filters,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coaches retrieved successfully',
    data: coaches,
  });
});

const resposndToAthlete = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  const result = await CoachesService.respondToCoachRequest(requestId, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Successfully responded to athlete',
    data: result,
  });
});

const sendGymJoinRequest = catchAsync(async (req, res) => {
  const coachId = req.user.id;
  const { gymId } = req.params;
  const data = await CoachesService.sendGymJoinRequest(coachId, gymId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Gym join request sent successfully',
    data,
  });
});

const getAssignedAthletes = catchAsync(async (req, res) => {
  const coachId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const data = await CoachesService.fetchAssignedAthletes(
    coachId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved assigned athletes successfully',
    data,
  });
});

const getJoinedGyms = catchAsync(async (req, res) => {
  const coachId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const data = await CoachesService.fetchJoinedGyms(coachId, paginationOptions);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Retrieved joined gyms successfully',
    data,
  });
});

export const CoachesController = {
  getCoaches,
  resposndToAthlete,
  sendGymJoinRequest,
  getAssignedAthletes,
  getJoinedGyms,
};
