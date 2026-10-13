import { PCBuild, PCBuildStatus } from '../models/PCBuild';
import { BuildItem } from '../models/BuildItem';
import { BuildStatusHistory } from '../models/BuildStatusHistory';
import { Product } from '../models/Product';
import { query, queryOne, execute, withTransaction } from '../config/db';
import * as shipmentService from './shipmentService';

// จัดการงานจัดสเปคคอม (pc_build) ทั้งหมด: สร้างงานใหม่, ให้ช่างรับงาน/อัปเดตสถานะ, ดูคิวงาน/ประวัติ
// ใช้ร่วมกันทั้งฝั่งลูกค้า (buildController), ช่าง (technicianController) และ staff (staffController)

// สถานะที่อะไหล่ "ถูกหักสต็อกไปแล้วแต่ยังอยู่ในร้าน" (จ่ายเงินแล้ว ยังไม่ส่งออก) = สต็อกที่จองไว้
const RESERVED_STATUSES: PCBuildStatus[] = ['paid', 'assigned', 'assembling', 'completed'];

export interface BuildCustomerContact {
  full_name: string;
  phone?: string;
  email: string;
}

// ให้ช่างเห็นข้อมูลติดต่อลูกค้า เผื่อประกอบแล้วมีปัญหา/มีคำถามต้องโทรถาม
export async function getBuildCustomerContact(buildId: number): Promise<BuildCustomerContact | null> {
  const row = await queryOne<{ full_name: string; phone: string | null; email: string }>(
    `SELECT c.full_name, c.phone, c.email
     FROM pc_build b JOIN customer c ON c.customer_id = b.customer_id
     WHERE b.build_id = ?`,
    [buildId]
  );
  if (!row) return null;
  return { full_name: row.full_name, phone: row.phone ?? undefined, email: row.email };
}

export async function createDraftBuild(
  customerId: number,
  buildName: string,
  rawItems: { product_id: number; quantity: number }[]
): Promise<PCBuild> {
  // รวมสินค้าซ้ำเป็นแถวเดียว เพราะ build_item ใช้ (build_id, product_id) เป็น composite key
  const merged = new Map<number, number>();
  rawItems.forEach((i) => merged.set(i.product_id, (merged.get(i.product_id) ?? 0) + i.quantity));
  const items = [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));

  if (items.length === 0) {
    throw new Error('กรุณาเลือกอะไหล่อย่างน้อย 1 ชิ้น'); // BR7
  }

  const buildId = await withTransaction(async (conn) => {
    const rows = await query<Product>(
      'SELECT product_id, price FROM product WHERE product_id IN (?)',
      [items.map((i) => i.product_id)],
      conn
    );
    const priceOf = new Map(rows.map((p) => [p.product_id, p.price]));

    let totalPrice = 0;
    for (const item of items) {
      const price = priceOf.get(item.product_id);
      if (price === undefined) throw new Error(`ไม่พบสินค้ารหัส ${item.product_id}`);
      totalPrice += price * item.quantity;
    }

    // build_date = เวลาปัจจุบันของ server เสมอ ลูกค้ากรอกเองไม่ได้ จึงไม่มีทางเป็นวันในอนาคต (BR25)
    const result = await execute(
      "INSERT INTO pc_build (customer_id, assigned_technician_id, build_name, build_date, status, total_price) VALUES (?, NULL, ?, ?, 'draft', ?)",
      [customerId, buildName, new Date(), totalPrice],
      conn
    );

    // unit_price = ราคา ณ ตอนสร้างงาน ล็อกไว้ตาม BR23 และ total_price คำนวณจากราคาชุดเดียวกันนี้
    for (const item of items) {
      await execute(
        'INSERT INTO build_item (build_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [result.insertId, item.product_id, item.quantity, priceOf.get(item.product_id)],
        conn
      );
    }
    return result.insertId;
  });

  return (await getBuildById(buildId))!;
}

export async function getBuildById(buildId: number): Promise<PCBuild | null> {
  return queryOne<PCBuild>('SELECT * FROM pc_build WHERE build_id = ?', [buildId]);
}

export async function listBuildsByCustomer(customerId: number): Promise<PCBuild[]> {
  // ไม่รวม draft เพราะยังไม่ได้ checkout จริง - ยังไม่ใช่ "คำสั่งซื้อ" ในทางความหมาย ควรอยู่ในตะกร้าแทน
  return query<PCBuild>(
    "SELECT * FROM pc_build WHERE customer_id = ? AND status <> 'draft' ORDER BY build_date DESC",
    [customerId]
  );
}

export async function listDraftBuildsNotInCart(customerId: number, cartBuildIds: Set<number>): Promise<PCBuild[]> {
  // เผื่อ draft หลุดออกจากตะกร้าไปแล้ว (เช่น ลูกค้ากด "ลบ" ในตะกร้าโดยไม่ได้ตั้งใจ) - ยังตามหากลับมาใส่ตะกร้าใหม่ได้จากหน้าตะกร้าเอง
  const drafts = await query<PCBuild>(
    "SELECT * FROM pc_build WHERE customer_id = ? AND status = 'draft' ORDER BY build_date DESC",
    [customerId]
  );
  return drafts.filter((b) => !cartBuildIds.has(b.build_id));
}

