import { Request, Response } from 'express';
import * as buildService from '../services/buildService';

// หน้าเฉพาะ role technician - ดูคิวงานจัดสเปคคอมที่รอประกอบ, รับงาน, อัปเดตสถานะประกอบ
export async function showQueue(req: Request, res: Response) {
  const technicianId = req.employee!.employee_id;
  const builds = await buildService.listQueueForTechnician();
  const myBuilds = await buildService.listBuildsByTechnician(technicianId);
  res.render('technician/queue', { title: 'คิวงานประกอบ', builds, myBuilds });
}

export async function showBuildDetail(req: Request, res: Response) {
  const build = await buildService.getBuildById(Number(req.params.id));
  const items = build ? await buildService.getBuildItems(build.build_id) : [];
  const history = build ? await buildService.getBuildHistory(build.build_id) : [];
  const customer = build ? await buildService.getBuildCustomerContact(build.build_id) : null;
  res.render('technician/build-detail', { title: 'รายละเอียดงาน', build, items, history, customer });
}

export async function claimBuild(req: Request, res: Response) {
  const technicianId = req.employee!.employee_id;
  try {
    await buildService.assignTechnician(Number(req.params.id), technicianId);
  } catch (err: any) {
    console.error('claimBuild:', err.message);
  }
  res.redirect(`/technician/builds/${req.params.id}`);
}

export async function updateBuildStatus(req: Request, res: Response) {
  const technicianId = req.employee!.employee_id;
  // ช่างปรับได้แค่ กำลังประกอบ / ประกอบเสร็จ / ยกเลิกประกอบ - สถานะจัดส่งเป็นหน้าที่ staff (ดู staffController.updateBuildStatus)
  const allowed = ['assembling', 'completed', 'cancelled'];
  if (!allowed.includes(req.body.status)) {
    return res.redirect(`/technician/builds/${req.params.id}`);
  }
  try {
    await buildService.updateBuildStatus(Number(req.params.id), technicianId, req.body.status, req.body.note);
  } catch (err: any) {
    console.error('updateBuildStatus:', err.message);
  }
  res.redirect(`/technician/builds/${req.params.id}`);
}
