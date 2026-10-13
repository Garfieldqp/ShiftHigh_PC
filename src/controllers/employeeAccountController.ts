import { Request, Response } from 'express';
import * as employeeService from '../services/employeeService';
import { ValidationError, isValidNamePart } from '../utils/validate';

// หน้า "บัญชีของฉัน" ฝั่งพนักงาน - เข้าได้ทุก role รวม unassigned (ไม่ต้องรอ admin อนุมัติก่อนก็แก้ข้อมูลตัวเองได้)
export async function showProfile(req: Request, res: Response) {
  const employee = await employeeService.getEmployeeById(req.employee!.employee_id);
  if (!employee) {
    return res.redirect('/staff/auth/login');
  }
  res.render('account/employee', { title: 'บัญชีของฉัน', employee, formValues: null, error: null, errorField: null, success: null });
}

export async function updateProfile(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  const firstName = String(req.body.first_name || '').trim();
  const lastName = String(req.body.last_name || '').trim();
  const formValues = { first_name: firstName, last_name: lastName, phone: String(req.body.phone || '') };

  async function rerender(error: string, errorField: string | null) {
    const employee = await employeeService.getEmployeeById(employeeId);
    res.render('account/employee', { title: 'บัญชีของฉัน', employee, formValues, error, errorField, success: null });
  }

  if (!isValidNamePart(firstName)) {
    return rerender('กรุณากรอกชื่อให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'first_name');
  }
  if (!isValidNamePart(lastName)) {
    return rerender('กรุณากรอกนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'last_name');
  }

  try {
    await employeeService.updateOwnProfile(employeeId, {
      full_name: `${firstName} ${lastName}`,
      phone: req.body.phone || undefined,
    });
    const employee = await employeeService.getEmployeeById(employeeId);
    res.render('account/employee', {
      title: 'บัญชีของฉัน',
      employee,
      formValues: null,
      error: null,
      errorField: null,
      success: 'บันทึกข้อมูลสำเร็จ',
    });
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    await rerender(err.message, field);
  }
}

export async function changePassword(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  const employee = await employeeService.getEmployeeById(employeeId);

  if (req.body.new_password !== req.body.confirm_password) {
    return res.render('account/employee', {
      title: 'บัญชีของฉัน',
      employee,
      formValues: null,
      error: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
      errorField: 'confirm_password',
      success: null,
    });
  }

  try {
    await employeeService.changePassword(employeeId, req.body.current_password, req.body.new_password);
    res.render('account/employee', {
      title: 'บัญชีของฉัน',
      employee,
      formValues: null,
      error: null,
      errorField: null,
      success: 'เปลี่ยนรหัสผ่านสำเร็จ',
    });
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    res.render('account/employee', { title: 'บัญชีของฉัน', employee, formValues: null, error: err.message, errorField: field, success: null });
  }
}
