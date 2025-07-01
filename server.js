import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectToDB from './db/database.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import { sendSuccess } from './utils/responseHelpers.js';

dotenv.config();
const app = express();


// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(errorHandler);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
    return sendSuccess(res, "Server is Running");
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
