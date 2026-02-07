import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentIntentStatus,
  handleWebhook,
  createCheckoutSession,
  verifyCheckoutSession,
} from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Webhook MUST be defined first (before parameterized routes)
// Webhook (no auth - validated by payment gateway signature)
// Explicitly handle OPTIONS for webhook endpoint (CORS preflight)
router.options('/webhook', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).send();
});
router.post('/webhook', handleWebhook);

// Stripe Checkout Session routes
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);
router.get('/verify-session/:sessionId', authenticateToken, verifyCheckoutSession);

// Protected routes
router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/:paymentId/confirm', authenticateToken, confirmPayment);
router.get('/intent/:paymentIntentId/status', authenticateToken, getPaymentIntentStatus);
router.get('/history', authenticateToken, getPaymentHistory);

export default router;
