// Entity: ลูกค้า - คนที่ซื้อสินค้า/จัดสเปคคอม (แยก entity จาก Employee เพราะเป็นคนละกลุ่มผู้ใช้ มีสิทธิ์และข้อมูลต่างกัน)
export interface Customer {
  customer_id: number; // PK
  full_name: string;
  email: string; // ต้องไม่ซ้ำกัน (unique) - เช็คตอนสมัครสมาชิกใน customerAuthService.ts
  phone?: string;
  password_hash: string; // เก็บรหัสผ่านแบบ hash ด้วย bcrypt เท่านั้น ห้ามเก็บ plain text (ดู utils/password.ts)
  address?: string; // ที่อยู่ล่าสุด ใช้เป็นค่า default ตอน checkout ให้ไม่ต้องพิมพ์ใหม่ทุกครั้ง
  created_at: Date;
}
