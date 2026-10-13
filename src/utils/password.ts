import bcrypt from 'bcrypt';

// เข้ารหัสรหัสผ่านด้วย bcrypt ก่อนเก็บลง database เสมอ (ห้ามเก็บ plain text เด็ดขาด - business rule ข้อความปลอดภัย)
const SALT_ROUNDS = 10; // ยิ่งมากยิ่งปลอดภัยแต่ยิ่งช้า 10 คือค่ามาตรฐานที่สมดุลระหว่างความปลอดภัยกับความเร็ว

/** แปลงรหัสผ่านธรรมดาให้เป็น hash เรียกตอนสมัครสมาชิก/เปลี่ยนรหัสผ่าน */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** เทียบรหัสผ่านที่ผู้ใช้กรอกตอน login กับ hash ที่เก็บไว้ - bcrypt เข้ารหัสฝั่งเดียว (one-way) จึงต้องใช้ฟังก์ชันเทียบแบบนี้แทนการถอดรหัส */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
