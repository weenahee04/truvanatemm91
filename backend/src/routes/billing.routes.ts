import { Router } from 'express';
import { generateBillingPDF } from '../controllers/billing.controller';

const router = Router();
router.post('/generate', generateBillingPDF);
export default router;
