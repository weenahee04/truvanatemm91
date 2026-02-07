import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createReferralCode,
  validateReferralCode,
  registerReferral,
  getUserReferrals,
  getReferralStats,
  processCommission,
  getAllReferrals,
  markAsPaid,
  getSettings,
  updateSettings
} from '../controllers/referral.controller';

const router = Router();

// Public routes
router.post('/validate', validateReferralCode);

// Protected routes (require authentication)
router.use(authenticateToken);

router.post('/create', createReferralCode);
router.post('/register', registerReferral);
router.get('/my-referrals', getUserReferrals);
router.get('/my-stats', getReferralStats);
router.post('/process-commission', processCommission);

// Admin routes
router.get('/all', getAllReferrals);
router.post('/:id/mark-paid', markAsPaid);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
