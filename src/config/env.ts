import dotenv from 'dotenv';

// รวมค่าตั้งต้นทั้งหมดของแอปไว้ที่เดียว (อ่านจากไฟล์ .env) ที่อื่นในโปรเจกต์ import { env } from ตรงนี้แทนการอ่าน process.env ตรงๆ
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database - MySQL 8 (สร้างตารางจาก database/schema.sql)
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pc_shop',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
