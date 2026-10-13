// แปลง Product.spec_detail (string ยาวๆ ที่ admin พิมพ์ใน textarea แบบ "หัวข้อ: ค่า" บรรทัดละอัน)
// ให้กลายเป็นตารางสเปคแบบร้านคอมจริงๆ ในหน้ารายละเอียดสินค้า (ดู views/products/show.ejs)
// เก็บเป็น string เดียวเหมือนเดิมใน Product model - ไม่ต้องเพิ่ม field/entity ใหม่ แค่ตกลง "รูปแบบ" ของข้อความกันเอง

export interface SpecRow {
  label: string;
  value: string;
}

/**
 * แยกแต่ละบรรทัดของ spec_detail ที่หน้าตาเป็น "หัวข้อ: ค่า" ออกเป็น label/value
 * บรรทัดที่ไม่มี ':' จะถือว่าทั้งบรรทัดเป็น value (label ว่าง) กันเผื่อ spec_detail เก่าที่เป็นประโยคเดียวยาวๆ
 */
export function parseSpecDetail(raw?: string): SpecRow[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const sepIndex = line.indexOf(':');
      if (sepIndex === -1) return { label: '', value: line };
      return {
        label: line.slice(0, sepIndex).trim(),
        value: line.slice(sepIndex + 1).trim(),
      };
    });
}
