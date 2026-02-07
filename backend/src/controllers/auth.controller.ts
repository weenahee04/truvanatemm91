import { Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { sendEmail } from '../utils/emailService';
import { getWelcomeEmail, getPasswordResetEmail } from '../utils/emailTemplates';

// Register new user (handled by Firebase client SDK)
// This is just for creating user profile in Firestore
export const createUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName, email, phone, role } = req.body;

    const userProfile = {
      userId,
      displayName,
      email,
      phone,
      role: role || 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userId).set(userProfile);

    // Send welcome email
    if (email && displayName) {
      try {
        const welcomeEmailHtml = getWelcomeEmail({
          userName: displayName,
          userEmail: email,
        });

        await sendEmail({
          to: email,
          toName: displayName,
          subject: 'ยินดีต้อนรับสู่ Truvamate! 🎉',
          html: welcomeEmailHtml,
        });

        logger.info(`Welcome email sent to ${email}`);
      } catch (emailError: any) {
        // Don't fail the registration if email fails
        logger.error('Failed to send welcome email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    logger.error('Error creating user profile:', error);
    next(error);
  }
};

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    logger.error('Error getting user profile:', error);
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { displayName, phone, address } = req.body;

    await db.collection('users').doc(userId).update({
      displayName,
      phone,
      address,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
};

// Set custom claims (admin only)
export const setCustomClaims = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Defensive (route already protected by requireSuperAdmin)
    const callerRole = String(req.user?.role || '').toLowerCase();
    if (callerRole !== 'admin' && callerRole !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden. Super Admin only.' });
    }

    const { userId, claims } = req.body;

    if (!userId || !claims) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role claim (if provided)
    if (claims.role) {
      const role = String(claims.role).toLowerCase();
      const allowedRoles = new Set([
        'user',
        'seller',
        'accounting',
        'admin_limited',
        'admin',
        'super_admin',
      ]);
      if (!allowedRoles.has(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      claims.role = role;
    }

    // Set custom claims in Firebase Auth
    await auth.setCustomUserClaims(userId, claims);

    // Update role in Firestore
    if (claims.role) {
      await db.collection('users').doc(userId).update({
        role: claims.role,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Custom claims updated',
    });
  } catch (error) {
    logger.error('Error setting custom claims:', error);
    next(error);
  }
};

// Delete user account
export const deleteUserAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Soft delete in Firestore
    await db.collection('users').doc(userId).update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    // Optionally delete from Firebase Auth (requires admin privileges)
    // await auth.deleteUser(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user account:', error);
    next(error);
  }
};

// Request password reset (send custom email)
export const requestPasswordReset = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      // Don't reveal if email exists for security
      // Return success message even if user doesn't exist
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }

    // Get user profile from Firestore
    let userName = 'ผู้ใช้';
    try {
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userName = userData?.displayName || userData?.name || userName;
      }
    } catch (error) {
      logger.warn('Could not fetch user profile for password reset email');
    }

    // Generate password reset link using Firebase
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: process.env.FRONTEND_URL || 'https://truvamate.com',
      handleCodeInApp: false,
    });

    // Send custom password reset email
    const resetEmailHtml = getPasswordResetEmail({
      userName,
      resetLink,
      expiryHours: 24,
    });

    await sendEmail({
      to: email,
      toName: userName,
      subject: 'รีเซ็ตรหัสผ่าน - Truvamate',
      html: resetEmailHtml,
    });

    logger.info(`Password reset email sent to ${email}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  } catch (error: any) {
    logger.error('Error requesting password reset:', error);
    
    // Don't reveal if email exists for security
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });
  }
};

// Upgrade current user to seller role
export const registerSeller = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set custom claims on Firebase Auth token
    await auth.setCustomUserClaims(userId, { role: 'seller' });

    // Update Firestore profile
    await db.collection('users').doc(userId).set({
      role: 'seller',
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({
      success: true,
      message: 'Seller role granted',
    });
  } catch (error) {
    logger.error('Error registering seller:', error);
    next(error);
  }
};
