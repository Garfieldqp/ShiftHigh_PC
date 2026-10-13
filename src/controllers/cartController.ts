import { Request, Response } from 'express';
import * as cartService from '../services/cartService';
import * as buildService from '../services/buildService';

// หน้าตะกร้าสินค้า - แสดง/แก้จำนวน/ลบ ทั้งสินค้าปกติและชุดจัดสเปคคอมที่ใส่ไว้
async function renderCart(res: Response, customerId: number, error: string | null) {
  const items = await cartService.viewCart(customerId);

  // เผื่อมีชุดจัดสเปค (draft) ที่หลุดออกจากตะกร้าไปแล้ว (เช่น เคยกดลบทิ้ง) - โชว์แยกไว้ให้กดใส่ตะกร้ากลับมาได้จากหน้านี้เลย
  const cartBuildIds = new Set(items.filter((i) => i.type === 'build').map((i) => i.ref_id));
  const orphanedDraftBuilds = await buildService.listDraftBuildsNotInCart(customerId, cartBuildIds);

  res.render('cart/index', { title: 'ตะกร้าสินค้า', items, orphanedDraftBuilds, error });
}

export async function viewCart(req: Request, res: Response) {
  await renderCart(res, req.customer!.customer_id, null);
}

export async function updateQuantity(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity) || 0;
  await cartService.updateProductQuantity(customerId, productId, quantity);
  res.redirect('/cart');
}

export async function addToCart(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const productId = Number(req.body.product_id);
  const quantity = Math.max(1, Number(req.body.quantity) || 1);
  try {
    await cartService.addProductToCart(customerId, productId, quantity);
    res.redirect('/cart');
  } catch (err: any) {
    // แจ้ง error ให้เห็นจริงที่หน้าตะกร้า (เช่น ของเหลือไม่พอ) แทนที่จะเงียบแล้วเด้งกลับเฉยๆ เหมือนเดิม
    await renderCart(res, customerId, err.message);
  }
}

export async function addBuildToCart(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const buildId = Number(req.body.build_id);
  try {
    await cartService.addBuildToCart(customerId, buildId);
    res.redirect('/cart');
  } catch (err: any) {
    await renderCart(res, customerId, err.message);
  }
}

export async function removeFromCart(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const type = req.body.type === 'build' ? 'build' : 'product';
  const refId = Number(req.body.ref_id);
  await cartService.removeFromCart(customerId, type, refId);
  res.redirect('/cart');
}
