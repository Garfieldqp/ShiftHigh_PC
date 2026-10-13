// Entity: คำสั่งซื้อสินค้าปกติ (ไม่รวมงานจัดสเปคคอม - นั่นคือ PCBuild แยกต่างหาก)
export type SalesOrderStatus = 'pending' | 'paid' | 'cancelled';

export interface SalesOrder {
  order_id: number; // PK
  customer_id: number; // FK -> Customer (ต้องมีเสมอ ไม่ nullable - ออเดอร์ต้องมีเจ้าของ)
  order_date: Date;
  status: SalesOrderStatus; // สร้างพร้อม status 'paid' ทันทีตอน checkout เสมอ (โปรเจกต์นี้ยังไม่มี payment gateway จริง)
  total_amount: number; // ยอดรวมทั้งออเดอร์ (คำนวณตอน checkout จาก unit_price ของแต่ละ OrderItem)
  shipping_address: string; // ที่อยู่จัดส่ง ณ ตอนสั่งซื้อ (คัดลอกมาเก็บไว้ ไม่ผูกกับที่อยู่ปัจจุบันของ Customer เผื่อลูกค้าเปลี่ยนที่อยู่ทีหลัง)
}
