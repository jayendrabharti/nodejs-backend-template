import express from 'express';
import authController from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', auth, authController.logoutAll);

export default router;