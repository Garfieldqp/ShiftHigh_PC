import { Employee, EmployeeRole } from '../models/Employee';
import { query, queryOne, execute } from '../config/db';
import { hashPassword, comparePassword } from '../utils/password';
import { ValidationError, isValidFullName, isValidPhone, normalizePhone } from '../utils/validate';

// จัดการบัญชีพนักงาน 2 มุม: (1) โปรไฟล์ของตัวเอง (แก้ข้อมูล/เปลี่ยนรหัสผ่าน - ทุก role ทำได้)
// (2) จัดการบัญชีคนอื่น (อนุมัติ/เปลี่ยน role/ปิด-เปิดบัญชี - เฉพาะ admin เท่านั้น ดู roleGuard ที่ adminRoutes.ts)
export async function listEmployees(): Promise<Employee[]> {
  return query<Employee>('SELECT * FROM employee ORDER BY employee_id');
}

export async function getEmployeeById(employeeId: number): Promise<Employee | null> {
  return queryOne<Employee>('SELECT * FROM employee WHERE employee_id = ?', [employeeId]);
}

/** UPDATE แถวเดียวของพนักงาน ถ้าไม่เจอ id นี้ให้ error เหมือนพฤติกรรมเดิม */
async function updateEmployee(employeeId: number, setSql: string, params: unknown[]): Promise<void> {
  const result = await execute(`UPDATE employee SET ${setSql} WHERE employee_id = ?`, [...params, employeeId]);
  if (result.affectedRows === 0) throw new Error('ไม่พบพนักงานนี้');
}

// พนักงานแก้ข้อมูลของตัวเองได้แค่ชื่อ/เบอร์โทร - email/role แก้ไม่ได้ตรงนี้ (role ต้องผ่าน admin เท่านั้น)
export async function updateOwnProfile(
  employeeId: number,
  data: { full_name: string; phone?: string }
): Promise<void> {
  if (!isValidFullName(data.full_name)) {
    throw new ValidationError('full_name', 'กรุณากรอกชื่อและนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)');
  }
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  if (phone && !isValidPhone(phone)) {
    throw new ValidationError('phone', 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
  }
  await updateEmployee(employeeId, 'full_name = ?, phone = ?', [data.full_name, phone ?? null]);
}

export async function changePassword(
  employeeId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const employee = await getEmployeeById(employeeId);
  if (!employee) throw new Error('ไม่พบพนักงานนี้');
  const matches = await comparePassword(currentPassword, employee.password_hash);
  if (!matches) throw new ValidationError('current_password', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  await updateEmployee(employeeId, 'password_hash = ?', [await hashPassword(newPassword)]);
}

export async function approveEmployee(employeeId: number, role: EmployeeRole): Promise<void> {
  await updateEmployee(employeeId, 'role = ?, hire_date = ?', [role, new Date()]);
}

export async function changeRole(employeeId: number, role: EmployeeRole): Promise<void> {
  await updateEmployee(employeeId, 'role = ?', [role]);
}

export async function disableAccount(employeeId: number): Promise<void> {
  await updateEmployee(employeeId, 'is_active = FALSE', []);
}

export async function enableAccount(employeeId: number): Promise<void> {
  await updateEmployee(employeeId, 'is_active = TRUE', []);
}
