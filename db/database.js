import mongoose from 'mongoose';

const connectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected at ${conn.connection.host} to DB: ${conn.connection.name}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

export default connectToDB;