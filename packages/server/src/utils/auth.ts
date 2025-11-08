import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {User} from '@tasksync/shared';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: { id: string; email: string }): string => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        JWT_SECRET,
        {expiresIn: '7d'}
    );
};

/**
 * Verify a JWT token and return the user data
 */
export const verifyToken = async (token: string): Promise<{ id: string; email: string } | null> => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        return decoded;
    } catch (error) {
        return null;
    }
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};
