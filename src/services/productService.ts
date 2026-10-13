import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { query, queryOne, execute } from '../config/db';
import { ValidationError } from '../utils/validate';

// จัดการสินค้า/หมวดหมู่/แบรนด์ - ใช้ทั้งฝั่งแสดงหน้าร้าน (productController) และฝั่ง admin (เพิ่ม/แก้ไข/ปิดขายสินค้า)

// เช็คความถูกต้องพื้นฐานก่อนบันทึกทุกครั้ง (ทั้งตอนเพิ่มและแก้ไข) ให้ได้ข้อความ error ที่ชี้ช่องได้ตรง
// ตารางเองก็มี CHECK (price > 0 AND stock_quantity >= 0) กันอีกชั้นถ้ามีที่อื่นเขียนผิด
async function validateProductInput(data: { product_name?: string; category_id?: number; brand_id?: number; price?: number; stock_quantity?: number; warranty_months?: number | null }) {
  if (!data.product_name || !data.product_name.trim()) {
    throw new ValidationError('product_name', 'กรุณากรอกชื่อสินค้า');
  }
  if (data.category_id !== undefined) {
    const found = await queryOne('SELECT category_id FROM category WHERE category_id = ?', [data.category_id]);
    if (!found) throw new ValidationError('category_id', 'กรุณาเลือกหมวดหมู่ให้ถูกต้อง');
  }
  if (data.brand_id !== undefined) {
    const found = await queryOne('SELECT brand_id FROM brand WHERE brand_id = ?', [data.brand_id]);
    if (!found) throw new ValidationError('brand_id', 'กรุณาเลือกแบรนด์ให้ถูกต้อง');
  }
  if (data.price === undefined || isNaN(data.price) || data.price <= 0) {
    throw new ValidationError('price', 'กรุณากรอกราคาให้ถูกต้อง (มากกว่า 0)');
  }
  if (data.stock_quantity !== undefined && (isNaN(data.stock_quantity) || data.stock_quantity < 0)) {
    throw new ValidationError('stock_quantity', 'จำนวนสต็อกต้องไม่ติดลบ');
  }
  if (data.warranty_months !== undefined && data.warranty_months !== null && (isNaN(data.warranty_months) || data.warranty_months < 0)) {
    throw new ValidationError('warranty_months', 'ระยะประกันต้องไม่ติดลบ');
  }
}

export async function listProducts(filters?: {
  category_id?: number;
  brand_id?: number;
  includeInactive?: boolean; // admin เท่านั้นที่ต้องเห็นสินค้าที่ถูกซ่อนไว้ด้วย (ดู listProductsForAdmin)
}): Promise<Product[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!filters?.includeInactive) where.push('is_active = TRUE');
  if (filters?.category_id) {
    where.push('category_id = ?');
    params.push(filters.category_id);
  }
  if (filters?.brand_id) {
    where.push('brand_id = ?');
    params.push(filters.brand_id);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query<Product>(`SELECT * FROM product ${whereSql} ORDER BY product_id`, params);
}

// สำหรับหน้า admin/staff เท่านั้น - ต้องเห็นสินค้าที่ถูกซ่อน (is_active = false) ด้วย จะได้กดเปิดขายใหม่ได้
export async function listProductsForAdmin(): Promise<Product[]> {
  return listProducts({ includeInactive: true });
}

export async function getProductById(productId: number): Promise<Product | null> {
  return queryOne<Product>('SELECT * FROM product WHERE product_id = ?', [productId]);
}

export async function createProduct(
  data: Omit<Product, 'product_id' | 'is_active'> & { is_active?: boolean }
): Promise<Product> {
  await validateProductInput(data);
  const result = await execute(
    `INSERT INTO product (product_name, category_id, brand_id, price, stock_quantity, spec_detail, image_url, warranty_months, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.product_name,
      data.category_id,
      data.brand_id,
      data.price,
      data.stock_quantity ?? 0,
      data.spec_detail ?? null,
      data.image_url ?? null,
      data.warranty_months ?? null,
      data.is_active ?? true,
    ]
  );
  return (await getProductById(result.insertId))!;
}

// คอลัมน์ที่ admin แก้ได้ (กันไม่ให้มีการส่งชื่อคอลัมน์แปลกๆ เข้ามาต่อเป็น SQL)
const EDITABLE_COLUMNS = [
  'product_name',
  'category_id',
  'brand_id',
  'price',
  'stock_quantity',
  'spec_detail',
  'image_url',
  'warranty_months',
  'is_active',
] as const;

export async function updateProduct(
  productId: number,
  data: Partial<Omit<Product, 'product_id'>>
): Promise<void> {
  const product = await getProductById(productId);
  if (!product) throw new Error('ไม่พบสินค้านี้');
  await validateProductInput({ ...product, ...data });

  const sets: string[] = [];
  const params: unknown[] = [];
  for (const col of EDITABLE_COLUMNS) {
    if (col in data) {
      sets.push(`${col} = ?`);
      params.push((data as Record<string, unknown>)[col] ?? null);
    }
  }
  if (sets.length === 0) return;
  await execute(`UPDATE product SET ${sets.join(', ')} WHERE product_id = ?`, [...params, productId]);
}

// soft delete เท่านั้น - ห้ามลบแถวจริง เพราะ order_item/build_item เก่ายังอ้างอิง product_id นี้อยู่
// (FK ON DELETE RESTRICT ใน schema ก็กันการลบสินค้าที่มีอยู่ในออเดอร์ไว้อีกชั้น)
export async function setProductActive(productId: number, isActive: boolean): Promise<void> {
  const result = await execute('UPDATE product SET is_active = ? WHERE product_id = ?', [isActive, productId]);
  if (result.affectedRows === 0) throw new Error('ไม่พบสินค้านี้');
}

export async function listCategories(): Promise<Category[]> {
  return query<Category>('SELECT * FROM category ORDER BY category_id');
}

export async function listBuildCategories(): Promise<Category[]> {
  return query<Category>('SELECT * FROM category WHERE is_build_component = TRUE ORDER BY category_id');
}

export async function listBrands(): Promise<Brand[]> {
  return query<Brand>('SELECT * FROM brand ORDER BY brand_id');
}
