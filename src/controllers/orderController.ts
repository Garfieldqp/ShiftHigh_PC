import { Request, Response } from 'express';
import * as orderService from '../services/orderService';
import * as buildService from '../services/buildService';
import * as shipmentService from '../services/shipmentService';

// ประวัติคำสั่งซื้อ + หน้ายืนยัน/ติดตามสถานะ ฝั่งลูกค้า (ดูได้เฉพาะออเดอร์ของตัวเอง)
export async function listOrders(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const rawOrders = await orderService.listOrdersByCustomer(customerId);
  const builds = await buildService.listBuildsByCustomer(customerId);

  // แนบรายการสินค้า + ประวัติสถานะไปกับทุกออเดอร์เลย (ไม่ใช่แค่ตอนกดดูทีละใบ)
  // เพื่อให้หน้านี้กดขยายดูรายละเอียดในหน้าเดิมได้ทันที ไม่ต้องเปลี่ยนหน้าไปมาเวลาลูกค้าจำไม่ได้ว่าใบไหนคือใบที่ต้องการ
  const orders = await Promise.all(
    rawOrders.map(async (order) => {
      const [items, shipment] = await Promise.all([
        orderService.getOrderItems(order.order_id),
        shipmentService.getShipmentForOrder(order.order_id),
      ]);
      return { ...order, items, history: orderService.buildOrderStatusHistory(order, shipment) };
    })
  );

  res.render('orders/index', { title: 'ประวัติคำสั่งซื้อ', orders, builds });
}

export async function orderConfirmation(req: Request, res: Response) {
  const order = await orderService.getOrderById(Number(req.params.id));
  const items = order ? await orderService.getOrderItems(order.order_id) : [];
  const shipment = order ? await shipmentService.getShipmentForOrder(order.order_id) : null;
  const history = order ? orderService.buildOrderStatusHistory(order, shipment) : [];
  const paymentMethod = order ? await orderService.getPaymentMethodForOrder(order.order_id) : null;
  res.render('orders/confirmation', { title: 'ยืนยันคำสั่งซื้อ', order, items, history, paymentMethod });
}
