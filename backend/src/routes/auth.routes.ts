import { Router } from 'express';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  setCustomClaims,
  registerSeller,
  deleteUserAccount,
  requestPasswordReset,
} from '../controllers/auth.controller';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/password-reset', requestPasswordReset);

// Protected routes - all require Firebase auth
router.post('/profile', authenticateToken, createUserProfile);
router.get('/profile', authenticateToken, getUserProfile);
router.get('/me', authenticateToken, getUserProfile); // Alias for clients that expect /auth/me
router.put('/profile', authenticateToken, updateUserProfile);
router.delete('/account', authenticateToken, deleteUserAccount);
router.post('/register-seller', authenticateToken, registerSeller);

// Admin only
router.post('/set-claims', authenticateToken, requireSuperAdmin, setCustomClaims);

export default router;
