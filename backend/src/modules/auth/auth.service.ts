import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';

const SALT_ROUNDS = 10;

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
  id: string;
  email: string;
  imie: string;
  rola: string;
  aktywny: boolean;
  ostatnieLogowanie: Date | null;
  createdAt: Date;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare a password with its hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.aktywny) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Verify password
    const passwordMatch = await this.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { ostatnieLogowanie: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.rola);

    // Return token and user info (without password)
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      imie: user.imie,
      rola: user.rola,
      aktywny: user.aktywny,
      ostatnieLogowanie: user.ostatnieLogowanie,
      createdAt: user.createdAt,
    };

    return {
      token,
      user: userResponse,
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(userId: string, role: string): string {
    const payload: JWTPayload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    // Sign token using HS256 algorithm
    const token = jwt.sign(payload, env.jwtSecret);
    return token;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, env.jwtSecret) as JWTPayload;
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        imie: true,
        rola: true,
        aktywny: true,
        ostatnieLogowanie: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Użytkownik nie został znaleziony');
    }

    return user;
  }

  /**
   * Change password for a user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Użytkownik nie został znaleziony');
    }

    // Verify current password
    const passwordMatch = await this.comparePassword(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }
}

export const authService = new AuthService();
