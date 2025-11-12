import express, { Request, Response } from 'express';
import { RequestError } from '@database/models/errors';
import UserRepository from '@database/repositories/user';
import JsonApiResponse from '@models/jsonapi';
import AuthUtils from '@utils/security/auth';
import Constants from '@constants/shared';
import User from '@database/models/user';
import Utils from '@utils/utils';

/**
 * @description Fetch User Details by ID
 * @param request
 * @param response
 */
async function getUserById(request: Request, response: Response) {
    try {
        const user = await UserRepository.getUserDetails(request.params.id);
        response.status(200).json(new JsonApiResponse(user));
    } catch (error) {
        console.error(error);
        Utils.applyErrorToResponse(error, response);
    }
}

/**
 * @description Create a user record.
 * Inputs:
 * - Valid CSRF token
 * - JSON User payload
 * Logic:
 * - Validate CSRF token
 * - Ensure all required fields and no extra fields are present
 * - Ensure unique email
 * - Ensure secure password
 * - Create User record
 * Outputs:
 * - Record Id
 * - Auth Token
 * - CSRF Token
 * @param request
 * @param response
 */
async function createUser(request: Request, response: Response) {
    try {
        console.log('Session:', request.session);
        console.log('SessionID:', request.sessionID);
        if (!request.session?.id) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        if (!request.body) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.INVALID_PAYLOAD);
        }
        // TODO Change password length to dynamic from describe
        const inputUser: User = User.from(request.body);
        if (AuthUtils.preValidatePassword(inputUser.Password)) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.MALFORMED_PASSWORD);
        }
        const createdUser = await UserRepository.createUser(inputUser, request.body.Password);
        response.status(201).json({
            message: 'Success',
            data: createdUser
        });
    } catch (error) {
        Utils.applyErrorToResponse(error, response);
    }
}

/**
 * @description Create a user record.
 * Inputs:
 * - Valid CSRF token
 * - Valid ReCaptcha token
 * - JSON User payload (diff)
 * Logic:
 * - Validate CSRF token
 * - Validate ReCaptcha token
 * - Ensure only valid fields are present in payload
 * - Ensure unique email
 * - Ensure secure password
 * - Create User record
 * Outputs:
 * - Record Id
 * - Auth Token
 * - CSRF Token
 * @param request
 * @param response
 */
async function updateUser(request: Request, response: Response) {
    try {
        const inputUser = User.from(request.body);
        inputUser.Id = request.params.id;
        console.log('UPDATE USER', inputUser);
        const result = await UserRepository.updateUser(inputUser);

        response.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof RequestError) {
            if (error.statusCode) {
                statusCode = error.statusCode;
            }
        }
        response.status(statusCode).json({
            error: errorMessage
        });
    }
}

async function deactivateUser(request: Request, response: Response) {
    try {
        const payload = request.body;
        console.log('DEACTIVATE USER', payload, request.params);
        const userId = request.params.id;
        const result = await UserRepository.deactivateUser(userId);

        response.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof RequestError) {
            if (error.statusCode) {
                statusCode = error.statusCode;
            }
        }
        response.status(statusCode).json({
            error: errorMessage
        });
    }
}

async function deleteUser(request: Request, response: Response) {
    try {
        const userId = request.params.id;
        const user = await UserRepository.getUserDetails(userId);
        if (!user) {
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, `User with Id ${userId} not found.`);
        }
        const result = await UserRepository.deleteUser(userId);

        response.status(200).json({
            message: 'Success',
            data: result
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof RequestError) {
            if (error.statusCode) {
                statusCode = error.statusCode;
            }
        }
        response.status(statusCode).json({
            error: errorMessage
        });
    }
}

const router = express.Router();
router.post('/', createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/deactivate', deactivateUser);

export default router;
