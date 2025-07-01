import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

class TokenService {
    generateAccessToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });
    }

    generateRefreshToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    async saveRefreshToken(userId, token, userAgent, ipAddress) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const refreshToken = new RefreshToken({
            token,
            userId,
            expiresAt,
            userAgent,
            ipAddress
        });

        await refreshToken.save();
        return refreshToken;
    }

    async validateRefreshToken(token) {
        return RefreshToken.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
        }).populate('userId');
    }

    async revokeRefreshToken(token) {
        return RefreshToken.updateOne(
            { token },
            { isRevoked: true }
        );
    }

    async revokeAllUserTokens(userId) {
        return RefreshToken.updateMany(
            { userId, isRevoked: false },
            { isRevoked: true }
        );
    }

    verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }
}

export default new TokenService();
