import { Router } from 'express';
import { LottoController } from '../controllers/lotto.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const lottoController = new LottoController();

// Public routes
router.get('/jackpots', lottoController.getJackpots);
router.get('/games', lottoController.getGameRules);
router.get('/draws/history', lottoController.getDrawHistory);
router.get('/draws/:gameType/:date', lottoController.getDrawResult);
router.post('/quick-pick', lottoController.generateQuickPick);

// Protected routes
router.post('/orders', authMiddleware, lottoController.createOrder);
router.get('/orders', authMiddleware, lottoController.getUserOrders);
router.get('/orders/:id', authMiddleware, lottoController.getOrder);
router.put('/orders/:id/cancel', authMiddleware, lottoController.cancelOrder);
router.get('/tickets', authMiddleware, lottoController.getUserTickets);
router.get('/tickets/:id', authMiddleware, lottoController.getTicket);

export default router;
