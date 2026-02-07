import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Protected routes
router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.post('/promptpay', authMiddleware, paymentController.generatePromptPayQR);
router.get('/:id/status', authMiddleware, paymentController.getPaymentStatus);

// Webhook (no auth - verified by signature)
router.post('/webhook', paymentController.handleWebhook);

export default router;
