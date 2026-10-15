import { AdjustmentType } from '../models/StockAdjustment';
import { queryOne, execute, withTransaction } from '../config/db';

// ปรับสต็อกสินค้าด้วยมือ (staff/admin เท่านั้น) - ไม่ใช่การตัดสต็อกจากการขาย (นั่นทำใน cartService.checkoutCart แทน)
// ทุกครั้งที่ปรับ ต้องบันทึกลง stock_adjustment เพื่อ audit ย้อนหลังได้เสมอว่าใครปรับอะไรเมื่อไหร่ (BR14)
/**
 * @param inputValue ความหมายต่างกันตาม type:
 *   - restock: จำนวนที่รับเข้ามาเพิ่ม (บวกเข้ากับสต็อกเดิม)
 *   - correction: ยอดสต็อกที่ถูกต้อง (ตั้งสต็อกให้เท่ากับค่านี้เป๊ะๆ เช่น นับของจริงแล้วไม่ตรงกับระบบ)
 */
export async function adjustStock(
  productId: number,
  employeeId: number,
  inputValue: number,
  type: AdjustmentType,
  note?: string
): Promise<void> {
  await withTransaction(async (conn) => {
    // อ่านสต็อกปัจจุบัน แล้วบันทึกยอดใหม่ + ประวัติการปรับ ใน transaction เดียวกัน (สำเร็จทั้งคู่หรือไม่เกิดเลย)
    const product = await queryOne<{ stock_quantity: number }>(
      'SELECT stock_quantity FROM product WHERE product_id = ?',
      [productId],
      conn
    );
    if (!product) throw new Error('ไม่พบสินค้านี้');

    if (!Number.isSafeInteger(inputValue) || inputValue < 0) throw new Error('Invalid stock quantity');
    let newStock: number;
    if (type === 'correction') {
      newStock = Math.max(0, inputValue);
    } else {
      newStock = Math.max(0, product.stock_quantity + inputValue);
    }
    // เก็บผลต่างจริงที่เกิดขึ้นไว้ audit ว่าเปลี่ยนไปเท่าไหร่
    const quantityChanged = newStock - product.stock_quantity;

    const changed = await execute('UPDATE product SET stock_quantity = ? WHERE product_id = ? AND stock_quantity = ?', [newStock, productId, product.stock_quantity], conn);
    if (changed.affectedRows !== 1) throw new Error('Stock changed; reload and retry');
    await execute(
      'INSERT INTO stock_adjustment (product_id, employee_id, quantity_changed, adjustment_type, note, adjusted_at) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, employeeId, quantityChanged, type, note ?? null, new Date()],
      conn
    );
  });
}

export async function listStockWithReservations() {
  const { query } = await import('../config/db');
  const products = await query('SELECT * FROM product ORDER BY product_id');
  const reserved = await query<{product_id: number; reserved: number}>(
    `SELECT bi.product_id, SUM(bi.quantity) AS reserved FROM build_item bi
     JOIN pc_build b ON b.build_id = bi.build_id
     WHERE b.status IN ('paid', 'assigned', 'assembling', 'completed') GROUP BY bi.product_id`);
  const totals = new Map(reserved.map(r => [r.product_id, Number(r.reserved)]));
  return products.map(p => ({...p, reserved_quantity: totals.get(p.product_id) ?? 0}));
}
