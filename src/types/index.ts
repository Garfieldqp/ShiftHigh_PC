import { EmployeeRole } from '../models/Employee';

// ข้อมูลที่ฝังอยู่ใน JWT token ตอน login สำเร็จ (ไม่ใช่ entity เต็ม แค่พอให้ middleware/currentUser.ts รู้ว่าเป็นใคร)
export interface CustomerJwtPayload {
  customer_id: number;
  email: string;
}

export interface EmployeeJwtPayload {
  employee_id: number;
  email: string;
  role: EmployeeRole;
}

// เพิ่ม field ให้ Express.Request เพื่อให้ guard แนบข้อมูลผู้ใช้ที่ login ไว้ใช้ต่อใน controller
declare global {
  namespace Express {
    interface Request {
      customer?: CustomerJwtPayload;
      employee?: EmployeeJwtPayload;
    }
  }
}

export {};
