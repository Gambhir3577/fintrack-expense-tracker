import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { AuthUserPayload } from '../types/index.js';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  private generateTokens(user: { id: string; email: string; name: string }) {
    const payload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as any,
    });

    return { accessToken, refreshToken };
  }

  async register(data: RegisterDTO) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      const error: any = new Error('An account with this email already exists.');
      error.status = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: data.name.trim(),
        avatarUrl: data.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens(user);

    // Save refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    return { user, tokens };
  }

  async login(data: LoginDTO) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.status = 401;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      const error: any = new Error('Invalid email or password.');
      error.status = 401;
      throw error;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    const tokens = this.generateTokens(safeUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    return { user: safeUser, tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthUserPayload;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        const error: any = new Error('Refresh token is invalid or expired.');
        error.status = 401;
        throw error;
      }

      // Rotate tokens
      const newTokens = this.generateTokens({
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
      });

      // Invalidate old token and record new token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      await prisma.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          token: newTokens.refreshToken,
          expiresAt: newExpiresAt,
        },
      });

      return newTokens;
    } catch (err: any) {
      const error: any = new Error('Invalid refresh token.');
      error.status = 401;
      throw error;
    }
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      } catch {
        // Idempotent logout
      }
    }
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const error: any = new Error('User not found.');
      error.status = 404;
      throw error;
    }

    return user;
  }
}

export const authService = new AuthService();
