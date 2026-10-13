import { PCBuildStatus } from './PCBuild';

// Entity: log ประวัติทุกครั้งที่สถานะงานจัดสเปคคอมเปลี่ยน (draft -> paid -> assigned -> ... ) เก็บไว้แสดง timeline ให้ลูกค้าติดตามงานได้
// ต่างจาก PCBuild.assigned_technician_id ตรงที่นี่คือ "ประวัติทั้งหมด" ส่วนตรงนั้นคือ "ใครรับผิดชอบอยู่ตอนนี้" (คนละเรื่องกัน)
export interface BuildStatusHistory {
  history_id: number; // PK
  build_id: number; // FK -> PCBuild (ห้ามว่าง - ทุก log ต้องรู้ว่าเป็นของงานไหน)
  employee_id: number; // FK -> Employee (ห้ามว่าง - ทุก log ต้องรู้ว่าใครเป็นคนเปลี่ยนสถานะ)
  status: PCBuildStatus;
  updated_at: Date;
  note?: string; // หมายเหตุเพิ่มเติม (บังคับกรอกกรณียกเลิกงาน เพื่อบันทึกเหตุผล)
}
