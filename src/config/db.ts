import mysql, { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { env } from './env';

// MySQL connection pool ของทั้งแอป (ตาราง 13 ตารางสร้างจาก database/schema.sql)
// - decimalNumbers: ให้คอลัมน์ DECIMAL (price, total_amount ฯลฯ) กลับมาเป็น number ไม่ใช่ string
//   ไม่งั้น view ที่เรียก price.toLocaleString() จะแสดงผิด
// - typeCast: แปลง BOOLEAN เป็น true/false ให้ตรงกับ model เดิม (is_active, is_build_component)
//   ใน schema มีแค่คอลัมน์ BOOLEAN ที่เป็นชนิด TINYINT จึงแปลง TINY ทุกตัวเป็น boolean ได้เลย
export const pool: Pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: 'local',
  decimalNumbers: true,
  typeCast(field: any, next: () => unknown) {
    if (field.type === 'TINY') {
      const value = field.string();
      return value === null ? null : value === '1';
    }
    return next();
  },
});

/** pool หรือ connection ที่อยู่ใน transaction - ฟังก์ชันด้านล่างรับได้ทั้งสองแบบ */
export type Db = Pool | PoolConnection;

/** SELECT แล้วคืนเป็น array ของแถว */
export async function query<T = any>(sql: string, params: unknown[] = [], db: Db = pool): Promise<T[]> {
  const [rows] = await db.query(sql, params);
  return rows as T[];
}

/** SELECT ที่คาดว่าได้ไม่เกิน 1 แถว - ไม่เจอคืน null */
export async function queryOne<T = any>(sql: string, params: unknown[] = [], db: Db = pool): Promise<T | null> {
  const rows = await query<T>(sql, params, db);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE - คืน insertId และ affectedRows */
export async function execute(sql: string, params: unknown[] = [], db: Db = pool): Promise<ResultSetHeader> {
  const [result] = await db.query(sql, params);
  return result as ResultSetHeader;
}

/**
 * รันหลายคำสั่งเป็น transaction เดียว: สำเร็จทั้งหมด (COMMIT) หรือไม่เกิดอะไรเลย (ROLLBACK)
 * ใช้ตอน checkout / ปรับสต็อก / เปลี่ยนสถานะงาน ที่ต้องแก้หลายตารางพร้อมกัน
 */
export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** เช็คตอนเปิดเซิร์ฟเวอร์ว่าต่อ MySQL ได้จริง และมีข้อมูลสินค้าแล้ว (รัน schema.sql + seed.sql แล้ว) */
export async function checkDatabase(): Promise<void> {
  try {
    await query('SELECT COUNT(*) AS n FROM product');
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_DB_ERROR') {
      throw new Error(`ยังไม่มีฐานข้อมูล "${env.db.database}" หรือตาราง - รัน database/schema.sql และ seed.sql ก่อน`);
    }
    throw err;
  }
}
