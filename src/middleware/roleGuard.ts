import { Request, Response, NextFunction } from 'express';
import { EmployeeRole } from '../models/Employee';

// รับ role ที่อนุญาตเป็น array เช่น roleGuard(['staff', 'admin'])
// เพราะบางหน้า (เช่น /staff/*) เปิดให้ staff และ admin เข้าได้พร้อมกัน (admin ทำได้ทุกอย่างที่ staff ทำได้)
// ปฏิเสธเสมอถ้า role = 'unassigned' หรือยังไม่ login เป็นพนักงานเลย
export function roleGuard(allowedRoles: EmployeeRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.employee?.role;
    if (!role || role === 'unassigned' || !allowedRoles.includes(role)) {
      return res.status(403).render('403', { title: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    return next();
  };
}
