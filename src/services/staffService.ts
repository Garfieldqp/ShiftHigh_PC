import { SalesOrder, SalesOrderStatus } from '../models/SalesOrder';
import { PCBuild } from '../models/PCBuild';
import { Shipment } from '../models/Shipment';
import { query, execute } from '../config/db';
import { buildOrderStatusHistory, OrderStatusHistoryEntry } from './orderService';

// ฟังก์ชันที่ staff และ admin ใช้ร่วมกัน (order, build, report)

export interface StaffOrderItemView {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface StaffOrderView extends SalesOrder {
  customer_name: string;
  customer_phone?: string;
  items: StaffOrderItemView[];
  shipment: Shipment | null;
  history: OrderStatusHistoryEntry[];
}

/** จัดกลุ่มแถวตาม key (เช่น order_id) ให้หยิบรายการของแต่ละออเดอร์ได้ทันที */
function groupBy<T>(rows: T[], key: (row: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  rows.forEach((r) => {
    const k = key(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  });
  return map;
}

export async function listAllOrders(): Promise<StaffOrderView[]> {
  // ต้องดู/อัปเดตสถานะ sales_order แต่ละใบได้ ไม่ใช่แค่ดูรายงานสรุป
  // แนบข้อมูลลูกค้า (ชื่อ/เบอร์/ที่อยู่), รายการสินค้า, และ shipment (ถ้ามี) ไปด้วย ให้ staff เอาไปจัดส่งได้จริง
  const orders = await query<SalesOrder & { customer_name: string | null; customer_phone: string | null }>(
    `SELECT o.*, c.full_name AS customer_name, c.phone AS customer_phone
     FROM sales_order o LEFT JOIN customer c ON c.customer_id = o.customer_id
     ORDER BY o.order_date DESC`
  );
  const items = groupBy(
    await query<StaffOrderItemView & { order_id: number }>(
      `SELECT oi.order_id, oi.product_id, p.product_name, oi.quantity, oi.unit_price
       FROM order_item oi JOIN product p ON p.product_id = oi.product_id
       ORDER BY oi.order_id, oi.product_id`
    ),
    (r) => r.order_id
  );
  const shipments = new Map(
    (await query<Shipment>('SELECT * FROM shipment WHERE order_id IS NOT NULL')).map((s) => [s.order_id!, s])
  );

  return orders.map((order) => {
    const shipment = shipments.get(order.order_id) ?? null;
    return {
      ...order,
      customer_name: order.customer_name ?? 'ไม่พบลูกค้า',
      customer_phone: order.customer_phone ?? undefined,
      items: (items.get(order.order_id) ?? []).map(({ product_id, product_name, quantity, unit_price }) => ({
        product_id,
        product_name,
        quantity,
        unit_price,
      })),
      shipment,
      history: buildOrderStatusHistory(order, shipment),
    };
  });
}

export interface StaffBuildView extends PCBuild {
  customer_name: string;
  customer_phone?: string;
  items: StaffOrderItemView[];
  history: OrderStatusHistoryEntry[];
}

export async function listAllBuilds(): Promise<StaffBuildView[]> {
  // งานจัดสเปคคอมทุกงานที่จ่ายเงินแล้ว (ไม่รวม draft ที่ยังไม่ checkout) พร้อมรายละเอียดอะไหล่+ที่อยู่จัดส่ง
  const builds = await query<PCBuild & { customer_name: string | null; customer_phone: string | null }>(
    `SELECT b.*, c.full_name AS customer_name, c.phone AS customer_phone
     FROM pc_build b LEFT JOIN customer c ON c.customer_id = b.customer_id
     WHERE b.status <> 'draft'
     ORDER BY b.build_date DESC`
  );
  // unit_price มาจาก build_item (ราคา ณ ตอนสร้างงาน) ตาม BR23 ไม่ใช่ราคาปัจจุบันของสินค้า
  const items = groupBy(
    await query<StaffOrderItemView & { build_id: number }>(
      `SELECT bi.build_id, bi.product_id, p.product_name, bi.quantity, bi.unit_price
       FROM build_item bi JOIN product p ON p.product_id = bi.product_id
       ORDER BY bi.build_id, p.category_id`
    ),
    (r) => r.build_id
  );
  // งานจัดสเปคคอมมี build_status_history เก็บ log จริงอยู่แล้ว - แปลงให้เข้ารูปเดียวกับ order เพื่อใช้ partial ร่วมกัน
  const history = groupBy(
    await query<{ build_id: number; status: string; updated_at: Date; note: string | null }>(
      'SELECT build_id, status, updated_at, note FROM build_status_history ORDER BY updated_at, history_id'
    ),
    (r) => r.build_id
  );

  return builds.map((build) => ({
    ...build,
    customer_name: build.customer_name ?? 'ไม่พบลูกค้า',
    customer_phone: build.customer_phone ?? undefined,
    items: (items.get(build.build_id) ?? []).map(({ product_id, product_name, quantity, unit_price }) => ({
      product_id,
      product_name,
      quantity,
      unit_price,
    })),
    history: (history.get(build.build_id) ?? []).map((h) => ({
      status: h.status,
      timestamp: h.updated_at,
      note: h.note ?? undefined,
    })),
  }));
}

export async function updateOrderStatus(
  orderId: number,
  employeeId: number,
  status: SalesOrderStatus
): Promise<void> {
  const result = await execute('UPDATE sales_order SET status = ? WHERE order_id = ?', [status, orderId]);
  if (result.affectedRows === 0) throw new Error('ไม่พบคำสั่งซื้อนี้');
}

export interface SalesReport {
  total_revenue: number;
  total_orders: number;
  best_selling_products: { product_id: number; product_name: string; total_sold: number }[];
  top_revenue_products: { product_id: number; product_name: string; revenue: number }[];
}

// งานจัดสเปคที่นับเป็นยอดขาย = จ่ายเงินแล้วและไม่ถูกยกเลิก (draft ยังไม่จ่าย, cancelled คืนสต็อกไปแล้ว)
const SOLD_BUILD_STATUSES = ['paid', 'assigned', 'assembling', 'completed', 'shipped', 'delivered'];

type ProductTotal = { product_id: number; product_name: string; total_sold: number; revenue: number };

export async function getSalesReport(): Promise<SalesReport> {
  // รายงานสรุป - ข้อมูลรวมเท่านั้น ไม่ใช่การจัดการรายตัว (ดู listAllOrders สำหรับ CRUD รายใบ)
  const [orderTotals] = await query<{ revenue: number | null; orders: number }>(
    "SELECT SUM(total_amount) AS revenue, COUNT(*) AS orders FROM sales_order WHERE status = 'paid'"
  );
  const [buildTotals] = await query<{ revenue: number | null; builds: number }>(
    'SELECT SUM(total_price) AS revenue, COUNT(*) AS builds FROM pc_build WHERE status IN (?)',
    [SOLD_BUILD_STATUSES]
  );

  // ยอดขายรายสินค้า: ดึงจาก order_item และ build_item แยกกัน (JOIN + GROUP BY) แล้วรวมกันในโค้ด
  const fromOrders = await query<ProductTotal>(
    `SELECT p.product_id, p.product_name, SUM(oi.quantity) AS total_sold, SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_item oi
     JOIN product p ON p.product_id = oi.product_id
     GROUP BY p.product_id, p.product_name`
  );
  const fromBuilds = await query<ProductTotal>(
    `SELECT p.product_id, p.product_name, SUM(bi.quantity) AS total_sold, SUM(bi.quantity * bi.unit_price) AS revenue
     FROM build_item bi
     JOIN pc_build b ON b.build_id = bi.build_id
     JOIN product p ON p.product_id = bi.product_id
     WHERE b.status IN (?)
     GROUP BY p.product_id, p.product_name`,
    [SOLD_BUILD_STATUSES]
  );

  const totals = new Map<number, ProductTotal>();
  for (const row of [...fromOrders, ...fromBuilds]) {
    const current = totals.get(row.product_id) ?? { product_id: row.product_id, product_name: row.product_name, total_sold: 0, revenue: 0 };
    current.total_sold += Number(row.total_sold);
    current.revenue += Number(row.revenue);
    totals.set(row.product_id, current);
  }
  const all = [...totals.values()];

  const best_selling_products = [...all]
    .sort((a, b) => b.total_sold - a.total_sold || a.product_id - b.product_id)
    .slice(0, 5)
    .map(({ product_id, product_name, total_sold }) => ({ product_id, product_name, total_sold }));
  const top_revenue_products = [...all]
    .sort((a, b) => b.revenue - a.revenue || a.product_id - b.product_id)
    .slice(0, 5)
    .map(({ product_id, product_name, revenue }) => ({ product_id, product_name, revenue }));

  // จำนวนคำสั่งซื้อต้องนับรวมงานจัดสเปคคอมด้วย เพราะเป็นการสั่งซื้อเหมือนกัน (แค่เก็บคนละตารางตามที่เอกสารออกแบบไว้)
  return {
    total_revenue: Number(orderTotals.revenue ?? 0) + Number(buildTotals.revenue ?? 0),
    total_orders: Number(orderTotals.orders) + Number(buildTotals.builds),
    best_selling_products,
    top_revenue_products,
  };
}
