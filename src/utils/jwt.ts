import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// ฟังก์ชันช่วยสร้าง/ตรวจสอบ JWT (ใช้ทั้งฝั่งลูกค้าและพนักงาน) เรียกใช้ผ่าน middleware/currentUser.ts เป็นหลัก
export function signAccessToken(payload: object): string {
  // `as any`: @types/jsonwebtoken บังคับ expiresIn เป็น literal type ที่เข้มงวดมาก
  // แต่ env.jwt.accessExpiresIn เป็น string ธรรมดาจาก .env จึงต้อง cast ผ่านตรงนี้
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn as any });
}

export function signRefreshToken(payload: object): string {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as any });
}

export function verifyAccessToken<T>(token: string): T {
  return jwt.verify(token, env.jwt.accessSecret) as T;
}

export function verifyRefreshToken<T>(token: string): T {
  return jwt.verify(token, env.jwt.refreshSecret) as T;
}

/** แปลงสตริงอายุ token เช่น '15m', '7d' ให้เป็นมิลลิวินาที สำหรับตั้งอายุ cookie ให้ตรงกับ JWT */
export function parseExpiryToMs(expiry: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(expiry.trim());
  if (!match) return 15 * 60 * 1000; // fallback 15 นาที
  const value = Number(match[1]);
  const unit = match[2] ?? 'ms';
  const multiplier: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (multiplier[unit] ?? 1);
}
