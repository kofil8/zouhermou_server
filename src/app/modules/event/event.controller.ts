import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventServices } from './event.service';
import pick from '../../../helpars/pick';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body.bodyData;
  const file = req.file as any;

  const result = await eventServices.createEventIntoDB(userId, payload, file);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const payload = req.body.bodyData;
  const file = req.file as any;
  const result = await eventServices.updateEventIntoDB(eventId, payload, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const userId = req.user.id;
  const result = await eventServices.deleteEventIntoDB(eventId, userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const result = await eventServices.getAllEventsFromDB(
    userId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All events retrieved successfully',
    data: result,
  });
});

const requestJoinEvent = catchAsync(async (req: Request, res: Response) => {
  const athleteId = req.user.id;
  const eventId = req.params.eventId;
  const result = await eventServices.requestJoinEvent(athleteId, eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event join request sent successfully',
    data: result,
  });
});

const responseEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { eventId, athleteId } = req.params;
  const { status } = req.body;
  const result = await eventServices.responseEventJoiningRequest(
    userId,
    eventId,
    athleteId,
    status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event join request responded successfully',
    data: result,
  });
});

const leaveEvent = catchAsync(async (req: Request, res: Response) => {
  const athleteId = req.user.id;
  const eventId = req.params.eventId;
  const result = await eventServices.leaveEvent(athleteId, eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Successfully left the event',
    data: result,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const result = await eventServices.getEventByIdFromDB(eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Single event retrieved successfully',
    data: result,
  });
});

const attendeesList = catchAsync(async (req: Request, res: Response) => {
  const eventId = req.params.eventId;
  const result = await eventServices.attendeesList(eventId);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Attendees list retrieved successfully',
    data: result,
  });
});

export const eventController = {
  createEvent,
  requestJoinEvent,
  leaveEvent,
  deleteEvent,
  updateEvent,
  responseEvent,
  getAllEvents,
  getSingleEvent,
  attendeesList,
};
