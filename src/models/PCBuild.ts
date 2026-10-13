// Entity: งานจัดสเปคคอมของลูกค้า (เลือกอะไหล่เองทีละหมวด) - แยก entity จาก SalesOrder เพราะ lifecycle ต่างกันมาก
// (ต้องผ่านช่างประกอบ มีคิวงาน มีประวัติเปลี่ยนสถานะ ซึ่งการซื้อสินค้าปกติไม่มี)
export type PCBuildStatus =
  | 'draft'
  | 'paid'
  | 'assigned'
  | 'assembling'
  | 'completed'
  | 'shipped'
  | 'delivered'
  // เพิ่มจากเอกสารเดิม - กรณีช่างกับลูกค้าตกลงกันแล้วว่าประกอบไม่ได้จริงๆ (เช่น อะไหล่เข้ากันไม่ได้)
  | 'cancelled';

export interface PCBuild {
  build_id: number; // PK
  customer_id: number; // FK -> Customer (เจ้าของงาน)
  assigned_technician_id?: number | null; // FK -> Employee (role technician) - null ได้ตอนยังไม่มีช่างรับงาน (สถานะ 'paid' รอคิวอยู่)
  build_name: string; // ชื่อที่ลูกค้าตั้งเอง (เช่น "สายเกม", "สายทำงาน")
  build_date: Date; // วันที่สร้างงาน (ต้องไม่เป็นวันในอนาคต - server เป็นคนเซ็ตค่านี้ให้เองเสมอ ไม่เปิดให้ลูกค้ากรอกเอง)
  status: PCBuildStatus;
  total_price: number; // รวมราคาอะไหล่ทุกชิ้นในชุด (คำนวณตอนสร้างงาน)
  // เพิ่มจากเอกสารเดิม - ลูกค้ากรอกที่อยู่ตอน checkout เหมือน SalesOrder แต่เอกสารต้นฉบับไม่มีที่เก็บให้ PCBuild
  // จึงเซ็ตค่านี้ตอน checkoutCart() แปลงสถานะ draft -> paid (ก่อนหน้านั้นยังเป็น undefined)
  shipping_address?: string;
}
