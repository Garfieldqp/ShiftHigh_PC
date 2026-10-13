import { Request, Response } from 'express';
import * as productService from '../services/productService';
import * as employeeService from '../services/employeeService';
import { EmployeeRole } from '../models/Employee';
import { ValidationError } from '../utils/validate';

// หน้าเฉพาะ admin: เพิ่ม/แก้ไข/ปิดขายสินค้า + อนุมัติ/เปลี่ยน role/ปิดเปิดบัญชีพนักงาน (ดู roleGuard(['admin']) ที่ adminRoutes.ts)

// เฉพาะ admin เท่านั้น (ดู src/routes/adminRoutes.ts)
// งานสต็อก/จัดส่ง/รายงาน/ออเดอร์ อยู่ที่ src/controllers/staffController.ts แทน (staff เข้าได้ด้วย)

export async function showProductList(req: Request, res: Response) {
  const products = await productService.listProductsForAdmin();
  const categories = await productService.listCategories();
  const brands = await productService.listBrands();
  const brandById = new Map(brands.map((b) => [b.brand_id, b.brand_name]));

  // จัดกลุ่มสินค้าตามหมวดหมู่ ให้หาสินค้าเจอง่ายขึ้นเมื่อรายการยาวขึ้นในอนาคต - ข้ามหมวดที่ยังไม่มีสินค้าเลย
  // แนบชื่อแบรนด์ไปด้วยให้กรอง/แสดงผลได้ (ดู brand-filter ที่หน้า admin/products/index.ejs)
  const productsByCategory = categories
    .map((c) => ({
      category: c,
      products: products
        .filter((p) => p.category_id === c.category_id)
        .map((p) => ({ ...p, brand_name: brandById.get(p.brand_id) ?? 'ไม่ระบุแบรนด์' })),
    }))
    .filter((group) => group.products.length > 0);

  res.render('admin/products/index', { title: 'จัดการสินค้า', productsByCategory, brands });
}

export async function showNewProductForm(req: Request, res: Response) {
  const categories = await productService.listCategories();
  const brands = await productService.listBrands();
  res.render('admin/products/new', { title: 'เพิ่มสินค้าใหม่', categories, brands, error: null, errorField: null, formValues: null });
}

export async function createProduct(req: Request, res: Response) {
  try {
    await productService.createProduct({
      product_name: req.body.product_name,
      category_id: Number(req.body.category_id),
      brand_id: Number(req.body.brand_id),
      price: Number(req.body.price),
      stock_quantity: Number(req.body.stock_quantity) || 0,
      spec_detail: req.body.spec_detail || undefined,
      image_url: req.body.image_url || undefined,
      warranty_months: req.body.warranty_months ? Number(req.body.warranty_months) : undefined,
    });
    res.redirect('/admin/products');
  } catch (err: any) {
    const categories = await productService.listCategories();
    const brands = await productService.listBrands();
    const field = err instanceof ValidationError ? err.field : null;
    res.render('admin/products/new', { title: 'เพิ่มสินค้าใหม่', categories, brands, error: err.message, errorField: field, formValues: req.body });
  }
}

export async function showEditProductForm(req: Request, res: Response) {
  const product = await productService.getProductById(Number(req.params.id));
  if (!product) return res.redirect('/admin/products');
  const categories = await productService.listCategories();
  const brands = await productService.listBrands();
  res.render('admin/products/edit', { title: 'แก้ไขสินค้า', product, categories, brands, error: null, errorField: null });
}

export async function updateProduct(req: Request, res: Response) {
  const productId = Number(req.params.id);
  try {
    await productService.updateProduct(productId, {
      product_name: req.body.product_name,
      category_id: Number(req.body.category_id),
      brand_id: Number(req.body.brand_id),
      price: Number(req.body.price),
      stock_quantity: Number(req.body.stock_quantity) || 0,
      spec_detail: req.body.spec_detail || undefined,
      image_url: req.body.image_url || undefined,
      warranty_months: req.body.warranty_months ? Number(req.body.warranty_months) : undefined,
    });
    res.redirect('/admin/products');
  } catch (err: any) {
    // โชว์ค่าที่แอดมินเพิ่งกรอกไว้ (ที่ผิด) แทนที่จะดึงค่าเดิมจาก DB มาทับ ผู้ใช้จะได้เห็นว่าตัวเองพิมพ์อะไรไปแล้วแก้ตรงจุดได้เลย
    const product = {
      ...(await productService.getProductById(productId)),
      ...req.body,
      product_id: productId,
      category_id: Number(req.body.category_id),
      brand_id: Number(req.body.brand_id),
      price: Number(req.body.price),
      stock_quantity: Number(req.body.stock_quantity) || 0,
    };
    const categories = await productService.listCategories();
    const brands = await productService.listBrands();
    const field = err instanceof ValidationError ? err.field : null;
    res.render('admin/products/edit', { title: 'แก้ไขสินค้า', product, categories, brands, error: err.message, errorField: field });
  }
}

export async function deactivateProduct(req: Request, res: Response) {
  try {
    await productService.setProductActive(Number(req.params.id), false);
  } catch (err: any) {
    console.error('deactivateProduct:', err.message);
  }
  res.redirect('/admin/products');
}

export async function reactivateProduct(req: Request, res: Response) {
  try {
    await productService.setProductActive(Number(req.params.id), true);
  } catch (err: any) {
    console.error('reactivateProduct:', err.message);
  }
  res.redirect('/admin/products');
}

export async function showEmployees(req: Request, res: Response) {
  const employees = await employeeService.listEmployees();
  res.render('admin/employees', { title: 'จัดการพนักงาน', employees });
}

function toRole(value: unknown): EmployeeRole {
  return value === 'admin' || value === 'technician' || value === 'staff' ? value : 'staff';
}

export async function approveEmployee(req: Request, res: Response) {
  try {
    await employeeService.approveEmployee(Number(req.params.id), toRole(req.body.role));
  } catch (err: any) {
    console.error('approveEmployee:', err.message);
  }
  res.redirect('/admin/employees');
}

export async function changeEmployeeRole(req: Request, res: Response) {
  try {
    await employeeService.changeRole(Number(req.params.id), toRole(req.body.role));
  } catch (err: any) {
    console.error('changeEmployeeRole:', err.message);
  }
  res.redirect('/admin/employees');
}

export async function disableEmployee(req: Request, res: Response) {
  try {
    await employeeService.disableAccount(Number(req.params.id));
  } catch (err: any) {
    console.error('disableEmployee:', err.message);
  }
  res.redirect('/admin/employees');
}

export async function enableEmployee(req: Request, res: Response) {
  try {
    await employeeService.enableAccount(Number(req.params.id));
  } catch (err: any) {
    console.error('enableEmployee:', err.message);
  }
  res.redirect('/admin/employees');
}
