import { Request, Response } from 'express';
import * as customerService from '../services/customerService';
import { ValidationError, isValidNamePart } from '../utils/validate';

// หน้า "บัญชีของฉัน" ฝั่งลูกค้า - ดู/แก้ไขข้อมูลส่วนตัว, เปลี่ยนรหัสผ่าน
export async function showProfile(req: Request, res: Response) {
  const customer = await customerService.getCustomerById(req.customer!.customer_id);
  if (!customer) {
    // เกิดได้ถ้าข้อมูลถูกล้าง/ลบไปแล้วแต่ browser ยังถือ session เก่าอยู่ - ให้ล็อกอินใหม่แทนที่จะพัง
    return res.redirect('/auth/login');
  }
  res.render('account/customer', { title: 'บัญชีของฉัน', customer, formValues: null, error: null, errorField: null, success: null });
}

export async function updateProfile(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  const firstName = String(req.body.first_name || '').trim();
  const lastName = String(req.body.last_name || '').trim();
  const formValues = { first_name: firstName, last_name: lastName, phone: String(req.body.phone || '') };

  async function rerender(error: string, errorField: string | null) {
    const customer = await customerService.getCustomerById(customerId);
    res.render('account/customer', { title: 'บัญชีของฉัน', customer, formValues, error, errorField, success: null });
  }

  if (!isValidNamePart(firstName)) {
    return rerender('กรุณากรอกชื่อให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'first_name');
  }
  if (!isValidNamePart(lastName)) {
    return rerender('กรุณากรอกนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'last_name');
  }

  try {
    await customerService.updateProfile(customerId, {
      full_name: `${firstName} ${lastName}`,
      phone: req.body.phone || undefined,
      address: req.body.address || undefined,
    });
    const customer = await customerService.getCustomerById(customerId);
    res.render('account/customer', {
      title: 'บัญชีของฉัน',
      customer,
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
  const customerId = req.customer!.customer_id;
  const customer = await customerService.getCustomerById(customerId);

  if (req.body.new_password !== req.body.confirm_password) {
    return res.render('account/customer', {
      title: 'บัญชีของฉัน',
      customer,
      formValues: null,
      error: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
      errorField: 'confirm_password',
      success: null,
    });
  }

  try {
    await customerService.changePassword(customerId, req.body.current_password, req.body.new_password);
    res.render('account/customer', {
      title: 'บัญชีของฉัน',
      customer,
      formValues: null,
      error: null,
      errorField: null,
      success: 'เปลี่ยนรหัสผ่านสำเร็จ',
    });
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    res.render('account/customer', { title: 'บัญชีของฉัน', customer, formValues: null, error: err.message, errorField: field, success: null });
  }
}
