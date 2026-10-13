import { query } from '../config/db';

/**
 * ชื่อหมวดหมู่/แบรนด์ถูกเรียกจาก view ทุกหน้า (ผ่าน app.locals ซึ่งเป็นฟังก์ชันแบบ sync)
 * จึงโหลดจาก MySQL มาเก็บไว้ในหน่วยความจำครั้งเดียวตอนเปิดเซิร์ฟเวอร์ (refreshLookups ใน server.ts)
 * แอปไม่มีหน้าเพิ่ม/แก้หมวดหมู่หรือแบรนด์ ถ้าแก้ตรงใน Workbench ให้รีสตาร์ทเซิร์ฟเวอร์
 */
const categoryNames = new Map<number, string>();
const brandNames = new Map<number, string>();

export async function refreshLookups(): Promise<void> {
  const categories = await query<{ category_id: number; category_name: string }>(
    'SELECT category_id, category_name FROM category'
  );
  const brands = await query<{ brand_id: number; brand_name: string }>('SELECT brand_id, brand_name FROM brand');
  categoryNames.clear();
  brandNames.clear();
  categories.forEach((c) => categoryNames.set(c.category_id, c.category_name));
  brands.forEach((b) => brandNames.set(b.brand_id, b.brand_name));
}

export function categoryNameById(categoryId: number): string | undefined {
  return categoryNames.get(categoryId);
}

export function brandNameById(brandId: number): string | undefined {
  return brandNames.get(brandId);
}
