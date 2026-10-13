// Entity: ประวัติการปรับสต็อกด้วยมือ (เติมของ/แก้ยอดให้ตรงของจริง) - ไม่รวมสต็อกที่ลดจากการขายปกติ (เพราะ trace ผ่าน OrderItem/BuildItem ได้อยู่แล้ว)
export type AdjustmentType = 'restock' | 'correction'; // restock = เติมของเข้า (บวกเข้ากับยอดเดิม), correction = แก้ยอดให้ตรงกับที่นับจริง (ตั้งยอดใหม่ทั้งหมด)

export interface StockAdjustment {
  adjustment_id: number; // PK
  product_id: number; // FK -> Product (สินค้าที่ถูกปรับ)
  employee_id: number; // FK -> Employee (พนักงานที่เป็นคนกดปรับ) - ทั้งสอง FK ห้ามว่าง เพื่อให้ audit ย้อนหลังได้เสมอว่าใครปรับอะไรเมื่อไหร่
  quantity_changed: number; // จำนวนที่เปลี่ยนไปจริง (เก็บผลต่างไว้เสมอ แม้จะเป็น correction ก็คำนวณเป็นผลต่างจากยอดเดิมก่อนบันทึก)
  adjustment_type: AdjustmentType;
  note?: string;
  adjusted_at: Date;
}
