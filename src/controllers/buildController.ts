import { Request, Response } from 'express';
import * as productService from '../services/productService';
import * as buildService from '../services/buildService';
import * as cartService from '../services/cartService';

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
  const buildName = String(req.body.build_name || res.locals.t('สเปคคอมของฉัน')).trim();

  const categories = await productService.listBuildCategories();
  const items: { product_id: number; quantity: number }[] = [];
  for (const c of categories) {
    const value = req.body[`category_${c.category_id}`];
    if (value) items.push({ product_id: Number(value), quantity: 1 });
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
  const items = build ? await buildService.getBuildItems(build.build_id) : [];
  const history = build ? await buildService.getBuildHistory(build.build_id) : [];
  res.render('build/status', { title: 'สถานะงานประกอบ', build, items, history });
}
