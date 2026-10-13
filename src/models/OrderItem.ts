// Associative entity: ตัวเชื่อมความสัมพันธ์ M:N ระหว่าง SalesOrder กับ Product (1 ออเดอร์มีสินค้าได้หลายชิ้น, 1 สินค้าอยู่ในหลายออเดอร์ได้)
// ไม่มี PK ของตัวเอง ใช้ (order_id, product_id) คู่กันเป็น composite key แทน
export interface OrderItem {
  order_id: number; // FK -> SalesOrder (ส่วนหนึ่งของ composite PK)
  product_id: number; // FK -> Product (ส่วนหนึ่งของ composite PK)
  quantity: number;
  unit_price: number; // ราคาต่อชิ้น ณ ตอนที่ซื้อ (คัดลอกมาจาก Product.price ตอน checkout) - ไม่อ้างอิงราคาปัจจุบัน กันใบเสร็จเก่าเปลี่ยนตามราคาที่อัปเดตทีหลัง
}
