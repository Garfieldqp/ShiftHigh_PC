import { Router } from 'express';
import * as staffController from '../controllers/staffController';
import { authGuard } from '../middleware/authGuard';
import { roleGuard } from '../middleware/roleGuard';

// staff และ admin เข้าถึงได้ทั้งคู่ (admin ทำได้ทุกอย่างที่ staff ทำได้ ดูเอกสารข้อ 2)
const router = Router();

router.use(authGuard, roleGuard(['staff', 'admin']));

router.get('/orders', staffController.listOrders);
router.post('/orders/:id/status', staffController.updateOrderStatus);
router.post('/orders/:id/shipping', staffController.updateOrderShipping);

router.post('/builds/:id/status', staffController.updateBuildStatus);

router.get('/stock', staffController.showStock);
router.post('/stock/adjust', staffController.adjustStock);

router.get('/reports', staffController.showReports);

export default router;
