import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return this.providers.includes('email');
        },
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    providers: {
        type: [String],
        enum: ['email', 'google', 'phone'],
        default: ['email']
    },
    emailVerifiedAt: {
        type: mongoose.Schema.Types.Date,
    },
    phoneVerifiedAt: {
        type: mongoose.Schema.Types.Date,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); // Only hash if password is new or changed

    try {
        const salt = await bcrypt.genSalt(12);       // Generate salt with cost factor 12
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
        return next();
    } catch (error) {
        return next(error); // Properly pass error to next middleware
    }
});


// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Transform JSON output
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', UserSchema);

export default User;