import { SalesOrder } from '../models/SalesOrder';
import { OrderItem } from '../models/OrderItem';
import { Shipment } from '../models/Shipment';
import { query, queryOne } from '../config/db';

// มุมมองฝั่งลูกค้า: ดูรายการ/รายละเอียดคำสั่งซื้อของตัวเอง + ประวัติสถานะ (ต่างจาก staffService.ts ที่จัดการทุกออเดอร์ของทุกคน)
export interface CustomerOrderView extends SalesOrder {
  shipping_status: string | null; // มาจาก shipment (คนละตารางกับ sales_order) - null ถ้ายังไม่มีการจัดส่ง
}

// LEFT JOIN เพราะออเดอร์ที่ยังไม่จัดส่งจะยังไม่มีแถวใน shipment
const ORDER_WITH_SHIPPING = `
  SELECT o.*, s.shipping_status
  FROM sales_order o
  LEFT JOIN shipment s ON s.order_id = o.order_id`;

export async function listOrdersByCustomer(customerId: number): Promise<CustomerOrderView[]> {
  return query<CustomerOrderView>(`${ORDER_WITH_SHIPPING} WHERE o.customer_id = ? ORDER BY o.order_date DESC`, [
    customerId,
  ]);
}

export async function getOrderById(orderId: number): Promise<CustomerOrderView | null> {
  return queryOne<CustomerOrderView>(`${ORDER_WITH_SHIPPING} WHERE o.order_id = ?`, [orderId]);
}

export interface OrderStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
}

/**
 * ประกอบ "ประวัติสถานะ" ของคำสั่งซื้อสินค้าเดี่ยว (sales_order) จาก timestamp ที่มีอยู่จริงเท่านั้น
 * (order.order_date, shipment.shipped_date, shipment.delivered_date) - ไม่มีตารางเก็บ log แยกแบบ
 * build_status_history เพราะเอกสารออกแบบ (13 entity) ตั้งใจให้แค่งานจัดสเปคคอมมี log ละเอียดขนาดนั้น
 */
export function buildOrderStatusHistory(order: SalesOrder, shipment: Shipment | null): OrderStatusHistoryEntry[] {
  const history: OrderStatusHistoryEntry[] = [{ status: order.status, timestamp: order.order_date }];

  if (shipment) {
    if (shipment.shipping_status === 'delivered') {
      if (shipment.shipped_date) history.push({ status: 'shipped', timestamp: shipment.shipped_date });
      if (shipment.delivered_date) history.push({ status: 'delivered', timestamp: shipment.delivered_date });
    } else if (shipment.shipped_date) {
      history.push({ status: shipment.shipping_status, timestamp: shipment.shipped_date });
    }
  }

  return history;
}

export async function getPaymentMethodForOrder(orderId: number): Promise<string | null> {
  const row = await queryOne<{ payment_method: string }>('SELECT payment_method FROM payment WHERE order_id = ?', [
    orderId,
  ]);
  return row?.payment_method ?? null;
}

export async function getOrderItems(orderId: number): Promise<(OrderItem & { product_name: string })[]> {
  return query(
    `SELECT oi.order_id, oi.product_id, oi.quantity, oi.unit_price, p.product_name
     FROM order_item oi JOIN product p ON p.product_id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.product_id`,
    [orderId]
  );
}
