import { Router } from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin, requireAnyAdmin } from '../middleware/auth';
import { refreshExchangeRateNow, getExchangeRateLogs } from '../controllers/exchangeRateAdmin.controller';
import { getPaymentSettings, updatePaymentSettings } from '../controllers/adminPaymentSettings.controller';
import { getPaymentIntentStatus } from '../controllers/payment.controller';
import { createAdminUser, updateUserRole, updateUserPassword, getLogs, logActivity } from '../controllers/adminUsers.controller';

const router = Router();
router.get('/payment-settings', authenticateToken, requireAdmin, getPaymentSettings);
router.get('/payment-intent/:paymentIntentId/status', authenticateToken, requireAdmin, getPaymentIntentStatus);
router.put('/payment-settings', authenticateToken, requireAdmin, updatePaymentSettings);
router.post('/exchange-rate/refresh', authenticateToken, requireAdmin, refreshExchangeRateNow);
router.get('/exchange-rate/logs', authenticateToken, requireAdmin, getExchangeRateLogs);
router.put('/users/:userId/role', authenticateToken, requireSuperAdmin, updateUserRole);
router.put('/users/:userId/password', authenticateToken, requireSuperAdmin, updateUserPassword);
router.post('/users/create', authenticateToken, requireSuperAdmin, createAdminUser);
router.get('/logs', authenticateToken, requireSuperAdmin, getLogs);
router.post('/log-activity', authenticateToken, requireAnyAdmin, logActivity);
export default router;
