import { Request, Response } from 'express';
import * as employeeAuthService from '../services/employeeAuthService';
import { signAccessToken, signRefreshToken, parseExpiryToMs } from '../utils/jwt';
import { EMPLOYEE_ACCESS_COOKIE, EMPLOYEE_REFRESH_COOKIE, CUSTOMER_ACCESS_COOKIE, CUSTOMER_REFRESH_COOKIE, cookieOptions } from '../utils/cookies';
import { env } from '../config/env';
import { ValidationError, isValidNamePart } from '../utils/validate';

// สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ ฝั่งพนักงาน - โครงสร้างเหมือน customerAuthController.ts เป๊ะ แค่คนละ cookie/entity

export function showLoginForm(req: Request, res: Response) {
  res.render('auth/employee-login', { title: 'เข้าสู่ระบบพนักงาน', error: null, errorField: null });
}

export function showRegisterForm(req: Request, res: Response) {
  res.render('auth/employee-register', { title: 'สมัครเป็นพนักงาน', error: null, errorField: null });
}

export async function register(req: Request, res: Response) {
  const firstName = String(req.body.first_name || '').trim();
  const lastName = String(req.body.last_name || '').trim();
  const { email, phone, password } = req.body;

  function rerender(error: string, errorField: string) {
    res.render('auth/employee-register', { title: 'สมัครเป็นพนักงาน', error, errorField });
  }

  if (!isValidNamePart(firstName)) {
    return rerender('กรุณากรอกชื่อให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'first_name');
  }
  if (!isValidNamePart(lastName)) {
    return rerender('กรุณากรอกนามสกุลให้ถูกต้อง (ตัวอักษรเท่านั้น ห้ามมีตัวเลขหรืออักขระพิเศษ)', 'last_name');
  }
  if (!email || !password) {
    return rerender('กรุณากรอกอีเมลและรหัสผ่านให้ครบ', !email ? 'email' : 'password');
  }

  try {
    await employeeAuthService.registerEmployee({ full_name: `${firstName} ${lastName}`, email, phone, password });
    res.redirect('/staff/auth/login');
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    rerender(err.message, field ?? '');
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const employee = await employeeAuthService.loginEmployee(email, password);
    const payload = { employee_id: employee.employee_id, email: employee.email, role: employee.role };
    // login ได้ทีละบัญชีเท่านั้น: ถ้ามีลูกค้า login ค้างอยู่ในเบราว์เซอร์นี้ ให้ออกจากระบบลูกค้าก่อน
    res.clearCookie(CUSTOMER_ACCESS_COOKIE);
    res.clearCookie(CUSTOMER_REFRESH_COOKIE);
    res.cookie(EMPLOYEE_ACCESS_COOKIE, signAccessToken(payload), cookieOptions(parseExpiryToMs(env.jwt.accessExpiresIn)));
    res.cookie(
      EMPLOYEE_REFRESH_COOKIE,
      signRefreshToken(payload),
      cookieOptions(parseExpiryToMs(env.jwt.refreshExpiresIn))
    );

    // ยังไม่ได้รับ role (unassigned) → พาไปหน้าแรกเฉยๆ เพราะเข้าเมนูงานใดๆ ไม่ได้จนกว่า admin จะอนุมัติ
    const destination: Record<string, string> = {
      admin: '/admin/products',
      staff: '/staff/orders',
      technician: '/technician/queue',
    };
    res.redirect(destination[employee.role] ?? '/');
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    res.render('auth/employee-login', { title: 'เข้าสู่ระบบพนักงาน', error: err.message, errorField: field });
  }
}

export function logout(req: Request, res: Response) {
  res.clearCookie(EMPLOYEE_ACCESS_COOKIE);
  res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
  res.redirect('/');
}
