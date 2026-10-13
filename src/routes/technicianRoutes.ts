import { Router } from 'express';
import * as technicianController from '../controllers/technicianController';
import { authGuard } from '../middleware/authGuard';
import { roleGuard } from '../middleware/roleGuard';

// เฉพาะ role technician - ดูคิวงานจัดสเปคคอมที่รอประกอบ, รับงาน, อัปเดตสถานะประกอบ (assigned/assembling/completed/cancelled)
const router = Router();

router.use(authGuard, roleGuard(['technician']));

router.get('/queue', technicianController.showQueue);
router.get('/builds/:id', technicianController.showBuildDetail);
router.post('/builds/:id/claim', technicianController.claimBuild);
router.post('/builds/:id/status', technicianController.updateBuildStatus);

export default router;
