import { Router } from 'express';
import * as productController from '../controllers/productController';

// public - ไม่ต้อง login
const router = Router();

router.get('/', productController.listProducts);
router.get('/:id', productController.showProduct);

export default router;
