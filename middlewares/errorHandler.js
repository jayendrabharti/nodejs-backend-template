import { sendError } from '../utils/responseHelpers.js';

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return sendError(res, 'Validation Error', 400, errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return sendError(res, `${field} already exists`, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendError(res, 'Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired', 401);
    }

    // Default error
    sendError(res, 'Internal server error', 500);
};

export default errorHandler;