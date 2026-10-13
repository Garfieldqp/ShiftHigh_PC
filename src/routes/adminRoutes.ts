import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authGuard } from '../middleware/authGuard';
import { roleGuard } from '../middleware/roleGuard';

// เฉพาะ admin เท่านั้น - จัดการสินค้า/หมวดหมู่/แบรนด์ + อนุมัติ/เปลี่ยน role/ปิดบัญชีพนักงาน
// (งานสต็อก/จัดส่ง/รายงาน/ออเดอร์ ย้ายไปอยู่ที่ staffRoutes.ts เพราะ staff เข้าได้ด้วย)
const router = Router();

router.use(authGuard, roleGuard(['admin']));

router.get('/products', adminController.showProductList);
router.get('/products/new', adminController.showNewProductForm);
router.post('/products', adminController.createProduct);
router.get('/products/:id/edit', adminController.showEditProductForm);
router.post('/products/:id', adminController.updateProduct);
router.post('/products/:id/deactivate', adminController.deactivateProduct);
router.post('/products/:id/reactivate', adminController.reactivateProduct);
router.get('/employees', adminController.showEmployees);
router.post('/employees/:id/approve', adminController.approveEmployee);
router.post('/employees/:id/role', adminController.changeEmployeeRole);
router.post('/employees/:id/disable', adminController.disableEmployee);
router.post('/employees/:id/enable', adminController.enableEmployee);

export default router;