export async function getBuildItems(
  buildId: number
): Promise<(BuildItem & { product_name: string; unit_price: number })[]> {
  // ใช้ unit_price ที่บันทึกไว้ใน build_item (ราคา ณ ตอนสร้างงาน) ไม่ใช่ราคาปัจจุบันของสินค้า (BR23)
  return query(
    `SELECT bi.build_id, bi.product_id, bi.quantity, bi.unit_price, p.product_name
     FROM build_item bi JOIN product p ON p.product_id = bi.product_id
     WHERE bi.build_id = ?
     ORDER BY p.category_id, bi.product_id`,
    [buildId]
  );
}

export async function getBuildHistory(buildId: number): Promise<BuildStatusHistory[]> {
  return query<BuildStatusHistory>(
    'SELECT * FROM build_status_history WHERE build_id = ? ORDER BY updated_at, history_id',
    [buildId]
  );
}

export async function listQueueForTechnician(): Promise<PCBuild[]> {
  // งานจัดสเปคที่จ่ายเงินแล้วแต่ยังไม่มีช่างรับ
  return query<PCBuild>("SELECT * FROM pc_build WHERE status = 'paid' ORDER BY build_date");
}

export async function listBuildsByTechnician(technicianId: number): Promise<PCBuild[]> {
  // ประวัติงานทั้งหมดที่ช่างคนนี้เคยรับ (ทุกสถานะ) - ไม่ใช่แค่คิวที่ยังไม่มีคนรับ
  return query<PCBuild>('SELECT * FROM pc_build WHERE assigned_technician_id = ? ORDER BY build_date DESC', [
    technicianId,
  ]);
}

export async function assignTechnician(buildId: number, technicianId: number): Promise<void> {
  await withTransaction(async (conn) => {
    // UPDATE แบบมีเงื่อนไข status = 'paid' ทำให้ช่างสองคนกดรับงานเดียวกันพร้อมกันไม่ได้
    // คนที่สองจะได้ affectedRows = 0 เพราะสถานะเปลี่ยนเป็น 'assigned' ไปแล้ว (BR11: ช่างคนเดียวต่องาน)
    const result = await execute(
      "UPDATE pc_build SET assigned_technician_id = ?, status = 'assigned' WHERE build_id = ? AND status = 'paid'",
      [technicianId, buildId],
      conn
    );
    if (result.affectedRows === 0) {
      const exists = await queryOne('SELECT build_id FROM pc_build WHERE build_id = ?', [buildId], conn);
      if (!exists) throw new Error('ไม่พบงานนี้');
      throw new Error('งานนี้ถูกรับไปแล้วหรือยังไม่ได้จ่ายเงิน');
    }
    await execute(
      "INSERT INTO build_status_history (build_id, employee_id, status, updated_at, note) VALUES (?, ?, 'assigned', ?, 'ช่างรับงาน')",
      [buildId, technicianId, new Date()],
      conn
    );
  });
}

export async function updateBuildStatus(
  buildId: number,
  employeeId: number,
  status: PCBuildStatus,
  note?: string
): Promise<void> {
  await withTransaction(async (conn) => {
    const build = await queryOne<PCBuild>('SELECT * FROM pc_build WHERE build_id = ?', [buildId], conn);
    if (!build) throw new Error('ไม่พบงานนี้');

    // ยกเลิกงานที่จ่ายเงินแล้วแต่ยังไม่ส่งออก (ช่างกับลูกค้าตกลงกันว่าประกอบไม่ได้จริงๆ)
    // ต้องคืนสต็อกอะไหล่ที่หักไปตอน checkout กลับเข้าคลัง
    if (status === 'cancelled' && RESERVED_STATUSES.includes(build.status)) {
      const items = await query<BuildItem>('SELECT * FROM build_item WHERE build_id = ?', [buildId], conn);
      for (const item of items) {
        await execute(
          'UPDATE product SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id],
          conn
        );
      }
    }

    // เปลี่ยนสถานะปัจจุบัน + เขียนประวัติ 1 แถว ใน transaction เดียวกันเสมอ ทั้งสองจึงตรงกันตลอด
    await execute('UPDATE pc_build SET status = ? WHERE build_id = ?', [status, buildId], conn);
    await execute(
      'INSERT INTO build_status_history (build_id, employee_id, status, updated_at, note) VALUES (?, ?, ?, ?, ?)',
      [buildId, employeeId, status, new Date(), note ?? null],
      conn
    );

    // งานจัดสเปคมี shipment ของตัวเองได้ 1 รายการ สร้าง/อัปเดตตอนสถานะเปลี่ยนเป็นจัดส่ง (BR17)
    if (status === 'shipped' || status === 'delivered') {
      await shipmentService.setBuildShippingStatus(buildId, employeeId, status, conn);
    }
  });
}
