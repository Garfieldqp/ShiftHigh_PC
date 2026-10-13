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
  res.locals.t = (text: string): string => {
    if (lang === 'en') {
      return en[text] ?? text;
    }
    return text;
  };

  next();
}
