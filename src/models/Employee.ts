// Entity: พนักงาน - รวมทุกบทบาท (staff/technician/admin) ไว้ใน entity เดียว แยกด้วย field `role`
// แทนที่จะแยกเป็นหลาย entity เพราะพนักงานคนเดียวกันอาจถูกปรับ role ภายหลังได้ (EER specialisation attribute)
export type EmployeeRole = 'unassigned' | 'staff' | 'technician' | 'admin';

export interface Employee {
  employee_id: number; // PK
  full_name: string;
  email: string; // ต้องไม่ซ้ำกัน (unique)
  password_hash: string; // hash ด้วย bcrypt เหมือน Customer
  phone?: string;
  role: EmployeeRole; // สมัครใหม่เริ่มที่ 'unassigned' เสมอ ใช้งานเมนูอะไรไม่ได้จนกว่า admin จะอนุมัติเปลี่ยน role ให้
  hire_date?: Date | null; // เป็น null ได้ตอนยังไม่ได้รับอนุมัติ (ยัง unassigned อยู่)
  // เพิ่มจากเอกสารเดิม - จำเป็นสำหรับฟีเจอร์ "ปิดการใช้งานบัญชี" ที่ admin ทำได้ (business rule ข้อ 3)
  // แยกจาก role เพราะการ "ปิดบัญชี" กับ "role" เป็นคนละเรื่องกัน (ปิดบัญชี staff ก็ยังเป็น staff อยู่ แค่ล็อกอินไม่ได้)
  is_active: boolean;
}
