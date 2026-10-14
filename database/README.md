# ฐานข้อมูล MySQL ของ Shift-High PC

โฟลเดอร์นี้มีไฟล์สร้างฐานข้อมูล `pc_shop` 13 ตาราง

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `schema.sql` | `CREATE DATABASE` + `CREATE TABLE` 13 ตาราง พร้อม PRIMARY KEY, FOREIGN KEY (ON DELETE / ON UPDATE), CHECK, DEFAULT, AUTO_INCREMENT |
| `seed.sql` | `INSERT` ข้อมูลตั้งต้น: หมวดหมู่ 8, แบรนด์ 20, สินค้า 48 (พร้อมรูป `image_url` = `/images/products/<product_id>.jpg` ไฟล์รูปอยู่ที่ `public/images/products/`), บัญชีทดสอบ, ออเดอร์และงานประกอบตัวอย่าง |
| `pc_shop_full.sql` | ไฟล์รวมรันทีเดียว: `schema.sql` + `seed.sql` + query 14 ข้อ (Q1–Q14) |
| `queries.sql` | query 14 ข้ออย่างเดียว ไม่มี DROP/CREATE รันซ้ำกี่รอบก็ได้ ข้อมูลที่เพิ่มบนเว็บ (เช่น สต็อก) ไม่หาย |

## ติดตั้งครั้งแรก

1. ติดตั้ง **MySQL Community Server 8** และ **MySQL Workbench**
2. เปิด Workbench → กดเข้า connection `Local instance 3306`
3. **File → Open SQL Script** → เลือก `database/schema.sql` → กดสายฟ้า ⚡
4. ทำแบบเดียวกันกับ `database/seed.sql`
5. กด refresh ที่แถบ SCHEMAS จะเห็น `pc_shop` พร้อม 13 ตาราง
6. คัดลอก `.env.example` เป็น `.env` แล้วใส่รหัสผ่าน root ที่ `DB_PASSWORD=`

### หรือรันไฟล์รวมไฟล์เดียว

**File → Open SQL Script** → เลือก `database/pc_shop_full.sql` → กดสายฟ้า ⚡
ได้ฐานข้อมูล + ข้อมูลตั้งต้น + ผล query Q1–Q10 ในครั้งเดียว (ผลแต่ละข้อขึ้นเป็นแท็บ Result แยกกัน)

## ล้างข้อมูลกลับเป็นค่าเริ่มต้น

เปิดแท็บ query ใหม่แล้วรัน

```sql
DROP DATABASE pc_shop;
```

แล้วรัน `schema.sql` และ `seed.sql` ใหม่ตามลำดับ หรือรัน `pc_shop_full.sql` ไฟล์เดียว
(ถ้ารัน `schema.sql` หรือ `pc_shop_full.sql` ทั้งที่ยังมี `pc_shop` อยู่ จะขึ้น `Error Code: 1007. Can't create database 'pc_shop'; database exists`)
ข้อมูลที่เพิ่มผ่านหน้าเว็บ (ออเดอร์ทดลอง, บัญชีที่สมัครใหม่) จะหายหมด เหลือแค่ข้อมูลใน seed

## Query 14 ข้อ (อยู่ใน `queries.sql` และท้ายไฟล์ `pc_shop_full.sql`)

อยากดูผล query อีกรอบ ให้เปิด **`queries.sql`** แล้วกดสายฟ้า ⚡ ไม่ต้องรัน `pc_shop_full.sql` ใหม่ เพราะไฟล์นั้นต้อง `DROP DATABASE` ก่อน ซึ่งจะลบข้อมูลที่เพิ่มบนเว็บทิ้งทั้งหมด

ใช้เฉพาะที่เรียนใน Lecture 8–10: SELECT, WHERE (AND/OR, BETWEEN, IN, LIKE, IS NULL), alias, ORDER BY, LIMIT,
COUNT/SUM/MIN/MAX/AVG/ROUND, GROUP BY, HAVING, INNER JOIN 2–4 ตาราง, LEFT JOIN + IS NULL, compound join condition, UPDATE, DELETE, INSERT
เรียง SELECT ทั้งหมดก่อน (Q1–Q10) แล้วตามด้วย UPDATE / DELETE / INSERT (Q11–Q14)

