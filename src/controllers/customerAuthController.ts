import { Request, Response } from 'express';
import * as customerAuthService from '../services/customerAuthService';
import { signAccessToken, signRefreshToken, parseExpiryToMs } from '../utils/jwt';
import { CUSTOMER_ACCESS_COOKIE, CUSTOMER_REFRESH_COOKIE, EMPLOYEE_ACCESS_COOKIE, EMPLOYEE_REFRESH_COOKIE, cookieOptions } from '../utils/cookies';
import { env } from '../config/env';
import { ValidationError, isValidNamePart } from '../utils/validate';

// สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ ฝั่งลูกค้า - login สำเร็จแล้วจะออก JWT 2 ตัว (access/refresh) เก็บใน httpOnly cookie

export function showLoginForm(req: Request, res: Response) {
  res.render('auth/customer-login', { title: 'เข้าสู่ระบบ', error: null, errorField: null });
}

export function showRegisterForm(req: Request, res: Response) {
  res.render('auth/customer-register', { title: 'สมัครสมาชิก', error: null, errorField: null });
}

export async function register(req: Request, res: Response) {
  const firstName = String(req.body.first_name || '').trim();
  const lastName = String(req.body.last_name || '').trim();
  const { email, phone, password, address } = req.body;

  function rerender(error: string, errorField: string) {
    res.render('auth/customer-register', { title: 'สมัครสมาชิก', error, errorField });
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
    await customerAuthService.registerCustomer({ full_name: `${firstName} ${lastName}`, email, phone, password, address });
    res.redirect('/auth/login');
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    rerender(err.message, field ?? '');
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const customer = await customerAuthService.loginCustomer(email, password);
    const payload = { customer_id: customer.customer_id, email: customer.email };
    // login ได้ทีละบัญชีเท่านั้น: ถ้ามีพนักงาน login ค้างอยู่ในเบราว์เซอร์นี้ ให้ออกจากระบบพนักงานก่อน
    res.clearCookie(EMPLOYEE_ACCESS_COOKIE);
    res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
    res.cookie(CUSTOMER_ACCESS_COOKIE, signAccessToken(payload), cookieOptions(parseExpiryToMs(env.jwt.accessExpiresIn)));
    res.cookie(
      CUSTOMER_REFRESH_COOKIE,
      signRefreshToken(payload),
      cookieOptions(parseExpiryToMs(env.jwt.refreshExpiresIn))
    );
    res.redirect('/');
  } catch (err: any) {
    const field = err instanceof ValidationError ? err.field : null;
    res.render('auth/customer-login', { title: 'เข้าสู่ระบบ', error: err.message, errorField: field });
  }
}

export function logout(req: Request, res: Response) {
  res.clearCookie(CUSTOMER_ACCESS_COOKIE);
  res.clearCookie(CUSTOMER_REFRESH_COOKIE);
  res.redirect('/');
}
