import express from 'express';
import authController from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';
import {
    registerValidation,
    loginValidation,
} from '../middlewares/validation.js';

const router = express.Router();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', auth, authController.logoutAll);

export default router;