import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { customerAuthGuard } from '../middleware/customerAuthGuard';

// ตะกร้าสินค้า (เก็บทั้งสินค้าปกติและชุดจัดสเปคคอมที่ยังไม่จ่ายเงินไว้ในนี้)
const router = Router();

router.use(customerAuthGuard);

router.get('/', cartController.viewCart);
router.post('/add', cartController.addToCart);
router.post('/add-build', cartController.addBuildToCart);
router.post('/update', cartController.updateQuantity);
router.post('/remove', cartController.removeFromCart);

export default router;
