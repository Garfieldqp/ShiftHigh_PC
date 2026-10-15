import { Request, Response } from 'express';
import * as productService from '../services/productService';
import * as buildService from '../services/buildService';
import * as cartService from '../services/cartService';
import * as shipmentService from '../services/shipmentService';
import * as customerService from '../services/customerService';

// หน้า "จัดสเปคคอม" ฝั่งลูกค้า - เลือกอะไหล่ทีละหมวดแล้วกดใส่ตะกร้าเป็นชุดเดียว
async function buildProductsByCategory() {
  const categories = await productService.listBuildCategories();
  const products = await productService.listProducts();
  return categories.map((c) => ({
    category: c,
    products: products.filter((p) => p.category_id === c.category_id),
  }));
}

export async function showBuildSelector(req: Request, res: Response) {
  const productsByCategory = await buildProductsByCategory();
  res.render('build/select', { title: 'จัดสเปคคอม', productsByCategory, error: null });
}

export async function saveBuildToCart(req: Request, res: Response) {
  const customerId = req.customer!.customer_id;
  // ถ้าลูกค้าไม่ได้ตั้งชื่อสเปค ใช้ชื่อลูกค้าเป็นชื่อสเปคแทน ช่างกับพนักงานจะได้รู้ทันทีว่าเป็นงานของใคร
  let buildName = String(req.body.build_name || '').trim();
  if (!buildName) {
    const customer = await customerService.getCustomerById(customerId);
    buildName = customer?.full_name || res.locals.t('สเปคคอมของฉัน');
  }

  const categories = await productService.listBuildCategories();
  const items: { product_id: number; quantity: number }[] = [];
  for (const c of categories) {
    const value = req.body[`category_${c.category_id}`];
    if (value) {
      const quantity = 1;
      const products = await productService.listProducts({ category_id: c.category_id });
      if (!Number.isSafeInteger(quantity) || quantity < 1 || !products.some(p => p.product_id === Number(value))) return res.status(400).send(res.locals.t('ข้อมูลอะไหล่หรือจำนวนไม่ถูกต้อง'));
      items.push({ product_id: Number(value), quantity });
    }
  }

  try {
    const build = await buildService.createDraftBuild(customerId, buildName, items);
    await cartService.addBuildToCart(customerId, build.build_id);
    res.redirect('/cart');
  } catch (err: any) {
    const productsByCategory = await buildProductsByCategory();
    res.render('build/select', { title: 'จัดสเปคคอม', productsByCategory, error: err.message });
  }
}

export async function showBuildStatus(req: Request, res: Response) {
  const build = await buildService.getBuildById(Number(req.params.id));
  if (!build || build.customer_id !== req.customer!.customer_id) return res.status(404).send(res.locals.t('ไม่พบข้อมูล'));
  const shipment = await shipmentService.getShipmentForBuild(build.build_id);
  const items = await buildService.getBuildItems(build.build_id);
  const history = build ? await buildService.getBuildHistory(build.build_id) : [];
  res.render('build/status', { title: 'สถานะงานประกอบ', build, items, history, shipment });
}
