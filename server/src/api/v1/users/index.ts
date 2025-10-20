import express, { Request, Response } from 'express';
import { DatabaseError, RequestError } from '@database/models/errors';
import UserRepository from '@database/repositories/user';
import Constants from '@constants';
import User from '@database/models/user';

const router = express.Router();

/**
 * @description Fetch User Details by ID
 * @param request
 * @param response
 */
async function getUserById(request: Request, response: Response) {
    try {
        console.log(request.params);
        const user = await UserRepository.getUserDetails(request.params.id);

        response.status(200).json({
            message: 'Success',
            data: user
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
        response.status(statusCode).send({
            message: errorMessage
        });
    }
}

/**
 * @description Create a user record.
 * Inputs:
 * - Valid CSRF token
 * - Valid ReCaptcha token
 * - JSON User payload
 * Logic:
 * - Validate CSRF token
 * - Validate ReCaptcha token
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
        console.log(request.session.id);
        if (!request.session.id) {
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        const inputUser: User = await User.from(request.body);
        //const createdUser = await UserRepository.createUser(inputUser);
        response.status(201).json({
            message: 'Success',
            data: inputUser
        });
    } catch (error) {
        console.error(error);
        let errorMessage = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let statusCode = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof DatabaseError) {
            errorMessage = error.message;
            switch (error.code) {
                case Constants.MYSQL_ERROR_CODES.ER_DUP_ENTRY:
                    statusCode = Constants.HTTP_STATUS_CODES.CONFLICT;
                    break;
            }
        }
        response.status(statusCode).json({
            message: errorMessage
        });
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
        const inputUser = await User.from(request.body);
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
        console.log('DELETE USER', payload, request.params);
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

router.post('/', createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/deactivate', deactivateUser);

export default router;
