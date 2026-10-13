import { Router } from 'express';
import * as customerAuthController from '../controllers/customerAuthController';

// สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ ฝั่ง "ลูกค้า" (คนละระบบ auth กับพนักงาน แยก JWT คนละชุด)
const router = Router();

router.get('/login', customerAuthController.showLoginForm);
router.post('/login', customerAuthController.login);
router.get('/register', customerAuthController.showRegisterForm);
router.post('/register', customerAuthController.register);
router.post('/logout', customerAuthController.logout);

export default router;
