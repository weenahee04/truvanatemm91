import { Router } from 'express';
import {
  getJackpots,
  getGameRules,
  getMyTickets,
  getMyOrders,
  purchaseTicket,
  checkResults,
  getDrawHistory,
  updateLottoOrderStatus,
} from '../controllers/lotto.controller';
import { authenticateToken, requireAnyAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/jackpots', getJackpots);
router.get('/rules', getGameRules);
router.get('/history/:gameType', getDrawHistory);

// Protected routes
router.get('/my-tickets', authenticateToken, getMyTickets);
router.get('/my-orders', authenticateToken, getMyOrders);
router.post('/purchase', authenticateToken, purchaseTicket);
router.get('/check/:ticketId', authenticateToken, checkResults);

// Admin: update lotto order status (writes to Firestore so customer sees it)
router.put('/orders/:id/status', authenticateToken, requireAnyAdmin, updateLottoOrderStatus);

export default router;
