import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/order.controller';

const router = Router();

// Protected routes (require authentication)
router.use(authenticateToken);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

// Admin routes
router.get('/all', getAllOrders);
router.put('/:id/status', updateOrderStatus);

export default router;
