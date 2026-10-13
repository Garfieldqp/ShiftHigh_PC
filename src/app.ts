import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import expressLayouts from 'express-ejs-layouts';

import './utils/asyncErrors'; // ให้ error จาก async controller (เช่น query MySQL พัง) ไปถึง errorHandler

import { currentUser } from './middleware/currentUser';
import { formatPhone } from './utils/validate';
import { parseSpecDetail } from './utils/productSpec';
import { categoryNameById, brandNameById } from './data/lookups';
import { i18n, LANG_COOKIE } from './middleware/i18n';
import * as productService from './services/productService';

import productRoutes from './routes/productRoutes';
import customerAuthRoutes from './routes/customerAuthRoutes';
import employeeAuthRoutes from './routes/employeeAuthRoutes';
import accountRoutes from './routes/accountRoutes';
import employeeAccountRoutes from './routes/employeeAccountRoutes';
import cartRoutes from './routes/cartRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import orderRoutes from './routes/orderRoutes';
import buildRoutes from './routes/buildRoutes';
import technicianRoutes from './routes/technicianRoutes';
import staffRoutes from './routes/staffRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ----- helper สำหรับ view: แปลสถานะ (enum ภาษาอังกฤษ) เป็นภาษาไทย + สี badge -----
// ใส่ผ่าน app.locals เพื่อให้ทุกหน้าเรียกใช้ได้เลยโดยไม่ต้องส่งจาก controller ทีละหน้า
const STATUS_LABELS: Record<string, string> = {
  pending: 'รอดำเนินการ',
  paid: 'ชำระเงินแล้ว',
  cancelled: 'ยกเลิกแล้ว',
  draft: 'ฉบับร่าง',
  assigned: 'ช่างรับงานแล้ว',
  assembling: 'กำลังประกอบ',
  completed: 'ประกอบเสร็จ',
  shipped: 'กำลังจัดส่ง',
  delivered: 'จัดส่งถึงแล้ว',
  preparing: 'เตรียมจัดส่ง',
  unassigned: 'รอตรวจสอบ',
  staff: 'พนักงาน',
  technician: 'ช่างเทคนิค',
  admin: 'แอดมิน',
  // ไม่ใช่สถานะ order/build แต่เป็นวิธีชำระเงิน (Payment.payment_method) - ใช้ map เดียวกันเพื่อความสะดวก (statusLabel เรียกใช้ได้เลย)
  cod: 'เก็บเงินปลายทาง',
  bank_transfer: 'โอนเงิน',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-amber',
  paid: 'badge-green',
  cancelled: 'badge-red',
  draft: 'badge-gray',
  assigned: 'badge-brand',
  assembling: 'badge-brand',
  completed: 'badge-green',
  shipped: 'badge-brand',
  delivered: 'badge-green',
  preparing: 'badge-amber',
  unassigned: 'badge-amber',
  staff: 'badge-brand',
  technician: 'badge-brand',
  admin: 'badge-gray',
};

app.locals.statusLabel = (status: string): string => STATUS_LABELS[status] ?? status;
app.locals.statusColor = (status: string): string => STATUS_COLORS[status] ?? 'badge-gray';
app.locals.formatPhone = formatPhone;
app.locals.categoryName = categoryNameById;
app.locals.brandName = brandNameById;
app.locals.parseSpecDetail = parseSpecDetail;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(expressLayouts);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(i18n); // อ่านภาษาที่เลือกไว้จาก cookie แนบ res.locals.t / res.locals.lang ให้ทุกหน้า
app.use(currentUser); // ถอดรหัส JWT จาก cookie (ถ้ามี) แนบ req.customer/req.employee ให้ทุก route รวมหน้า public
app.use(express.static(path.join(__dirname, '..', 'public')));

// หน้าแรก: ดึงหมวดหมู่ + สินค้าที่ขายอยู่ มาทำการ์ดหมวดหมู่ (จำนวนสินค้า, ราคาเริ่มต้น, รูปตัวอย่าง)
// และสินค้าที่โชว์ใน hero (เคส product_id 40) ถ้าไม่มีสินค้านี้ hero จะไม่แสดงป้ายราคา
const HERO_PRODUCT_ID = 40;
app.get('/', async (req, res) => {
  const [categories, products] = await Promise.all([productService.listCategories(), productService.listProducts()]);
  const categoryTiles = categories.map((c) => {
    const items = products.filter((p) => p.category_id === c.category_id);
    // รูปตัวอย่างของหมวด = สินค้าที่แพงที่สุดในหมวดที่มีรูป
    const showcase = [...items].sort((a, b) => b.price - a.price).find((p) => p.image_url);
    return {
      category_id: c.category_id,
      category_name: c.category_name,
      count: items.length,
      minPrice: items.length ? Math.min(...items.map((p) => p.price)) : null,
      image_url: showcase ? showcase.image_url : null,
    };
  });
  const heroProduct = products.find((p) => p.product_id === HERO_PRODUCT_ID) || null;
  res.render('home', { title: 'หน้าแรก', categoryTiles, heroProduct, productCount: products.length });
});

// สลับภาษาไทย/อังกฤษ - ตั้ง cookie แล้วเด้งกลับไปหน้าเดิมที่กดมา (อยู่ตรงนี้เพราะเป็น route กลางๆ ไม่ผูกกับ feature ไหนโดยเฉพาะ)
app.get('/lang/:lang', (req, res) => {
  const lang = req.params.lang === 'en' ? 'en' : 'th';
  res.cookie(LANG_COOKIE, lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  const back = req.get('Referer');
  res.redirect(back && !back.includes('/lang/') ? back : '/');
});

app.use('/products', productRoutes);
app.use('/auth', customerAuthRoutes);
app.use('/account', accountRoutes);
app.use('/staff/auth', employeeAuthRoutes);
app.use('/staff/account', employeeAccountRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/orders', orderRoutes);
app.use('/build', buildRoutes);
app.use('/technician', technicianRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'ไม่พบหน้านี้' });
});

app.use(errorHandler);

export default app;
