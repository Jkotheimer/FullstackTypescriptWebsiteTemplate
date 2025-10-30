import express, { Request, Response } from 'express';
import UserRepository, { UserAction } from '@database/repositories/user';
import { RequestError } from '@database/models/errors';
import Crypto from '@utils/security/crypto';
import UserModel from '@database/models/user';
import Constants from '@constants/shared';
import Auth from '@utils/security/auth';
import Utils from '@utils/utils';

const router = express.Router();

/**
 * @description Fetch User Details by ID
 * @param request
 * @param response
 */
async function login(request: Request, response: Response) {
    try {
        const clientId = request.header(Constants.HEADERS.CLIENT_ID);
        const inputUser = await UserModel.from(request.body);

        if (!clientId?.length) {
            throw new Error(Constants.ERROR_MESSAGES.INVALID_CLIENT_ID);
        }

        // Validate that request body only has email and password fields
        const fields = await UserRepository.getFieldDescribesFor(UserAction.AUTH);
        Utils.validateFields(inputUser, fields);

        // Validate password credentials
        const storedUser: UserModel = await UserRepository.getUserForAuthentication(inputUser.Email!);
        if (!Crypto.verifyPassword(inputUser.Password!, storedUser.Password!)) {
            throw new Error(Constants.ERROR_MESSAGES.INVALID_USER_CREDENTIALS);
        }

        const jwt = await Auth.issueTokenForUser(storedUser, clientId);

        response.status(200).json({
            message: 'Success',
            jwt
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

router.post('/login', login);

export default router;
