import { Employee } from '../models/Employee';
import { query, queryOne, execute } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { ValidationError, isValidFullName, isValidPhone, normalizePhone } from '../utils/validate';

// สมัครสมาชิก/เข้าสู่ระบบ ฝั่งพนักงาน (แยกจาก employeeService.ts ที่จัดการโปรไฟล์ของคนที่ login แล้ว)
// สมัครใหม่ role เริ่มต้นเป็น 'unassigned' เสมอ ต้องรอ admin อนุมัติก่อนถึงจะใช้เมนูงานได้
export async function registerEmployee(data: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<Employee> {
  if (!isValidFullName(data.full_name)) {
    throw new ValidationError('full_name', 'กรุณากรอกชื่อและนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)');
  }
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    throw new ValidationError('phone', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  }
  // เก็บ email เป็นตัวพิมพ์เล็กเสมอ เทียบกันได้ตรงๆ ไม่ว่าผู้ใช้จะพิมพ์ตัวใหญ่หรือเล็ก (ต้องไม่ซ้ำกัน)
  const email = data.email.trim().toLowerCase();
  const emailTaken = await query('SELECT employee_id FROM employee WHERE email = ?', [email]);
  if (emailTaken.length > 0) {
    throw new ValidationError('email', 'อีเมลนี้ถูกใช้สมัครไปแล้ว');
  }

  const passwordHash = await hashPassword(data.password);
  // role = 'unassigned' (ค่า default ของตาราง) และ hire_date = NULL จนกว่า admin จะอนุมัติ
  const result = await execute(
    "INSERT INTO employee (full_name, email, password_hash, phone, role, hire_date, is_active) VALUES (?, ?, ?, ?, 'unassigned', NULL, TRUE)",
    [data.full_name, email, passwordHash, phone ?? null]
  );
  const employee = await queryOne<Employee>('SELECT * FROM employee WHERE employee_id = ?', [result.insertId]);
  return employee!;
}

export async function loginEmployee(email: string, password: string): Promise<Employee> {
  const employee = await queryOne<Employee>('SELECT * FROM employee WHERE email = ?', [email.trim().toLowerCase()]);
  if (!employee) {
    throw new ValidationError('email', 'ไม่พบบัญชีที่ใช้อีเมลนี้');
  }
  if (!employee.is_active) {
    throw new ValidationError('email', 'บัญชีนี้ถูกปิดการใช้งานแล้ว กรุณาติดต่อผู้ดูแลระบบ');
  }
  if (employee.role === 'unassigned') {
    throw new ValidationError('email', 'บัญชีของคุณยังรอการอนุมัติจากแอดมิน กรุณารอการอนุมัติก่อนเข้าสู่ระบบ');
  }
  const passwordMatches = await comparePassword(password, employee.password_hash);
  if (!passwordMatches) {
    throw new ValidationError('password', 'รหัสผ่านไม่ถูกต้อง');
  }
  return employee;
}
