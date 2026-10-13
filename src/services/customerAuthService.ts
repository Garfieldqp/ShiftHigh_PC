import { Customer } from '../models/Customer';
import { query, queryOne, execute } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { ValidationError, isValidFullName, isValidPhone, normalizePhone } from '../utils/validate';

// สมัครสมาชิก/เข้าสู่ระบบ ฝั่งลูกค้า (แยกจาก customerService.ts ที่จัดการโปรไฟล์ของคนที่ login แล้ว)
export async function registerCustomer(data: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
}): Promise<Customer> {
  if (!isValidFullName(data.full_name)) {
    throw new ValidationError('full_name', 'กรุณากรอกชื่อและนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)');
  }
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    throw new ValidationError('phone', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  }
  // เก็บ email เป็นตัวพิมพ์เล็กเสมอ เทียบกันได้ตรงๆ ไม่ว่าผู้ใช้จะพิมพ์ตัวใหญ่หรือเล็ก (ต้องไม่ซ้ำกัน)
  const email = data.email.trim().toLowerCase();
  const emailTaken = await query('SELECT customer_id FROM customer WHERE email = ?', [email]);
  if (emailTaken.length > 0) {
    throw new ValidationError('email', 'อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว');
  }

  const passwordHash = await hashPassword(data.password);
  const result = await execute(
    'INSERT INTO customer (full_name, email, phone, password_hash, address, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [data.full_name, email, phone ?? null, passwordHash, data.address ?? null, new Date()]
  );
  const customer = await queryOne<Customer>('SELECT * FROM customer WHERE customer_id = ?', [result.insertId]);
  return customer!;
}

export async function loginCustomer(email: string, password: string): Promise<Customer> {
  const customer = await queryOne<Customer>('SELECT * FROM customer WHERE email = ?', [email.trim().toLowerCase()]);
  if (!customer) {
    throw new ValidationError('email', 'ไม่พบบัญชีที่ใช้อีเมลนี้');
  }
  const passwordMatches = await comparePassword(password, customer.password_hash);
  if (!passwordMatches) {
    throw new ValidationError('password', 'รหัสผ่านไม่ถูกต้อง');
  }
  return customer;
}
