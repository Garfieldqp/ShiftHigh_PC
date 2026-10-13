# สรุปการย้ายจาก dev store ไป MySQL

ยึดโครงสร้างข้อมูลจาก Lab 7 proposal ฉบับแก้ไข (13 entity, หัวข้อ 4.1) ทั้งหมด controllers, routes และ views ไม่ได้แก้

## ไฟล์ใหม่

| ไฟล์ | หน้าที่ |
|---|---|
| `database/schema.sql` | สร้างฐานข้อมูล + 13 ตาราง พร้อม PK/FK (ON DELETE / ON UPDATE), CHECK, DEFAULT, AUTO_INCREMENT |
| `database/seed.sql` | ข้อมูลตั้งต้นชุดเดิมจาก `store.ts` + ออเดอร์/งานประกอบตัวอย่าง |
| `database/README.md` | วิธีติดตั้งทีละขั้น |
| `src/data/lookups.ts` | cache ชื่อหมวดหมู่/แบรนด์ให้ view (แทน `categoryNameById` เดิมใน store.ts) |
| `src/data/cartStore.ts` | ตะกร้าสินค้า (ไม่ใช่ entity) เก็บในหน่วยความจำของเซิร์ฟเวอร์ ไม่มีไฟล์ JSON แล้ว |
| `src/utils/asyncErrors.ts` | ส่ง error จาก async controller ไปที่ errorHandler (ไม่งั้น request ค้างตอน DB มีปัญหา) |
| `scripts/itest.ts` | ทดสอบชั้นฐานข้อมูลอัตโนมัติ 60+ กรณี (`npm run test:db`) |

## ไฟล์ที่แก้

| ไฟล์ | เปลี่ยนอะไร |
|---|---|
| `src/services/*.ts` (11 ไฟล์) | query MySQL แทน array ในหน่วยความจำ ชื่อฟังก์ชันและค่าที่คืนเหมือนเดิม |
| `src/config/db.ts` | ตั้ง pool ให้ DECIMAL เป็น number และ BOOLEAN เป็น true/false + helper `query/execute/withTransaction` |
| `src/config/env.ts`, `.env.example` | ค่าเริ่มต้น `DB_USER=root`, `DB_NAME=pc_shop` |
| `src/middleware/currentUser.ts` | ตรวจผู้ใช้จาก MySQL (async) |
| `src/server.ts` | เช็คฐานข้อมูลก่อนเปิดเว็บ ถ้าต่อไม่ได้จะบอกสาเหตุ |
| `src/app.ts` | import lookups แทน store |
| `src/models/BuildItem.ts` | เพิ่ม `unit_price` ตามเอกสารฉบับแก้ไข (BR23) |
| `src/data/store.ts` | ลบทิ้ง |
| `data/` (`dev-store.json`, `carts.json`, `README.md`) | ลบทั้งโฟลเดอร์ ข้อมูลทั้งหมดอยู่ใน MySQL ตะกร้าอยู่ในหน่วยความจำ |

## พฤติกรรมที่เปลี่ยน (ตั้งใจแก้ ให้ตรงกับ business rules)

1. **ราคาอะไหล่ในงานประกอบล็อกตอนสร้างงาน (BR23)** เดิมหน้า staff และรายงานใช้ราคาปัจจุบันของสินค้า ตอนนี้ใช้ `build_item.unit_price`
2. **checkout อยู่ใน transaction เดียว** ถ้าพังกลางทาง ไม่มีอะไรถูกบันทึก และตะกร้ายังอยู่ การหักสต็อกใช้ `UPDATE ... WHERE stock_quantity >= ?` ลูกค้าสองคนซื้อชิ้นสุดท้ายพร้อมกันจึงได้คนเดียว
3. **รวมยอดตรวจสต็อก** เดิมเช็คสินค้าเดี่ยวกับอะไหล่ในชุดคอมแยกกัน ถ้าตะกร้ามีสินค้าตัวเดียวกันทั้งสองแบบอาจขายเกินสต็อก ตอนนี้รวมยอดก่อนเช็ค
4. **จ่ายชุดคอมซ้ำไม่ได้** checkout รับเฉพาะงานที่ยังเป็น `draft`
5. **ยกเลิกงานคืนสต็อกเฉพาะงานที่หักสต็อกไปแล้ว** (paid ถึง completed) เดิมยกเลิก draft ก็คืนสต็อกเพิ่มทั้งที่ไม่เคยหัก
6. **ช่างสองคนรับงานเดียวกันพร้อมกันไม่ได้** ใช้ UPDATE แบบมีเงื่อนไข `status = 'paid'`
7. **ตะกร้าว่างเมื่อเซิร์ฟเวอร์รีสตาร์ท** เดิมเก็บใน `data/carts.json` ตอนนี้เก็บในหน่วยความจำ (ตะกร้าไม่ใช่ entity จึงไม่มีตารางใน MySQL) ออเดอร์ที่ checkout แล้วอยู่ใน MySQL ไม่หาย

## SQL ใช้เฉพาะที่เรียนใน Lecture 8–12

| เดิมใช้ | เปลี่ยนเป็น |
|---|---|
| `ENUM(...)` | `VARCHAR` + `CHECK (col IN (...))` |
| `DATETIME`, `TEXT`, `INT UNSIGNED` | `TIMESTAMP`, `VARCHAR`, `INT` |
| `UNIQUE` (email, shipment/payment) | แอปเช็คก่อนบันทึก |
| trigger (BR25), view, index | ตัดออก (แอปใส่วันที่ให้เอง, สต็อกที่จองใช้ query ใน `database/README.md`) |
| `NOW()`, `CURDATE()` | ส่งวันที่จากแอปผ่าน `?` |
| `SELECT ... FOR UPDATE` | `UPDATE ... WHERE ... AND stock_quantity >= ?` แล้วเช็คจำนวนแถวที่เปลี่ยน |
| subquery, `UNION ALL`, `COALESCE` | แยกเป็นหลาย `SELECT` (JOIN + GROUP BY) แล้วรวมผลในโค้ด |
| `UPDATE ... JOIN` | `UPDATE` ทีละแถว |
| `DROP DATABASE IF EXISTS` | รัน `DROP DATABASE pc_shop;` เองเมื่อต้องการล้างข้อมูล |
| email เทียบแบบไม่สนตัวพิมพ์ | แอปเก็บ email เป็นตัวพิมพ์เล็กเสมอ |
