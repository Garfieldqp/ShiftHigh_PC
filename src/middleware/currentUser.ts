import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, parseExpiryToMs } from '../utils/jwt';
import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  EMPLOYEE_ACCESS_COOKIE,
  EMPLOYEE_REFRESH_COOKIE,
  cookieOptions,
} from '../utils/cookies';
import { CustomerJwtPayload, EmployeeJwtPayload } from '../types';
import { env } from '../config/env';
import { queryOne } from '../config/db';

/**
 * รันทุก request (mount ใน app.ts) - ถอดรหัส JWT จาก cookie (ถ้ามี) แล้วแนบ req.customer / req.employee
 * ไว้ให้ทุก route ใช้ได้ทันที (รวมหน้า public ด้วย เช่น header จะได้รู้ว่า login อยู่หรือไม่)
 *
 * ถ้า access token หมดอายุแต่ refresh token ยังไม่หมด จะออก access token ใหม่ให้อัตโนมัติ (silent refresh)
 * ไม่เคย redirect เอง - หน้าที่บังคับ login เป็นของ customerAuthGuard / authGuard แทน
 *
 * สำคัญ: ต้องเช็คกับฐานข้อมูลจริงเสมอว่า customer_id/employee_id ใน token ยังมีอยู่จริง
 * (เช่น กรณีข้อมูลถูกล้าง/รีเซ็ตไปแล้วแต่ browser ยังถือ cookie เก่าของ id ที่ไม่มีอยู่แล้ว)
 * ไม่งั้นหน้าเว็บที่ดึงข้อมูลลูกค้ามาต่อ (เช่น /account) จะพังเป็น 500 เพราะได้ null มาแทน
 */
export async function currentUser(req: Request, res: Response, next: NextFunction) {
  try {
    await resolveCustomer(req, res);
    // ดึง role ล่าสุดจากฐานข้อมูลเสมอ ไม่เชื่อ role ที่ฝังใน token เก่า - ให้ผล approve/เปลี่ยน role/ปิดบัญชี มีผลทันที
    await resolveEmployee(req, res);
    // login ได้ทีละบัญชี: ถ้าเบราว์เซอร์ยังถือ cookie ของทั้งลูกค้าและพนักงาน (เช่น login ค้างไว้ตั้งแต่ก่อนแก้ระบบ)
    // ให้เก็บบัญชีที่ login ล่าสุดไว้ แล้วออกจากระบบอีกบัญชี (ดูเวลา login จาก iat ของ refresh token)
    if (req.customer && req.employee) {
      const customerLoginAt = issuedAt(req.cookies?.[CUSTOMER_REFRESH_COOKIE]);
      const employeeLoginAt = issuedAt(req.cookies?.[EMPLOYEE_REFRESH_COOKIE]);
      if (employeeLoginAt >= customerLoginAt) {
        res.clearCookie(CUSTOMER_ACCESS_COOKIE);
        res.clearCookie(CUSTOMER_REFRESH_COOKIE);
        req.customer = undefined;
      } else {
        res.clearCookie(EMPLOYEE_ACCESS_COOKIE);
        res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
        req.employee = undefined;
      }
    }
  } catch (err) {
    // เช่น ต่อ MySQL ไม่ได้ - ส่งต่อให้ errorHandler แทนที่จะปล่อยให้ request ค้าง
    return next(err);
  }
  res.locals.customer = req.customer;
  res.locals.employee = req.employee;
  next();
}

/** เวลาที่ token ถูกออก (วินาที) อ่านจาก iat โดยไม่ต้อง verify - ไม่มีหรืออ่านไม่ได้คืน 0 */
function issuedAt(token: string | undefined): number {
  if (!token) return 0;
  const decoded = jwt.decode(token);
  return decoded && typeof decoded === 'object' && typeof decoded.iat === 'number' ? decoded.iat : 0;
}

/** verify token แบบไม่ throw - ถ้าไม่ถูกต้อง/หมดอายุคืน null */
function safeVerify<T>(verify: (token: string) => T, token: string | undefined): T | null {
  if (!token) return null;
  try {
    return verify(token);
  } catch {
    return null;
  }
}

async function resolveCustomer(req: Request, res: Response) {
  const access = safeVerify((t) => verifyAccessToken<CustomerJwtPayload>(t), req.cookies?.[CUSTOMER_ACCESS_COOKIE]);
  const refresh = access
    ? null
    : safeVerify((t) => verifyRefreshToken<CustomerJwtPayload>(t), req.cookies?.[CUSTOMER_REFRESH_COOKIE]);
  const payload = access ?? refresh;
  if (!payload) {
    // มี cookie แต่ใช้ไม่ได้แล้วทั้งคู่ - เคลียร์ทิ้ง
    if (req.cookies?.[CUSTOMER_ACCESS_COOKIE] || req.cookies?.[CUSTOMER_REFRESH_COOKIE]) {
      res.clearCookie(CUSTOMER_ACCESS_COOKIE);
      res.clearCookie(CUSTOMER_REFRESH_COOKIE);
    }
    return;
  }

  const customer = await queryOne<{ customer_id: number; email: string }>(
    'SELECT customer_id, email FROM customer WHERE customer_id = ?',
    [payload.customer_id]
  );
  if (!customer) {
    // token ถูกต้องแต่ customer_id นี้ไม่มีอยู่จริงแล้ว (เช่น ข้อมูลถูกล้างไป) - เคลียร์ cookie ทิ้ง
    res.clearCookie(CUSTOMER_ACCESS_COOKIE);
    res.clearCookie(CUSTOMER_REFRESH_COOKIE);
    return;
  }
  req.customer = { customer_id: customer.customer_id, email: customer.email };
  if (refresh) {
    res.cookie(CUSTOMER_ACCESS_COOKIE, signAccessToken(req.customer), cookieOptions(parseExpiryToMs(env.jwt.accessExpiresIn)));
  }
}

async function resolveEmployee(req: Request, res: Response) {
  const access = safeVerify((t) => verifyAccessToken<EmployeeJwtPayload>(t), req.cookies?.[EMPLOYEE_ACCESS_COOKIE]);
  const refresh = access
    ? null
    : safeVerify((t) => verifyRefreshToken<EmployeeJwtPayload>(t), req.cookies?.[EMPLOYEE_REFRESH_COOKIE]);
  const payload = access ?? refresh;
  if (!payload) {
    if (req.cookies?.[EMPLOYEE_ACCESS_COOKIE] || req.cookies?.[EMPLOYEE_REFRESH_COOKIE]) {
      res.clearCookie(EMPLOYEE_ACCESS_COOKIE);
      res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
    }
    return;
  }

  // บัญชีที่ถูกปิด (is_active = FALSE) ถือว่าไม่ได้ login
  const emp = await queryOne<{ employee_id: number; email: string; role: EmployeeJwtPayload['role'] }>(
    'SELECT employee_id, email, role FROM employee WHERE employee_id = ? AND is_active = TRUE',
    [payload.employee_id]
  );
  if (!emp) {
    res.clearCookie(EMPLOYEE_ACCESS_COOKIE);
    res.clearCookie(EMPLOYEE_REFRESH_COOKIE);
    return;
  }
  req.employee = { employee_id: emp.employee_id, email: emp.email, role: emp.role };
  if (refresh) {
    res.cookie(
      EMPLOYEE_ACCESS_COOKIE,
      signAccessToken({ employee_id: emp.employee_id, email: emp.email, role: emp.role }),
      cookieOptions(parseExpiryToMs(env.jwt.accessExpiresIn))
    );
  }
}