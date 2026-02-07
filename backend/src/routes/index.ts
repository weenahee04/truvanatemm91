import { Router } from 'express';
import authRoutes from './auth.routes';
import lottoRoutes from './lotto.routes';
import paymentRoutes from './payment.routes';
import referralRoutes from './referral.routes';
import orderRoutes from './order.routes';
import productRoutes from './product.routes';
import billingRoutes from './billing.routes';
import adminRoutes from './admin.routes';
import { getExchangeRate } from '../controllers/exchangeRate.controller';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/lotto', lottoRoutes);
router.use('/payments', paymentRoutes);
router.use('/referrals', referralRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/billing', billingRoutes);
router.get('/exchange-rate', getExchangeRate);

// Health check endpoint (for Railway, monitoring, etc.)
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info
router.get('/', (_req, res) => {
  res.json({
    message: 'Truvamate API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      lotto: '/api/lotto',
      payments: '/api/payments',
      referrals: '/api/referrals',
      orders: '/api/orders',
      products: '/api/products',
      billing: '/api/billing',
      exchangeRate: '/api/exchange-rate',
      health: '/api/health',
    },
  });
});

export default router;
