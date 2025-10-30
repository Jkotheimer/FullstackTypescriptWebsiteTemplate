/**
 * API V1 Router
 * @version 1.0.0
 */
import express from 'express';
import UsersApiV1 from '@api/v1/users/index';
import AuthApiV1 from '@api/v1/auth/index';

const router = express.Router();

router.use('/user', UsersApiV1);
router.use('/auth', AuthApiV1);

export default router;
