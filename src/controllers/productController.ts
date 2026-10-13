import { Request, Response } from 'express';
import * as productService from '../services/productService';

// หน้าร้านค้า (public ไม่ต้อง login) - รายการสินค้า + หน้ารายละเอียดสินค้า
export async function listProducts(req: Request, res: Response) {
  // ดึงมาทั้งหมดครั้งเดียว แล้วให้หน้าเว็บกรอง/เรียง/ค้นหาฝั่ง client แทน (เห็นผลทันทีไม่ต้องโหลดหน้าใหม่)
  const products = await productService.listProducts();
  const categories = await productService.listCategories();
  const brands = await productService.listBrands();
  res.render('products/index', { title: 'สินค้าทั้งหมด', products, categories, brands });
}

export async function showProduct(req: Request, res: Response) {
  const product = await productService.getProductById(Number(req.params.id));
  res.render('products/show', { title: product ? product.product_name : 'ไม่พบสินค้า', product });
}
