// Entity: สินค้า/อะไหล่ที่ขายในร้าน - ใช้ทั้งฝั่งซื้อของปกติ (SalesOrder ผ่าน OrderItem) และจัดสเปคคอม (PCBuild ผ่าน BuildItem)
export interface Product {
  product_id: number; // PK
  product_name: string;
  category_id: number; // FK -> Category (หมวดหมู่สินค้า)
  brand_id: number; // FK -> Brand
  price: number; // ราคาปัจจุบัน - เวลาลูกค้าซื้อจะถูกคัดลอกไปเก็บที่ OrderItem.unit_price/BuildItem แยกต่างหาก
              // เพื่อไม่ให้ใบเสร็จเก่าเปลี่ยนตามราคาที่อัปเดตทีหลัง (ดู business rule เรื่องราคา ณ เวลาซื้อ)
  stock_quantity: number; // จำนวนคงเหลือ ต้องไม่ติดลบ (เช็คใน stockService.ts/productService.ts ทุกจุดที่แก้ไข)
  spec_detail?: string; // สเปกละเอียด เขียนแบบ "หัวข้อ: ค่า" ทีละบรรทัด (ดู utils/productSpec.ts) เอาไปแสดงเป็นตารางในหน้ารายละเอียดสินค้า
  image_url?: string; // ถ้าไม่มีรูปจริง จะโชว์ไอคอนตามหมวดหมู่แทน (ดู partials/product-thumb.ejs)
  warranty_months?: number; // ระยะเวลารับประกัน (เดือน)
  is_active: boolean; // false = ปิดการขายสินค้านี้ชั่วคราว (ไม่ลบทิ้งจริง เพื่อให้ประวัติคำสั่งซื้อเก่ายังอ้างอิงสินค้านี้ได้)
}
