import jwt from "jsonwebtoken";
import { ENV_CONFIG } from "../config/envconfig.js";
import bcrypt from "bcryptjs";

export default class {
    static getBearerToken = (authHeader) => {
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7, authHeader.length);
        }
        return null;
    }

    static signPayload = (payload) => {
        // Implement token signing logic here (e.g., using JWT)
        return jwt.sign(payload, ENV_CONFIG.JWT_SECRET, { expiresIn: '1h' });
    }

    static verifyToken = (token) => {
        // Implement token verification logic here (e.g., using JWT)
        try {
            return jwt.verify(token, ENV_CONFIG.JWT_SECRET);
        } catch (err) {
            throw new Error('Invalid token');
        }
    }

    static hashPassword = (password) => {
        // Implement password hashing logic here (e.g., using bcrypt)
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    static comparePassword = (password, hashedPassword) => {
        // Implement password comparison logic here (e.g., using bcrypt)
        return bcrypt.compareSync(password, hashedPassword);
    }
}