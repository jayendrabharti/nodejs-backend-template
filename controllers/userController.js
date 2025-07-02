import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';
import fs from 'fs';
import path from 'path';
import tokenServices from '../services/tokenService.js'

class UserController {
    async getProfile(req, res) {
        try {
            return sendSuccess(res, 'Profile retrieved successfully', req.user);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, email } = req.body;
            const user = await User.findById(req.user._id);

            if (email && email !== user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return sendError(res, 'Email already in use', 400);
                }
                user.email = email;
            }

            if (name) user.name = name;

            await user.save();
            return sendSuccess(res, 'Profile updated successfully', user);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user._id);

            if (!(await user.comparePassword(currentPassword))) {
                return sendError(res, 'Current password is incorrect', 400);
            }

            user.password = newPassword;
            await user.save();

            return sendSuccess(res, 'Password changed successfully');
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async deleteAccount(req, res) {
        try {
            await User.findByIdAndDelete(req.user._id);
            await tokenServices.revokeAllUserTokens(req.user._id);

            res.clearCookie('refreshToken');
            return sendSuccess(res, 'Account deleted successfully');
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async updateProfileImage(req, res) {
        try {

            const imageLocalPath = req.file?.path;

            if (!imageLocalPath) {
                return sendError(res, "Avatar file is missing", 400);
            }

            // Save image to storage (e.g., move to /uploads/avatars)
            const storageDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
            if (!fs.existsSync(storageDir)) {
                fs.mkdirSync(storageDir, { recursive: true });
            }
            const fileExt = path.extname(imageLocalPath);
            const fileName = `${req.user._id}_${Date.now()}${fileExt}`;
            const destPath = path.join(storageDir, fileName);

            fs.copyFileSync(imageLocalPath, destPath);

            // Optionally, remove the temp file
            fs.unlinkSync(imageLocalPath);

            // Save the relative path or URL to the user
            const avatarUrl = `/uploads/avatars/${fileName}`;

            const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set: {
                        image: avatarUrl
                    }
                },
                { new: true }
            ).select("-password");

            return sendSuccess(res, "Avatar image updated successfully", user);
        } catch (error) {
            return sendError(res, error.message || "unable to upload image", 500);
        }
    }




}

export default new UserController();