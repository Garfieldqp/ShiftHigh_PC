import { CookieOptions } from 'express';
import { env } from '../config/env';

// ชื่อ cookie ที่ใช้เก็บ JWT ทั้ง 4 ตัว - แยกชุดลูกค้ากับพนักงานเด็ดขาด (login คนละระบบ ไม่ปนกัน)
// access token = อายุสั้น ใช้เช็คสิทธิ์ทุก request / refresh token = อายุยาว ใช้ขอ access token ใหม่ตอนหมดอายุ (silent refresh)
export const CUSTOMER_ACCESS_COOKIE = 'customer_access_token';
export const CUSTOMER_REFRESH_COOKIE = 'customer_refresh_token';
export const EMPLOYEE_ACCESS_COOKIE = 'employee_access_token';
export const EMPLOYEE_REFRESH_COOKIE = 'employee_refresh_token';

// ตั้งค่า cookie ให้ปลอดภัยที่สุดเท่าที่ทำได้: httpOnly (JavaScript ฝั่งเบราว์เซอร์อ่านไม่ได้ กัน XSS ขโมย token),
// sameSite lax (กัน CSRF ระดับหนึ่ง), secure เฉพาะตอน production (บังคับส่งผ่าน HTTPS เท่านั้น)
export function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: maxAgeMs,
  };
}
