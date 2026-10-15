import { Shipment } from '../models/Shipment';
import { queryOne, execute, withTransaction, Db } from '../config/db';
import { assertExactlyOneLink } from '../utils/validate';

export async function getShipmentForOrder(orderId: number): Promise<Shipment | null> {
  return queryOne<Shipment>('SELECT * FROM shipment WHERE order_id = ?', [orderId]);
}

export async function getShipmentForBuild(buildId: number): Promise<Shipment | null> {
  return queryOne<Shipment>('SELECT * FROM shipment WHERE build_id = ?', [buildId]);
}

/**
 * สร้าง shipment ให้ order หรือ build ถ้ายังไม่มี แล้วอัปเดตสถานะจัดส่ง
 * order หรือ build หนึ่งรายการมี shipment ได้ไม่เกิน 1 รายการ (BR17) - เช็คก่อนเสมอว่ามีแล้วหรือยัง ถ้ามีแล้วแค่อัปเดต
 * และ shipment ต้องผูกกับ order หรือ build อย่างใดอย่างหนึ่งเท่านั้น (BR19 - CHECK ใน schema)
 */
async function upsertShipment(
  link: { order_id: number | null; build_id: number | null },
  employeeId: number,
  shippingStatus: string,
  db: Db,
  shipping?: { courier_name: string; tracking_number: string }
): Promise<void> {
  const column = link.order_id !== null ? 'order_id' : 'build_id';
  const id = link.order_id ?? link.build_id;
  const parentTable = link.order_id !== null ? 'sales_order' : 'pc_build';
  // Serialize shipment creation using the parent row, without changing the schema.
  await execute(`UPDATE ${parentTable} SET ${column} = ${column} WHERE ${column} = ?`, [id], db);
  const existing = await queryOne<Shipment>(`SELECT * FROM shipment WHERE ${column} = ?`, [id], db);
  if (!['preparing', 'shipped', 'delivered'].includes(shippingStatus)) throw new Error('Invalid shipping status');
  if (existing && (existing.shipping_status === 'delivered' && shippingStatus !== 'delivered' || existing.shipping_status === 'shipped' && shippingStatus === 'preparing')) throw new Error('Invalid shipping transition');
  if (shipping && (shipping.courier_name.length > 100 || shipping.tracking_number.length > 100)) throw new Error('Shipping details too long');
  const now = new Date();

  if (!existing) {
    await execute(
      `INSERT INTO shipment (order_id, build_id, employee_id, courier_name, tracking_number, shipped_date, delivered_date, shipping_status)
       VALUES (?, ?, ?, '-', NULL, ?, ?, ?)`,
      [link.order_id, link.build_id, employeeId, shippingStatus === 'preparing' ? null : now, shippingStatus === 'delivered' ? now : null, shippingStatus],
      db
    );
  } else if (shippingStatus === 'delivered') {
    await execute(
      'UPDATE shipment SET shipping_status = ?, delivered_date = ? WHERE shipment_id = ?',
      [shippingStatus, now, existing.shipment_id],
      db
    );
  } else {
    await execute('UPDATE shipment SET shipping_status = ?, shipped_date = COALESCE(shipped_date, ?) WHERE shipment_id = ?', [shippingStatus, shippingStatus === 'shipped' ? now : null, existing.shipment_id], db);
  }
  if (shipping) {
    await execute(`UPDATE shipment SET courier_name = ?, tracking_number = ? WHERE ${column} = ?`,
      [shipping.courier_name.trim() || '-', shipping.tracking_number.trim() || null, id], db);
  }
}

// เรียกจาก staff เท่านั้น (ดู staffController.updateOrderShipping) - สร้าง shipment ให้ order นี้ถ้ายังไม่มี
// แล้วอัปเดตสถานะจัดส่ง (แยกจาก sales_order.status เพราะเอกสารออกแบบตั้งใจแยก Shipment ออกมาต่างหาก)
// เก็บสถานะและข้อมูลบริษัทขนส่ง/เลขพัสดุ โดยใช้คอลัมน์เดิมของ ERD
export async function setOrderShippingStatus(
  orderId: number,
  employeeId: number,
  shippingStatus: string,
  shipping?: { courier_name: string; tracking_number: string }
): Promise<void> {
  assertExactlyOneLink(orderId, null, 'Shipment (สินค้าปกติ)');
  await withTransaction((conn) => upsertShipment({ order_id: orderId, build_id: null }, employeeId, shippingStatus, conn, shipping));
}

// เรียกจาก buildService.updateBuildStatus ตอนสถานะงานเปลี่ยนเป็น shipped/delivered
// ส่ง conn ของ transaction เดียวกันมาด้วย เพื่อให้ pc_build.status กับ shipment เปลี่ยนพร้อมกันเสมอ
export async function setBuildShippingStatus(
  buildId: number,
  employeeId: number,
  shippingStatus: string,
  db?: Db,
  shipping?: { courier_name: string; tracking_number: string }
): Promise<void> {
  assertExactlyOneLink(null, buildId, 'Shipment (จัดสเปคคอม)');
  if (db) {
    await upsertShipment({ order_id: null, build_id: buildId }, employeeId, shippingStatus, db, shipping);
  } else {
    await withTransaction((conn) => upsertShipment({ order_id: null, build_id: buildId }, employeeId, shippingStatus, conn, shipping));
  }
}
