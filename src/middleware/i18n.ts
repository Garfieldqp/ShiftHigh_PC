import { Request, Response, NextFunction } from 'express';
import { en } from '../i18n/translations';

export const LANG_COOKIE = 'lang';
export type Lang = 'th' | 'en';

/**
 * รันทุก request - อ่านภาษาที่เลือกไว้จาก cookie (ค่าเริ่มต้น 'th')
 * แนบ res.locals.t (ฟังก์ชันแปล) และ res.locals.lang ให้ทุกหน้าเรียกใช้ได้เลย
 *
 * วิธีใช้ใน view: <%= t('ข้อความไทย') %> - ถ้า lang = 'th' คืนค่าเดิม, ถ้า lang = 'en' หาใน dictionary
 * ถ้าหาไม่เจอ (ยังไม่ได้เพิ่มคำแปล) จะ fallback กลับเป็นภาษาไทยเสมอ ไม่มีทางว่างเปล่า
 */
export function i18n(req: Request, res: Response, next: NextFunction) {
  const lang: Lang = req.cookies?.[LANG_COOKIE] === 'en' ? 'en' : 'th';

  res.locals.lang = lang;
  res.locals.t = (text: string): string => translate(text, lang);

  next();
}

const thaiErrors: Record<string, string> = {
  "Demo system: payment is simulated. No real payment is collected.": "ระบบสาธิต: การชำระเงินเป็นการจำลอง ไม่มีการเรียกเก็บเงินจริง",
  "Available": "พร้อมขาย",
  "Reserved for builds": "จองประกอบ",
  "Courier": "บริษัทขนส่ง",
  "Tracking number": "เลขพัสดุ",
  "Not found": "ไม่พบข้อมูล",
  "Invalid component or quantity": "ข้อมูลอะไหล่หรือจำนวนไม่ถูกต้อง",
  "Invalid quantity": "จำนวนไม่ถูกต้อง",
  "Invalid stock quantity": "จำนวนสต็อกไม่ถูกต้อง",
  "Access denied": "ไม่มีสิทธิ์ดำเนินการ",
  "Invalid status transition": "เปลี่ยนสถานะนี้ไม่ได้",
  "Invalid shipping status": "สถานะจัดส่งไม่ถูกต้อง",
  "Invalid shipping transition": "เปลี่ยนสถานะจัดส่งนี้ไม่ได้",
  "Shipping details too long": "ข้อมูลจัดส่งยาวเกินกำหนด",
  "Stock changed; reload and retry": "สต็อกเปลี่ยนแล้ว กรุณาโหลดใหม่และลองอีกครั้ง",
  "Build changed; reload and retry": "งานเปลี่ยนแล้ว กรุณาโหลดใหม่และลองอีกครั้ง",
  "Internal Server Error": "เกิดข้อผิดพลาดภายในระบบ"
};

const dynamicMessages: Array<[RegExp, (...parts: string[]) => string]> = [
  [/^ไม่พบชุดคอมรหัส (.+)$/, id => `Build ${id} was not found`],
  [/^ไม่พบสินค้ารหัส (.+)$/, id => `Product ${id} was not found`],
  [/^สินค้า "(.*)" มีไม่พอ \(เหลือ (.+)\)$/, (name, qty) => `Not enough stock for "${name}" (${qty} remaining)`],
  [/^สินค้า "(.*)" มีไม่พอ$/, name => `Not enough stock for "${name}"`],
  [/^อะไหล่ในชุด "(.*)" มีไม่พอ$/, name => `Not enough parts for build "${name}"`],
];
export function translate(text: string, lang: Lang): string {
  if (lang === 'th') return thaiErrors[text] ?? text;
  if (en[text]) return en[text];
  for (const [pattern, format] of dynamicMessages) {
    const match = text.match(pattern);
    if (match) return format(...match.slice(1));
  }
  return text;
}
