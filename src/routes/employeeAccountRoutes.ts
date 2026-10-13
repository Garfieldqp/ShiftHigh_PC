import { Router } from 'express';
import * as employeeAccountController from '../controllers/employeeAccountController';
import { authGuard } from '../middleware/authGuard';

// เข้าได้ทุก role (รวม unassigned) - แค่ login เป็นพนักงานก็จัดการข้อมูลตัวเองได้ ไม่ต้องรอ admin อนุมัติก่อน
const router = Router();

router.use(authGuard);

router.get('/', employeeAccountController.showProfile);
router.post('/', employeeAccountController.updateProfile);
router.post('/password', employeeAccountController.changePassword);

export default router;
