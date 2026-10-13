import { Customer } from '../models/Customer';
import { queryOne, execute } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { ValidationError, isValidFullName, isValidPhone, normalizePhone } from '../utils/validate';

// แยกจาก customerAuthService (จัดการ register/login) - ไฟล์นี้จัดการข้อมูลโปรไฟล์ของลูกค้าที่ login แล้ว

export async function getCustomerById(customerId: number): Promise<Customer | null> {
  return queryOne<Customer>('SELECT * FROM customer WHERE customer_id = ?', [customerId]);
}

export async function updateProfile(
  customerId: number,
  data: { full_name: string; phone?: string; address?: string }
): Promise<void> {
  if (!isValidFullName(data.full_name)) {
    throw new ValidationError('full_name', 'กรุณากรอกชื่อและนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)');
  }
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    throw new ValidationError('phone', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  }
  const result = await execute('UPDATE customer SET full_name = ?, phone = ?, address = ? WHERE customer_id = ?', [
    data.full_name,
    phone ?? null,
    data.address ?? null,
    customerId,
  ]);
  if (result.affectedRows === 0) throw new Error('ไม่พบบัญชีนี้');
}

export async function changePassword(
  customerId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const customer = await getCustomerById(customerId);
  if (!customer) throw new Error('ไม่พบบัญชีนี้');
  const matches = await comparePassword(currentPassword, customer.password_hash);
  if (!matches) throw new ValidationError('current_password', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  await execute('UPDATE customer SET password_hash = ? WHERE customer_id = ?', [
    await hashPassword(newPassword),
    customerId,
  ]);
}
