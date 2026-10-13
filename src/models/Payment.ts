// Entity: การชำระเงิน 1 ครั้ง = 1 ใบเสร็จ - ใช้ร่วมกันได้ทั้งออเดอร์สินค้าปกติและงานจัดสเปคคอม
// order_id / build_id เป็น FK แบบ nullable แต่ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น ห้ามทั้งคู่ ห้ามไม่มีเลย (exclusive-or)
// บังคับด้วยฟังก์ชัน assertExactlyOneLink() ใน utils/validate.ts ก่อน insert ทุกครั้ง (ไม่ใช่แค่เขียนโค้ดให้ถูกเฉยๆ)
// สร้างพร้อมกับ SalesOrder/PCBuild ทันทีตอน checkout เสมอ (จ่ายเต็มจำนวนครั้งเดียวจบ ไม่มีผ่อนจ่ายหลายงวด)
export interface Payment {
  payment_id: number; // PK
  order_id?: number | null; // FK -> SalesOrder (ถ้าเป็นการจ่ายเพื่อสินค้าปกติ)
  build_id?: number | null; // FK -> PCBuild (ถ้าเป็นการจ่ายเพื่องานจัดสเปคคอม)
  amount: number;
  payment_date: Date;
  payment_method: string; // 'cod' (เก็บเงินปลายทาง) หรือ 'bank_transfer' (โอนเงิน)
  payment_status: string; // ตอนนี้มีแค่ 'paid' เพราะยังไม่มี payment gateway จริง ถือว่าจ่ายสำเร็จทันทีตอน checkout
}
