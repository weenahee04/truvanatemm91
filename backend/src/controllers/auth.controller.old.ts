import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, dateOfBirth } = req.body;

      // Check if user exists
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      // Check age (must be 20+)
      const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
      if (age < 20) {
        throw new AppError('Must be at least 20 years old', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
      });

      await this.userRepository.save(user);

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Registration failed', 500);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user with password
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password', 'fullName', 'role', 'status'],
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check account status
      if (user.status !== 'active') {
        throw new AppError('Account is suspended or banned', 403);
      }

      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip || '';
      await this.userRepository.save(user);

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500);
    }
  };

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: req.userId! },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({ user });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch user', 500);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const { fullName, phone, addressLine1, addressLine2, city, province, postalCode } = req.body;

      const user = await this.userRepository.findOne({
        where: { id: req.userId! },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update fields
      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;
      if (addressLine1) user.addressLine1 = addressLine1;
      if (addressLine2) user.addressLine2 = addressLine2;
      if (city) user.city = city;
      if (province) user.province = province;
      if (postalCode) user.postalCode = postalCode;

      await this.userRepository.save(user);

      res.json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update profile', 500);
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await this.userRepository.findOne({
        where: { id: req.userId! },
        select: ['id', 'password'],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 12);
      await this.userRepository.save(user);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to change password', 500);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void | Response> => {
    try {
      const { email } = req.body;

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If email exists, reset link has been sent' });
      }

      // TODO: Generate reset token and send email
      // For now, just respond
      res.json({ message: 'Password reset link has been sent to your email' });
    } catch (error) {
      throw new AppError('Failed to process request', 500);
    }
  };

  resetPassword = async (_req: Request, res: Response) => {
    try {
      // TODO: Implement password reset with token
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      throw new AppError('Failed to reset password', 500);
    }
  };

  logout = async (_req: AuthRequest, res: Response) => {
    try {
      // With JWT, logout is handled client-side by removing token
      // Could add token to blacklist here if needed
      res.json({ message: 'Logout successful' });
    } catch (error) {
      throw new AppError('Logout failed', 500);
    }
  };
}
