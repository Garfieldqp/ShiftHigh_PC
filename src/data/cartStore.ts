/**
 * ตะกร้าสินค้า "ไม่ใช่" 1 ใน 13 entity ของเอกสารออกแบบ จึงไม่มีตารางใน MySQL
 * เก็บแบบชั่วคราวต่อลูกค้าหนึ่งคน (แค่ "อ้างอิง" product_id / build_id) จนกว่าจะ checkout
 * เก็บไว้ในหน่วยความจำของเซิร์ฟเวอร์เท่านั้น (ไม่มีไฟล์ JSON) ตะกร้าจะว่างเมื่อเซิร์ฟเวอร์รีสตาร์ท
 * พอ checkout สำเร็จ ข้อมูลจริงทั้งหมดจะไปอยู่ใน MySQL (sales_order, order_item, pc_build, payment)
 */
export interface CartLine {
  type: 'product' | 'build';
  ref_id: number; // product_id หรือ build_id แล้วแต่ type
  quantity: number;
}

// ตะกร้าของลูกค้าแต่ละคน: key = customer_id
const carts: Record<number, CartLine[]> = {};

export function getCart(customerId: number): CartLine[] {
  if (!carts[customerId]) carts[customerId] = [];
  return carts[customerId];
}

export function setCart(customerId: number, lines: CartLine[]): void {
  carts[customerId] = lines;
}

/**
 * เดิมใช้บันทึกตะกร้าลงไฟล์ ตอนนี้ตะกร้าอยู่ในหน่วยความจำ แก้ array ที่ได้จาก getCart() แล้วมีผลทันที
 * จึงไม่ต้องทำอะไร เก็บฟังก์ชันไว้ให้ cartService.ts เรียกได้เหมือนเดิม
 */
export function saveCarts(): void {
  // ไม่ต้องทำอะไร
}