### Q1–Q10: SELECT (ผลขึ้นในแท็บ Result)

| ข้อ | ใครใช้ | คำถาม | ใช้อะไร | ผลจากข้อมูลใน seed |
|---|---|---|---|---|
| Q1 | ลูกค้า | การ์ดจอ RTX ราคา 10,000–30,000 บาท เรียงจากถูกไปแพง | `LIKE`, `BETWEEN`, `ORDER BY` | 3 แถว |
| Q2 | staff | สินค้าที่ยังขายอยู่และเหลือไม่เกิน 5 ชิ้น พร้อมแบรนด์และหมวดหมู่ | JOIN 3 ตาราง | 3 แถว |
| Q3 | เจ้าของร้าน | แต่ละหมวดมีสินค้ากี่ชิ้น ถูกสุด แพงสุด ราคาเฉลี่ย (เฉพาะหมวดที่มีอย่างน้อย 5 ชิ้น) | `COUNT/MIN/MAX/AVG`, `ROUND`, `GROUP BY`, `HAVING` | 8 แถว |
| Q4 | เจ้าของร้าน | สินค้าขายดี 5 อันดับแรกจากออเดอร์ที่จ่ายแล้ว และรายได้ของแต่ละตัว | JOIN + `SUM` + `GROUP BY` + `LIMIT` | 5 แถว |
| Q5 | เจ้าของร้าน | หมวดหมู่ไหนทำรายได้มากที่สุดจากออเดอร์ที่จ่ายแล้ว | JOIN 4 ตาราง + `GROUP BY` | 3 แถว |
| Q6 | การตลาด | ลูกค้าที่ซื้อ (จ่ายแล้ว) รวม 3,000 บาทขึ้นไป | `WHERE` + `GROUP BY` + `HAVING` | 2 แถว |
| Q7 | ช่าง | ชุดคอมที่จ่ายแล้วแต่ยังไม่มีช่างรับ เรียงจากเก่าสุด | `IS NULL` + JOIN | 1 แถว (build 3) |
| Q8 | admin | ช่างแต่ละคนกำลังทำงานอยู่กี่งาน รวมช่างที่ไม่มีงาน | `LEFT JOIN` + `AND` ใน `ON` | 1 แถว |
| Q9 | เจ้าของร้าน | สินค้าที่ยังขายอยู่แต่ไม่เคยถูกสั่งซื้อหรือใส่ในชุดคอมเลย | `LEFT JOIN` 2 ครั้ง + `IS NULL` | 25 แถว |
| Q10 | ฝ่ายจัดส่ง | ออเดอร์ที่จ่ายแล้วแต่ยังไม่ได้สร้าง shipment | `LEFT JOIN` + `IS NULL` + JOIN | 1 แถว (order 3) |

หมายเหตุ Q6: เดิมเพื่อนตั้งเกณฑ์ไว้ 5,000 บาท แต่ใน seed ลูกค้าที่ยอดสูงสุดคือ 4,370 บาท จึงไม่มีแถวออกมา
เลยลดเกณฑ์เป็น 3,000 บาท ได้ 2 คน (4,370 และ 4,080 บาท)

Q8: เงื่อนไข status ต้องอยู่ใน `ON` ไม่ใช่ `WHERE` ถ้าย้ายไป `WHERE` ช่างที่ไม่มีงานจะหายไป และ LEFT JOIN จะกลายเป็น inner join

### Q11–Q14: UPDATE / DELETE / INSERT (ผลขึ้นในแท็บ Output)

ตามหัวข้อ 7 ของรายงานใน Lecture 8: *"SQL source code for queries (e.g., select, update, delete)"*
ทุกข้อมี `--` ปิดไว้ เพื่อให้รันทั้งไฟล์ได้โดยไม่ error และไม่เปลี่ยนข้อมูล

