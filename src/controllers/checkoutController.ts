import { Request, Response } from 'express';
import * as cartService from '../services/cartService';
import * as customerService from '../services/customerService';
import * as orderService from '../services/orderService';
import * as buildService from '../services/buildService';
import { PCBuild } from '../models/PCBuild';

// หน้า checkout - จุดที่เงินจริง (Payment) และคำสั่งซื้อจริง (SalesOrder/PCBuild) ถูกสร้างขึ้น

async function renderCheckout(res: Response, customerId: number, error: string | null) {
  const items = await cartService.viewCart(customerId);
  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  const customer = await customerService.getCustomerById(customerId);
  res.render('checkout/index', { title: 'ชำระเงิน', items, total, error, savedAddress: customer?.address || '' });
}

export async function showCheckout(req: Request, res: Response) {
  await renderCheckout(res, req.customer!.customer_id, null);
}

export async function processCheckout(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const shippingAddress = String(req.body.shipping_address || '').trim();
  const paymentMethod = req.body.payment_method === 'bank_transfer' ? 'bank_transfer' : 'cod';

  if (!shippingAddress) {
    return renderCheckout(res, customerId, 'กรุณากรอกที่อยู่จัดส่ง');
  }

  try {
    const result = await cartService.checkoutCart(customerId, shippingAddress, paymentMethod);

    // กรณีปกติที่สุด (ตะกร้ามีแค่สินค้าปกติ หรือแค่ชุดจัดสเปคคอมชุดเดียว) เด้งตรงไปหน้ารายละเอียดเลย
    if (result.order_id && result.build_ids.length === 0) {
      return res.redirect(`/orders/${result.order_id}`);
    }
    if (!result.order_id && result.build_ids.length === 1) {
      return res.redirect(`/build/${result.build_ids[0]}/status`);
    }

    // ตะกร้าผสม (มีทั้งสินค้าปกติ + ชุดจัดสเปคคอมอย่างน้อย 1 ชุดพร้อมกัน) หรือมีหลายชุดจัดสเปคพร้อมกัน
    // เด้งไปหน้าเดียวไม่พอ เพราะเดิมโค้ดจะเลือกโชว์แค่ order อย่างเดียวแล้วชุดจัดสเปคที่จ่ายไปด้วยหายไปเงียบๆ จากมุมมองลูกค้า
    // (จ่ายเงินจริงครบทุกอย่างแล้ว แค่หน้ายืนยันไม่เคยบอก) ต้องโชว์สรุปรวมทุกอย่างที่เพิ่งสั่งซื้อไปในครั้งเดียว
    if (result.order_id || result.build_ids.length > 0) {
      const order = result.order_id ? await orderService.getOrderById(result.order_id) : null;
      const buildResults = await Promise.all(result.build_ids.map((id) => buildService.getBuildById(id)));
      const builds = buildResults.filter((b): b is PCBuild => b !== null);
      return res.render('checkout/success', { title: 'สั่งซื้อสำเร็จ', order, builds });
    }

    return res.redirect('/orders');
  } catch (err: any) {
    return renderCheckout(res, customerId, err.message);
  }
}
