import { Router } from 'express';
import * as checkoutController from '../controllers/checkoutController';
import { customerAuthGuard } from '../middleware/customerAuthGuard';

// หน้า checkout - กรอกที่อยู่/เลือกวิธีชำระเงิน แล้วยืนยันจ่ายเงิน (สร้าง SalesOrder/PCBuild + Payment จริงตรงนี้)
const router = Router();

router.use(customerAuthGuard);

router.get('/', checkoutController.showCheckout);
router.post('/', checkoutController.processCheckout);

export default router;
