import jwt from 'jsonwebtoken';
import { UserProps } from "../types";

export const generateToken = (user: UserProps) => {
    const payload = {
        user: {
            id: user._id, 
            name: user.name,
            email: user.email,
            avatar: user.avatar
        }
    };

    // JWT_SECRET না পেলে ডিফল্ট সিক্রেট কী ব্যবহার করবে
    const secretKey = process.env.JWT_SECRET || "my_secret_key_123456789";

    return jwt.sign(payload, secretKey, {
        expiresIn: '30d', 
    });
};