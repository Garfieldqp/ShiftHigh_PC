// ฟังก์ชันตรวจ/จัดรูปแบบข้อมูลที่ใช้ร่วมกันหลายจุด (สมัครสมาชิก, แก้ไขโปรไฟล์ ทั้งลูกค้าและพนักงาน)

/** error ที่รู้ว่าเกิดจาก field ไหน ให้ controller ส่งต่อไปให้ view โฟกัส/ไฮไลต์ช่องนั้นแทนที่จะขึ้นแค่ข้อความลอยๆ */
export class ValidationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

/** ตัดทุกอย่างที่ไม่ใช่ตัวเลขออก เผื่อรับค่าที่มีขีด/วรรคปนมา (เช่น จากช่องที่โชว์เบอร์แบบจัดรูปแบบแล้ว) */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** เบอร์โทรไทย: ตัวเลขล้วน 10 หลักเท่านั้น (เรียกหลัง normalizePhone แล้วเสมอ) */
export function isValidPhone(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

/** จัดรูปแบบเบอร์โทรให้อ่านง่าย เช่น 0863928274 -> 086-392-8274 (คืนค่าเดิมถ้ารูปแบบไม่ตรง 10 หลัก) */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = normalizePhone(phone);
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const NAME_PATTERN = /^[a-zA-Zก-๎]+$/;

/** ชื่อ หรือ นามสกุล หนึ่งคำ: ตัวอักษรไทย/อังกฤษเท่านั้น ห้ามว่าง ห้ามมีตัวเลข/อักขระพิเศษ */
export function isValidNamePart(part: string): boolean {
  return part.trim().length > 0 && NAME_PATTERN.test(part.trim());
}

/**
 * ชื่อ-นามสกุลแบบเต็ม (string เดียว คั่นด้วยช่องว่าง): ต้องมีอย่างน้อย 2 คำ แต่ละคำผ่าน isValidNamePart
 * ใช้เป็นด่านสำรองในชั้น service เผื่อมีจุดอื่นเรียกโดยไม่ผ่านฟอร์มแยกชื่อ/นามสกุล
 */
export function isValidFullName(name: string): boolean {
  const parts = name.trim().replace(/\s+/g, ' ').split(' ');
  return parts.length >= 2 && parts.every(isValidNamePart);
}

/**
 * บังคับกฎ exclusive-or ของ Payment (order_id / build_id อย่างใดอย่างหนึ่งเท่านั้น ห้ามทั้งคู่ ห้ามไม่มีเลย)
 * เรียกก่อน insert ทุกครั้งที่ src/services/cartService.ts เพื่อให้กฎนี้ถูกบังคับจริงด้วยโค้ด
 * ไม่ใช่แค่ "เขียนให้ถูกตั้งแต่แรกแล้วหวังว่าจะไม่มีใครเขียนผิดทีหลัง"
 */
export function assertExactlyOneLink(
  orderId: number | null | undefined,
  buildId: number | null | undefined,
  context: string
): void {
  const hasOrder = orderId !== null && orderId !== undefined;
  const hasBuild = buildId !== null && buildId !== undefined;
  if (hasOrder === hasBuild) {
    throw new Error(`${context}: ต้องมี order_id หรือ build_id อย่างใดอย่างหนึ่งเท่านั้น (ห้ามทั้งคู่ ห้ามไม่มีเลย)`);
  }
}
