import User from '../models/User.js';
import tokenServices from '../services/tokenService.js';
import { sendSuccess, sendError } from '../utils/responseHelpers.js';

class AuthController {
    async register(req, res) {
        try {
            const { email, password, name } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return sendError(res, 'User already exists with this email', 400);
            }

            const user = new User({
                email,
                password,
                name,
                providerTypes: ['email']
            });

            await user.save();

            const accessToken = tokenServices.generateAccessToken({
                id: user._id,
                email: user.email,
                role: user.role
            });

            const refreshToken = tokenServices.generateRefreshToken();
            await tokenServices.saveRefreshToken(
                user._id,
                refreshToken,
                req.get('User-Agent'),
                req.ip
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 7 days
            });

            return sendSuccess(res, 'User registered successfully', {
                user,
                refreshToken,
                accessToken
            }, 201);
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user || !(await user.comparePassword(password))) {
                return sendError(res, 'Invalid credentials', 401);
            }

            const accessToken = tokenServices.generateAccessToken({
                id: user._id,
                email: user.email,
                role: user.role
            });

            const refreshToken = tokenServices.generateRefreshToken();
            await tokenServices.saveRefreshToken(
                user._id,
                refreshToken,
                req.get('User-Agent'),
                req.ip
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7days
            });


            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 //15 min
            });

            return sendSuccess(res, 'Login successful', {
                user,
                refreshToken,
                accessToken
            });
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }


    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.headers['refreshtoken'];

            if (!refreshToken) {
                return sendError(res, 'Refresh token not provided', 401);
            }

            const tokenDoc = await tokenServices.validateRefreshToken(refreshToken);
            if (!tokenDoc) {
                return sendError(res, 'Invalid or expired refresh token', 401);
            }

            const user = tokenDoc.userId;
            const newAccessToken = tokenServices.generateAccessToken({
                id: user._id,
                email: user.email,
                role: user.role
            });

            // Optionally rotate refresh token
            const newRefreshToken = tokenServices.generateRefreshToken();
            await tokenServices.revokeRefreshToken(refreshToken);
            await tokenServices.saveRefreshToken(
                user._id,
                newRefreshToken,
                req.get('User-Agent'),
                req.ip
            );

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 7 days
            });

            return sendSuccess(res, 'Token refreshed successfully', {
                refreshToken: refreshToken,
                accessToken: newAccessToken
            });
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.cookies || req.headers['refreshToken'];

            if (refreshToken) {
                await tokenServices.revokeRefreshToken(refreshToken);
            }

            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return sendSuccess(res, 'Logout successful');
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

    async logoutAll(req, res) {
        try {
            await tokenServices.revokeAllUserTokens(req.user._id);
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return sendSuccess(res, 'Logged out from all devices');
        } catch (error) {
            return sendError(res, error.message, 500);
        }
    }

}

export default new AuthController();
