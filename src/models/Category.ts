// Entity: หมวดหมู่สินค้า (เช่น CPU, การ์ดจอ, อุปกรณ์เสริม) - หนึ่งหมวดหมู่มีสินค้าได้หลายชิ้น (1:N กับ Product)
export interface Category {
  category_id: number; // PK
  category_name: string;
  is_build_component: boolean; // true = เป็นอะไหล่ที่ใช้จัดสเปคคอมได้ (เช่น CPU), false = แค่อุปกรณ์เสริมทั่วไป (เช่น เมาส์) เอาไว้กรองว่าหมวดไหนต้องโชว์ในหน้า "จัดสเปคคอม"
  description?: string;
}
