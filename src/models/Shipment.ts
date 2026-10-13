// Entity: ข้อมูลการจัดส่ง - ใช้ร่วมกันได้ทั้งออเดอร์สินค้าปกติและงานจัดสเปคคอม
// order_id / build_id เป็น FK แบบ nullable แต่ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น (exclusive-or) บังคับด้วย assertExactlyOneLink() เหมือน Payment
// ตรงกับ Lab 7 Proposal ที่ส่งไปแล้ว (BR15, BR17): แต่ละ SalesOrder และแต่ละ PCBuild มี Shipment เป็นของตัวเอง 1 รายการเสมอ
// ต่างจาก Payment ตรงที่ "สร้างทีหลัง" (staff ต้องกดจัดการจัดส่งก่อนถึงจะเกิด) ไม่ได้สร้างพร้อมกันตอน checkout เหมือน Payment
export interface Shipment {
  shipment_id: number; // PK
  order_id?: number | null; // FK -> SalesOrder
  build_id?: number | null; // FK -> PCBuild
  employee_id: number; // FK -> Employee (พนักงานที่กดจัดการจัดส่ง ห้ามว่าง)
  courier_name: string; // ชื่อบริษัทขนส่ง (ตอนนี้ยังไม่ถามจริง ใส่ "-" ไว้ก่อน ไม่จำเป็นสำหรับ scope ปัจจุบัน)
  tracking_number?: string;
  shipped_date?: Date | null;
  delivered_date?: Date | null;
  shipping_status: string; // 'preparing' / 'shipped' / 'delivered'
}
