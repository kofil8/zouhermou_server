import { Request, Response } from 'express';
import { sparringRequestService } from './sparringRequest.service';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import pick from '../../../helpars/pick';

const createSparringRequest = catchAsync(
  async (req: Request, res: Response) => {
    const senderId = req.user.id;
    const { receiverId } = req.params;
    const sparringRequest = await sparringRequestService.createSparringRequest(
      senderId,
      receiverId,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Sparring Request sent successfully.',
      data: sparringRequest,
    });
  },
);

const deleteSparringRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { requestId } = req.params;

    const sparringRequest = await sparringRequestService.deleteSparringRequest(
      userId,
      requestId,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Sparring request deleted successfully.',
      data: sparringRequest,
    });
  },
);

const deleteSparringRequestProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { viewProfileId } = req.params;

    const sparringRequest =
      await sparringRequestService.deleteSparringRequestProfile(
        userId,
        viewProfileId,
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Sparring request deleted successfully.',
      data: sparringRequest,
    });
  },
);

const acceptSparringRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { requestId } = req.params;
    const sparringRequest = await sparringRequestService.acceptSparringRequest(
      userId,
      requestId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Successfully added the user to sparring list.',
      data: sparringRequest,
    });
  },
);

const rejectSparringRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { requestId } = req.params;
    const sparringRequest = await sparringRequestService.rejectSparringRequest(
      userId,
      requestId,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Sparring request rejected successfully.',
      data: sparringRequest,
    });
  },
);

const getSparringSuggestions = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const paginationOptions = pick(req.query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);

    const sparringSuggestions =
      await sparringRequestService.getSparringSuggestions(
        userId,
        paginationOptions,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Suggestions retrieved successfully.',
      data: sparringSuggestions,
    });
  },
);

const getSparringList = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const sparringList = await sparringRequestService.getSparringList(
    userId,
    paginationOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Athletes retrieved successfully.',
    data: sparringList,
  });
});

const getSparringRequests = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);

  const sparringRequests = await sparringRequestService.getSparringRequests(
    userId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sparring requests retrieved successfully.',
    data: sparringRequests,
  });
});

export const sparringRequestController = {
  createSparringRequest,
  deleteSparringRequest,
  deleteSparringRequestProfile,
  acceptSparringRequest,
  rejectSparringRequest,
  getSparringSuggestions,
  getSparringList,
  getSparringRequests,
};
