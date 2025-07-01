import express from 'express';
import userController from '../controllers/userController.js';
import { auth } from '../middlewares/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/profile', userController.getProfile);

router.put('/profile', [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    validateRequest
], userController.updateProfile);

router.put('/change-password', [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    validateRequest
], userController.changePassword);

router.put('/profile-image', upload.single("profile-image"), userController.updateProfileImage)

router.delete('/account', userController.deleteAccount);

export default router;