// Entity: แบรนด์สินค้า (เช่น Intel, ASUS, Corsair) - หนึ่งแบรนด์มีสินค้าได้หลายชิ้น (1:N กับ Product)
export interface Brand {
  brand_id: number; // PK
  brand_name: string;
  country_origin?: string; // ประเทศต้นกำเนิดของแบรนด์ (ไม่บังคับกรอก)
}
