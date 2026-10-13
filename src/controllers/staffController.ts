import { Request, Response } from 'express';
import * as staffService from '../services/staffService';
import * as productService from '../services/productService';
import * as stockService from '../services/stockService';
import * as buildService from '../services/buildService';
import * as orderService from '../services/orderService';
import * as shipmentService from '../services/shipmentService';

// staff และ admin เข้าถึงได้ทั้งคู่ (ดู src/routes/staffRoutes.ts)

export async function listOrders(req: Request, res: Response) {
  const orders = await staffService.listAllOrders();
  const builds = await staffService.listAllBuilds();
  res.render('staff/orders', { title: 'จัดการคำสั่งซื้อ', orders, builds });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  try {
    await staffService.updateOrderStatus(Number(req.params.id), employeeId, req.body.status);
  } catch (err: any) {
    console.error('updateOrderStatus:', err.message);
  }
  res.redirect('/staff/orders');
}

export async function updateOrderShipping(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  const orderId = Number(req.params.id);
  const shippingStatus = req.body.shipping_status;

  // อัปเดตได้แค่ preparing/shipped/delivered และต้องเป็นออเดอร์ที่จ่ายเงินแล้ว (paid) เท่านั้น
  if (shippingStatus !== 'preparing' && shippingStatus !== 'shipped' && shippingStatus !== 'delivered') {
    return res.redirect('/staff/orders');
  }
  const order = await orderService.getOrderById(orderId);
  if (!order || order.status !== 'paid') {
    return res.redirect('/staff/orders');
  }

  try {
    await shipmentService.setOrderShippingStatus(orderId, employeeId, shippingStatus);
  } catch (err: any) {
    console.error('updateOrderShipping:', err.message);
  }
  res.redirect('/staff/orders');
}

export async function showStock(req: Request, res: Response) {
  const products = await productService.listProducts();
  res.render('staff/stock', { title: 'จัดการสต็อก', products });
}

export async function adjustStock(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  const productId = Number(req.body.product_id);
  const inputValue = Number(req.body.value);
  const type = req.body.adjustment_type === 'correction' ? 'correction' : 'restock';
  try {
    await stockService.adjustStock(productId, employeeId, inputValue, type, req.body.note);
  } catch (err: any) {
    console.error('adjustStock:', err.message);
  }
  res.redirect('/staff/stock');
}

export async function updateBuildStatus(req: Request, res: Response) {
  const employeeId = req.employee!.employee_id;
  const buildId = Number(req.params.id);
  const nextStatus = req.body.status;

  // staff ปรับได้แค่สถานะจัดส่ง (shipped/delivered) และต้องรอช่างประกอบเสร็จ (completed) ก่อนเท่านั้น
  if (nextStatus !== 'shipped' && nextStatus !== 'delivered') {
    return res.redirect('/staff/orders');
  }
  const build = await buildService.getBuildById(buildId);
  if (!build || (build.status !== 'completed' && build.status !== 'shipped')) {
    return res.redirect('/staff/orders');
  }

  try {
    await buildService.updateBuildStatus(buildId, employeeId, nextStatus, req.body.note);
  } catch (err: any) {
    console.error('staff updateBuildStatus:', err.message);
  }
  res.redirect('/staff/orders');
}

export async function showReports(req: Request, res: Response) {
  const report = await staffService.getSalesReport();
  res.render('staff/reports', { title: 'รายงานยอดขาย', report });
}