| ข้อ | ทดสอบอะไร | คำสั่ง | ผลที่ควรได้ (ดูในแท็บ Output) |
|---|---|---|---|
| Q11 | UPDATE หลายแถว | ขึ้นราคาสินค้า Corsair (brand_id 5) 5% | ✅ `4 row(s) affected` |
| Q12 | CHECK | ตั้งสต็อกสินค้าเป็น -1 | ❌ `Error Code: 3819. Check constraint 'Product_CHK' is violated.` |
| Q13 | ON DELETE RESTRICT | ลบหมวดหมู่ CPU ที่ยังมีสินค้า | ❌ `Error Code: 1451. Cannot delete or update a parent row ... Product_FK1` |
| Q14 | CHECK exclusive arc | สร้าง payment ที่ไม่ผูกกับทั้ง order และ build | ❌ `Error Code: 3819. Check constraint 'Payment_Arc_CHK' is violated.` |

Q12, Q13, Q14 ขึ้น error สีแดง **คือผลที่ถูกต้อง** แปลว่า constraint กันข้อมูลผิดได้

วิธีลองทีละข้อ:
1. ลบ `--` หน้าคำสั่งของข้อนั้น
2. คลิกที่บรรทัดนั้น แล้วรันเฉพาะคำสั่งที่เคอร์เซอร์อยู่ (ลูกศรข้างปุ่ม Run) ใน `queries.sql` หรือ `pc_shop_full.sql` ก็ได้ (ถ้าเป็น `pc_shop_full.sql` อย่ารันทั้งไฟล์ซ้ำ เพราะ `CREATE DATABASE` บนสุดจะ error 1007)
3. ดูผลที่แท็บ **Output** ด้านล่าง (UPDATE / DELETE / INSERT ไม่ขึ้นเป็นตาราง)
4. Q11: รัน SELECT ของ Q11 อีกครั้ง จะเห็นราคาใหม่ เช่น 1,890 เป็น 1,984.50
5. ลองครบแล้วให้ล้างข้อมูลตามหัวข้อ "ล้างข้อมูลกลับเป็นค่าเริ่มต้น" เพราะ Q11 เปลี่ยนข้อมูลจริง

ถ้า Q11 ขึ้น `Error Code: 1175` เป็นการตั้งค่า safe update ของ Workbench เอง ไม่ใช่ SQL ผิด

## สิ่งที่ทำกับฐานข้อมูลไปแล้ว

- **โครงสร้าง 13 ตาราง** ยึดตาม Lab 7 proposal ฉบับแก้ไข และตรงกับ M3 Relational Schema (13 relation, FK 18 ตัว, ผ่าน 3NF)
- **ใช้เฉพาะ SQL ที่เรียน** ตัด `ENUM`, `UNIQUE`, `TEXT`, `DATETIME`, trigger, view, index, `NOW()`, `FOR UPDATE`, subquery ออก (รายละเอียดใน `CHANGES_MYSQL.md`)
- **Query** เดิมเพื่อนเขียนมา 15 ข้อพร้อม schema/seed ของตัวเอง ตรวจแล้ว query ทุกข้ออยู่ในเนื้อหา แต่ส่วน schema/seed ของเพื่อนมีสิ่งที่เกินเนื้อหาและไม่ตรงกับโปรเจค จึงเปลี่ยนไปใช้ `schema.sql` + `seed.sql` ของเราแทน:
  - เกินเนื้อหา: `DROP DATABASE IF EXISTS`, `CHARACTER SET`/`COLLATE`, `SET NAMES`, `UNIQUE`, `DATETIME`, `TEXT`, `DEFAULT CURRENT_TIMESTAMP`, `CURDATE()`, `CREATE INDEX`
  - ไม่ตรงกับโปรเจค: มีตาราง `cart_item` เพิ่ม (14 ตาราง), `build_item` ไม่มี `unit_price` (BR23), ON DELETE ไม่ตรง 3 จุด, ราคาและยอดรวมในข้อมูลตัวอย่างไม่ตรงกัน
  - คำสั่ง SELECT ของ Q1–Q10 ไม่ได้แก้ ยกเว้นเกณฑ์ของ Q6 ที่ลดจาก 5,000 เป็น 3,000 บาท แก้แค่ชื่อ constraint ในคอมเมนต์ Q12, Q13, Q14 ให้ตรงกับตารางเรา, Q14 เพิ่ม `payment_date` (ตารางเราไม่มีค่า default) และปิด UPDATE ของ Q11 ด้วย `--`
