/**
 * Express 4 ไม่จับ error จาก controller ที่เป็น async function เอง (Promise ที่ reject จะหลุดไปเฉยๆ ทำให้ request ค้าง)
 * ตอนใช้ dev store ไม่ค่อยเกิดเพราะข้อมูลอยู่ในหน่วยความจำ แต่พอต่อ MySQL แล้ว query พังได้ (เช่น DB ปิดอยู่)
 * ไฟล์นี้ทำให้ทุก route ที่ return Promise แล้ว reject ถูกส่งต่อไปที่ errorHandler อัตโนมัติ
 * (หลักการเดียวกับ package express-async-errors) - import ครั้งเดียวที่บรรทัดแรกๆ ของ app.ts
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Layer = require('express/lib/router/layer');

Layer.prototype.handle_request = function handleRequest(req: unknown, res: unknown, next: (err?: unknown) => void) {
  const fn = this.handle;
  if (fn.length > 3) {
    // error handler (4 พารามิเตอร์) ไม่ใช่ route ปกติ - ข้ามเหมือนของเดิมของ Express
    return next();
  }
  try {
    const result = fn(req, res, next);
    if (result && typeof result.catch === 'function') result.catch(next);
  } catch (err) {
    next(err);
  }
};

export {};
