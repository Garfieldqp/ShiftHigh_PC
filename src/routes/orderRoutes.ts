import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { customerAuthGuard } from '../middleware/customerAuthGuard';

// ประวัติคำสั่งซื้อ + หน้ายืนยัน/ติดตามสถานะ ฝั่งลูกค้า (ดูได้แค่ออเดอร์ของตัวเองเท่านั้น)
const router = Router();

router.use(customerAuthGuard);

router.get('/', orderController.listOrders);
router.get('/:id', orderController.orderConfirmation);

export default router;
