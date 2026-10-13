import app from './app';
import { env } from './config/env';
import { checkDatabase } from './config/db';
import { refreshLookups } from './data/lookups';

// จุดเริ่มโปรแกรมจริง: เช็คว่าต่อ MySQL ได้ + มีตารางครบ แล้วค่อยเปิดเว็บ
async function start() {
  try {
    await checkDatabase();
    await refreshLookups(); // โหลดชื่อหมวดหมู่/แบรนด์ไว้ให้ทุกหน้าใช้
  } catch (err: any) {
    console.error('❌ เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.message);
    console.error('   เช็คว่า MySQL เปิดอยู่, ค่า DB_* ในไฟล์ .env ถูกต้อง, และรัน database/schema.sql + seed.sql แล้ว');
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀 Shift-High PC server running at http://localhost:${env.port}`);
  });
}

start();
