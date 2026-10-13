import { Router } from 'express';
import * as buildController from '../controllers/buildController';
import { customerAuthGuard } from '../middleware/customerAuthGuard';

// หน้า "จัดสเปคคอม" ฝั่งลูกค้า - เลือกอะไหล่ทีละหมวด, บันทึกลงตะกร้า, ดูสถานะงานประกอบ
const router = Router();

router.use(customerAuthGuard);

router.get('/', buildController.showBuildSelector);
router.post('/', buildController.saveBuildToCart);
router.get('/:id/status', buildController.showBuildStatus);

export default router;
