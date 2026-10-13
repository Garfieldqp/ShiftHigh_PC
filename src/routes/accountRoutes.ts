import { Router } from 'express';
import * as accountController from '../controllers/accountController';
import { customerAuthGuard } from '../middleware/customerAuthGuard';

// หน้าจัดการโปรไฟล์ของ "ลูกค้า" (แก้ข้อมูลส่วนตัว/เปลี่ยนรหัสผ่าน) - ต้อง login เป็นลูกค้าก่อนเสมอ
const router = Router();

router.use(customerAuthGuard);

router.get('/', accountController.showProfile);
router.post('/', accountController.updateProfile);
router.post('/password', accountController.changePassword);

export default router;