- ทดสอบรัน `pc_shop_full.sql` กับฐานข้อมูลเปล่าแล้ว ไม่มี error และ Q12, Q13, Q14 ขึ้น error ตามที่คาดไว้
- ตัดข้อ ON DELETE CASCADE (ลบชุดคอม draft) ออก ข้อ exclusive arc เดิมเป็นข้อ 15 จึงเลื่อนเป็นข้อ 14
- ลบงานประกอบตัวอย่าง "สเปคสำรอง" (build 4 สถานะ draft) ออกจาก seed เพราะไม่มี query ไหนใช้แล้ว ผลของ Q9 เลยเพิ่มจาก 23 เป็น 25 แถว (i7-14700K และ ROG STRIX Z790-E ไม่ได้อยู่ในชุดคอมไหนแล้ว) และแก้ `scripts/itest.ts` ให้สร้าง draft ใหม่เองตอนทดสอบ

## กฎทางธุรกิจที่บังคับด้วย SQL

| กฎ | บังคับด้วยอะไร |
|---|---|
| BR19, BR20 exclusive arc | `CHECK ((order_id IS NOT NULL AND build_id IS NULL) OR (order_id IS NULL AND build_id IS NOT NULL))` |
| BR22 สต็อกไม่ติดลบ | `CHECK (price > 0 AND stock_quantity >= 0)` |
| BR23 ราคาล็อกตอนซื้อ | คอลัมน์ `unit_price` ใน `order_item` และ `build_item` |
| BR24 รหัสผ่านเป็น hash | เก็บแค่ `password_hash` |
| สถานะต่างๆ | `CHECK (status IN (...))` แบบเดียวกับ `Product_Finish` ใน Lecture 8 |
| ลบข้อมูลแม่ที่ลูกยังอ้างอิงอยู่ไม่ได้ | FOREIGN KEY `ON DELETE RESTRICT` |
| ลบออเดอร์/งานประกอบแล้วรายการข้างในหายตาม | FOREIGN KEY `ON DELETE CASCADE` ใน `order_item`, `build_item` |

กฎที่ SQL ใน Lecture บังคับเองไม่ได้ แอปจะเช็คให้:
- **email ห้ามซ้ำ**: แอปเช็คก่อนสมัครทุกครั้ง
- **BR17, BR18 shipment/payment ไม่เกิน 1 ต่อรายการ**: แอปเช็คก่อนสร้างทุกครั้ง
- **BR25 build_date ห้ามเป็นวันในอนาคต**: แอปใส่เวลาปัจจุบันให้เอง ลูกค้ากรอกเองไม่ได้
- **BR4, BR7 ต้องมีสินค้าอย่างน้อย 1 ชิ้น**: สร้างออเดอร์กับรายการสินค้าใน transaction เดียวกัน

## สต็อกที่จองไว้ (objective O2)

```sql
SELECT p.product_id, p.product_name, p.stock_quantity AS available, SUM(bi.quantity) AS reserved
FROM product p
JOIN build_item bi ON bi.product_id = p.product_id
JOIN pc_build b ON b.build_id = bi.build_id
WHERE b.status IN ('paid', 'assigned', 'assembling', 'completed')
GROUP BY p.product_id, p.product_name, p.stock_quantity;
```

## บัญชีทดสอบ (ใช้ตอนพัฒนาเท่านั้น)

| Role | อีเมล | รหัสผ่าน |
|---|---|---|
| admin | admin@shift-high-pc.example | admin1234 |
| staff | staff@shift-high-pc.example | staff1234 |
| technician | technician@shift-high-pc.example | tech1234 |
| customer | customer@example.com | customer1234 |
| customer (ตัวอย่าง) | somchai@example.com, malee@example.com | customer1234 |

## ทดสอบอัตโนมัติ

หลังรัน `schema.sql` + `seed.sql` และตั้ง `.env` แล้ว สั่ง

```bash
npm run test:db
```
