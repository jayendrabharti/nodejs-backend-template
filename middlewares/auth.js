import jwt from 'jsonwebtoken';
import User from '../models/User.js'
import { sendError } from '../utils/responseHelpers.js'

export const auth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return sendError(res, 'Access denied. No token provided.', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return sendError(res, 'Invalid token.', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        sendError(res, 'Invalid token.', 401);
    }
};

export const adminAuth = async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        sendError(res, 'Access denied. Admin rights required.', 403);
    }
};
