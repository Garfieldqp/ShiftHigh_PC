import { Router } from 'express';
import * as employeeAuthController from '../controllers/employeeAuthController';

// สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ ฝั่ง "พนักงาน" - สมัครเสร็จ role เริ่มที่ unassigned ต้องรอ admin อนุมัติก่อนใช้เมนูงานได้
const router = Router();

router.get('/login', employeeAuthController.showLoginForm);
router.post('/login', employeeAuthController.login);
router.get('/register', employeeAuthController.showRegisterForm);
router.post('/register', employeeAuthController.register);
router.post('/logout', employeeAuthController.logout);

export default router;
