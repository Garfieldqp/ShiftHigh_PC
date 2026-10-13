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
  db: Db
): Promise<void> {
  const column = link.order_id !== null ? 'order_id' : 'build_id';
  const id = link.order_id ?? link.build_id;
  const existing = await queryOne<Shipment>(`SELECT * FROM shipment WHERE ${column} = ?`, [id], db);
  const now = new Date();

  if (!existing) {
    await execute(
      `INSERT INTO shipment (order_id, build_id, employee_id, courier_name, tracking_number, shipped_date, delivered_date, shipping_status)
       VALUES (?, ?, ?, '-', NULL, ?, ?, ?)`,
      [link.order_id, link.build_id, employeeId, now, shippingStatus === 'delivered' ? now : null, shippingStatus],
      db
    );
  } else if (shippingStatus === 'delivered') {
    await execute(
      'UPDATE shipment SET shipping_status = ?, delivered_date = ? WHERE shipment_id = ?',
      [shippingStatus, now, existing.shipment_id],
      db
    );
  } else {
    await execute('UPDATE shipment SET shipping_status = ? WHERE shipment_id = ?', [shippingStatus, existing.shipment_id], db);
  }
}

// เรียกจาก staff เท่านั้น (ดู staffController.updateOrderShipping) - สร้าง shipment ให้ order นี้ถ้ายังไม่มี
// แล้วอัปเดตสถานะจัดส่ง (แยกจาก sales_order.status เพราะเอกสารออกแบบตั้งใจแยก Shipment ออกมาต่างหาก)
// เก็บแค่ 3 สถานะ: เตรียมจัดส่ง / กำลังจัดส่ง / ถึงแล้ว - ไม่ถามบริษัทขนส่ง/เลขพัสดุ (ไม่จำเป็นสำหรับ scope ตอนนี้)
export async function setOrderShippingStatus(
  orderId: number,
  employeeId: number,
  shippingStatus: string
): Promise<void> {
  assertExactlyOneLink(orderId, null, 'Shipment (สินค้าปกติ)');
  await withTransaction((conn) => upsertShipment({ order_id: orderId, build_id: null }, employeeId, shippingStatus, conn));
}

// เรียกจาก buildService.updateBuildStatus ตอนสถานะงานเปลี่ยนเป็น shipped/delivered
// ส่ง conn ของ transaction เดียวกันมาด้วย เพื่อให้ pc_build.status กับ shipment เปลี่ยนพร้อมกันเสมอ
export async function setBuildShippingStatus(
  buildId: number,
  employeeId: number,
  shippingStatus: string,
  db?: Db
): Promise<void> {
  assertExactlyOneLink(null, buildId, 'Shipment (จัดสเปคคอม)');
  if (db) {
    await upsertShipment({ order_id: null, build_id: buildId }, employeeId, shippingStatus, db);
  } else {
    await withTransaction((conn) => upsertShipment({ order_id: null, build_id: buildId }, employeeId, shippingStatus, conn));
  }
}
