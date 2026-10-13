// Associative entity: ตัวเชื่อมความสัมพันธ์ M:N ระหว่าง PCBuild กับ Product (1 ชุดจัดสเปคมีอะไหล่ได้หลายชิ้น, 1 อะไหล่ถูกใช้ในหลายชุดได้)
// ไม่มี PK ของตัวเอง ใช้ (build_id, product_id) คู่กันเป็น composite key แทน
export interface BuildItem {
  build_id: number; // FK -> PCBuild (ส่วนหนึ่งของ composite PK)
  product_id: number; // FK -> Product (ส่วนหนึ่งของ composite PK)
  quantity: number;
  unit_price: number; // ราคาต่อชิ้น ณ ตอนสร้างงาน (คัดลอกจาก Product.price) - ล็อกไว้ตาม BR23 เหมือน OrderItem.unit_price
}
