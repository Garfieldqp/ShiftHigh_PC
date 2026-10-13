# PC Shop / Shift-High PC - Project Handoff Brief

วางข้อความนี้ทั้งหมดในข้อความแรกที่คุยกับ AI ตัวใหม่ (ChatGPT หรือตัวไหนก็ได้) แล้วบอกว่า "อ่านเอกสารนี้ก่อน แล้วช่วยฉันต่อจากตรงนี้" ก็จะเข้าใจบริบททั้งหมดทันที

---

## 1. ฉันคือใคร บริบทของฉัน

- นักศึกษาปี 2 มหาวิทยาลัยในไทย เรียนวิชา **953212 Database Systems / SE212 Database System and Design**
- ทำโปรเจกต์เทอมเป็นทีม 3 คน: Kitiphoom Phoomsaard (682115005), Chonnasin Kansutthiwiwat (682115012), Suphapish Aueananchai (682115044)
- ภาษาอังกฤษไม่แข็งแรงมาก ต้องการคำอธิบายง่ายๆ ไม่ใช้ศัพท์ยากเกินจำเป็น
- ใช้ Claude Code (แยกอีก instance หนึ่ง) เขียนโค้ดเว็บจริง ส่วน AI ตัวนี้ใช้ช่วยคิด/ตรวจ/ทำเอกสาร

## 2. โปรเจกต์คืออะไร

**ชื่อ:** Shift-High PC (E-Commerce and Custom PC Build Management System)

**คืออะไร:** เว็บแอปสำหรับร้านคอมพิวเตอร์ขนาดเล็ก รองรับ 2 แบบการซื้อในระบบเดียว:
1. ซื้อของทั่วไป (เลือกสินค้า ใส่ตะกร้า checkout)
2. จัดสเปคคอมพิวเตอร์ตามความต้องการลูกค้า (เลือกอะไหล่ทีละหมวด ให้ช่างประกอบ)

**ปัญหาที่แก้:** ร้านเดิมทำทุกอย่างด้วยมือ ไม่มีฐานข้อมูล ทำให้สต็อกไม่ชัดเจน (อะไหล่ที่จองไว้ให้งานประกอบถูกขายซ้ำได้) งานประกอบต้องพึ่งความจำพนักงานคนเดียว และเจ้าของร้านตอบคำถามธุรกิจพื้นฐานไม่ได้เร็ว (ขายดีอะไร มีงานค้างกี่งาน)

## 3. กติกาของวิชานี้ (สำคัญมาก ต้องทำตามเป๊ะ)

- **อัปเดต (เปลี่ยนกติกาใหม่จากอาจารย์): ERD ต้องใช้ Crow's Foot notation แทน Chen notation แล้ว** (เดิมใบงาน Lab 7 default เป็น Chen แต่อาจารย์แจ้งเปลี่ยนภายหลัง) หลักการ Crow's Foot: entity แสดงเป็นกล่องเดียว (หัวกล่องชื่อ entity, แถวข้างในคือ attribute เหมือนตาราง) **ไม่มีเพชร/ไดมอนด์ความสัมพันธ์แล้ว** เส้นความสัมพันธ์ลากตรงจาก entity ไป entity เลย ปลายเส้นใช้สัญลักษณ์ตีนกา (crow's foot) แทน cardinality: `||` = หนึ่งเดียวแบบบังคับ (mandatory one), `o|` = หนึ่งเดียวแบบไม่บังคับ (optional one), `o<` = ศูนย์ถึงมากแบบไม่บังคับ (zero or many), `|<` = หนึ่งถึงมากแบบบังคับ (one or many) PK ยังคงขีดเส้นใต้ FK เขียนกำกับว่า (FK) ต่อท้ายชื่อ attribute weak entity (OrderItem, BuildItem) ยังคงแสดงด้วยกรอบสองชั้นเหมือนเดิม
- **มีไฟล์ `.drawio` แบบ Crow's Foot ทำไว้แล้วก่อนหน้านี้** (ใช้ชื่อ `pc_shop_erd_crowsfoot.drawio`) ตอนแรกทำไว้แค่ให้ First อ่านทำความเข้าใจเอง ยังไม่ได้ตั้งใจให้ส่งอาจารย์ ตอนนี้กติกาเปลี่ยนแล้วให้ **เอาไฟล์เดิมนั้นมาเป็นฐาน ตรวจสอบ/ปรับปรุงให้สมบูรณ์แล้วส่งจริงได้เลย** ไม่ต้องเริ่มจากศูนย์ (ถ้าไฟล์เดิมหายไปแล้ว ให้บอก AI ตัวใหม่สร้างใหม่ตามหลักการข้างบน โดยอิงจาก 13 entity และ 18 ความสัมพันธ์ในเอกสารนี้)
- Diagram แบบ relational schema ใช้ตารางแนวนอนแถวเดียว ตาม format ที่อาจารย์สอน: PK = ขีดเส้นใต้ทึบ, FK = ขีดเส้นใต้ประ
- ต้องออกแบบถึง 3NF และมี M:N อย่างน้อย 2 คู่ที่แก้ด้วย bridge table
- **Business Rules ต้องเขียนทีละประโยค ระบุ cardinality สองฝั่งชัดเจน** ครอบคลุม 4 หมวด: Relationship (คาร์ดินาลิตี้, ขั้นต่ำ 5), Participation (บังคับ/ไม่บังคับ, ขั้นต่ำ 3), Attribute/constraint (ขั้นต่ำ 3), Specialisation/EER (ขั้นต่ำ 1)
- **ห้ามเขียน Business Rules ให้ดูเหมือนแปลงมาจาก ERD ตรงๆ** (TA เคยทักว่า BR ดูเหมือนวาด ER ก่อนแล้วมาคิด BR ทีหลัง) ต้องเขียนด้วยภาษาคน ไม่ใช้ template ประโยคเดียวซ้ำทุกข้อ ไม่ใส่ชื่อ entity แบบ PascalCase ตรงๆ ในประโยค (เช่น อย่าเขียน "One Category classifies Product" ให้เขียน "every product is filed under exactly one category" แทน)

## 4. โครงสร้างข้อมูล - 13 Entities (ล็อกแล้ว ห้ามเพิ่ม/ลด)

| Entity | Key attributes | หมายเหตุ |
|---|---|---|
| Customer | customer_id (PK), full_name, email, phone, password_hash, address, created_at | |
| Employee | employee_id (PK), full_name, email, password_hash, phone, role, hire_date, is_active | role คือ EER specialisation attribute (unassigned/staff/technician/admin) |
| Brand | brand_id (PK), brand_name, country_origin | |
| Category | category_id (PK), category_name, is_build_component, description | |
| Product | product_id (PK), product_name, category_id (FK), brand_id (FK), price, stock_quantity, spec_detail, image_url, warranty_months, is_active | |
| StockAdjustment | adjustment_id (PK), product_id (FK), employee_id (FK), quantity_changed, adjustment_type, note, adjusted_at | |
| SalesOrder | order_id (PK), customer_id (FK), order_date, status, total_amount, shipping_address | |
| OrderItem | order_id (FK,PK), product_id (FK,PK), quantity, unit_price | Weak entity, composite key |
| PCBuild | build_id (PK), customer_id (FK), assigned_technician_id (FK), build_name, build_date, status, total_price, shipping_address | status มีค่า draft/paid/assigned/assembling/completed/shipped/delivered/cancelled |
| BuildItem | build_id (FK,PK), product_id (FK,PK), quantity | Weak entity, composite key |
| BuildStatusHistory | history_id (PK), build_id (FK), employee_id (FK), status, updated_at, note | |
| Shipment | shipment_id (PK), build_id (FK), order_id (FK), employee_id (FK), courier_name, tracking_number, shipped_date, delivered_date, shipping_status | |
| Payment | payment_id (PK), order_id (FK), build_id (FK), amount, payment_date, payment_method, payment_status | |

## 5. ความสัมพันธ์ - 18 เส้น (ยืนยันถูกต้องแล้ว)

รูปแบบ: EntityA (ฝั่ง 1) - label - EntityB (ฝั่ง N) - participation ฝั่ง B

1. Category - classifies - Product (mandatory)
2. Brand - produces - Product (mandatory)
3. Customer - places - SalesOrder (mandatory)
4. Customer - requests - PCBuild (mandatory)
5. SalesOrder - contains - OrderItem (mandatory, weak entity, **ต้องมีอย่างน้อย 1 ชิ้นเสมอ = "one or many" ไม่ใช่ zero or many** เพราะ checkout สร้าง SalesOrder+OrderItem พร้อมกันเสมอ)
6. Product - appears in - OrderItem (mandatory)
7. PCBuild - composed of - BuildItem (mandatory, weak entity, **ก็ต้องมีอย่างน้อย 1 ชิ้นเสมอเช่นกัน = "one or many"** เพราะ `createDraftBuild()` มี guard clause ปฏิเสธถ้า items.length === 0)
8. Product - used in - BuildItem (mandatory)
9. Employee - assigned to - PCBuild (**optional** ทั้งสองฝั่ง เพราะ assigned_technician_id เป็น null ได้)
10. PCBuild - has - BuildStatusHistory (mandatory ฝั่ง BuildStatusHistory - **เคยเขียนผิดเป็น optional มาก่อน แก้แล้ว** เพราะ build_id ใน BuildStatusHistory เป็น NOT NULL)
11. Employee - updates - BuildStatusHistory (mandatory)
12. Product - has - StockAdjustment (mandatory)
13. Employee - performs - StockAdjustment (mandatory)
14. Employee - performs - Shipment (mandatory)
15. SalesOrder - has - Shipment / PCBuild - has - Shipment (**ปัจจุบันโค้ดจริงทำให้แต่ละ SalesOrder/PCBuild มี Shipment ได้แค่ 1 รายการเท่านั้น ไม่ใช่หลายรายการ** - แก้ไขแล้วในเอกสารล่าสุดเป็น "exactly one shipment")
16. SalesOrder - generates - Payment / PCBuild - generates - Payment (**เช่นเดียวกัน โค้ดจริงสร้าง Payment แค่ 1 รายการต่อออเดอร์เสมอ ไม่มีการแบ่งจ่ายหลายงวดจริง แม้ schema จะรองรับก็ตาม**)
17. Payment/Shipment มี FK สองเส้น (order_id, build_id) แบบ nullable แต่**ต้องมีค่าแค่เส้นเดียวเท่านั้น ห้ามมีทั้งคู่หรือไม่มีเลย** (exclusive-or/Category construct ในศัพท์ EER ของ Elmasri-Navathe ไม่ใช่ Specialisation - Specialisation คือ superclass เดียวแตกเป็น subclass ส่วน Category คือ subclass ที่มาจาก superclass ได้หลายตัวแต่เลือกได้แค่ตัวเดียว) กฎนี้บังคับที่ระดับโค้ดแอปพลิเคชัน ไม่ใช่ที่ schema เพราะ**เป็นจริงโดยธรรมชาติจากวิธีที่โค้ดสร้าง record (by construction) ไม่ได้มี guard clause ตรวจสอบแล้วปฏิเสธจริงๆ** (หมายเหตุ Crow's Foot: notation นี้ไม่มีสัญลักษณ์มาตรฐานสำหรับ exclusive-or แบบ Chen ตรงๆ ปกติแก้โดยวาดเส้นสองเส้นไปยัง SalesOrder และ PCBuild ตามปกติ แล้วเขียนหมายเหตุกำกับข้างๆ ว่า "exactly one of the two must be set" หรือใช้เส้นโค้งเล็กๆ เชื่อมสองเส้นเข้าด้วยกันเพื่อสื่อว่าเลือกได้ทางเดียว)

## 6. Business Rules ฉบับที่ส่งจริงแล้ว (23 ข้อ, ยืนยันจากไฟล์ที่ submit)

จัดเป็น 7 กลุ่มตามสถานการณ์ธุรกิจ ไม่ใช่ตามลำดับ entity ใน ERD: (1) ลูกค้าและการซื้อของ [ข้อ 1-6] (2) แคตตาล็อกสินค้า [7-8] (3) งานประกอบและติดตามความคืบหน้า [9-11] (4) การควบคุมสต็อก [12-13] (5) การจัดส่งและจ่ายเงิน [14-18] (6) บทบาทพนักงาน [19] (7) กฎคุณภาพข้อมูล [20-23]

หมวดรวม: Relationship 12 ข้อ, Participation 4 ข้อ, Specialisation 3 ข้อ, Attribute/constraint 4 ข้อ (รวม 23 ข้อ เกินขั้นต่ำทุกหมวดที่กำหนด 5/3/3/1)

**ข้อความจริงที่ส่งไป (อังกฤษ):**

1. A customer can place as many orders as they like, but each order only ever belongs to one customer. (Relationship)
2. In the same way, a customer can ask for more than one custom build, but each build request only belongs to one customer. (Relationship)
3. One order can have several products in it, and the same product can show up in lots of different orders. Since each order must contain at least one item, an order with nothing in it is not allowed to exist. (Relationship)
4. No matter which product is in an order, that line always points to just one product, not two at once. (Participation)
5. One build can use several parts, and the same part can be used in more than one build. A build cannot exist with zero parts in it, since a build request only gets created once the customer has picked at least one part. (Relationship)
6. Every part listed inside a build always points to just one product. (Participation)
7. Every product sits under just one category, even though a category can hold many products. (Relationship)
8. The same goes for brands: one brand can have lots of products, but each product only comes from one brand. (Relationship)
9. A build does not need a technician right away. It can sit with nobody working on it for a while, but once someone takes it, only that one person is in charge of it at a time. (Participation)
10. Every time a build's status changes, like from waiting to being worked on to finished, that gets written down, and each of those notes always belongs to just one build. (Relationship)
11. Each status note also says exactly one employee made it, though one employee can end up making a lot of these notes over time. (Relationship)
12. Stock never changes by itself. Every time it's adjusted, it has to say which product changed and which employee did it, so there's always a clear record of what happened and who did it. (Participation)
13. Over time, one product might get its stock adjusted many times, and one employee might be the one doing a lot of those adjustments. (Relationship)
14. Every delivery is handled by exactly one employee, the person who actually sent it out. (Relationship)
15. Each SalesOrder and each PCBuild has exactly one shipment. If a customer checks out a cart containing both individual items and a PCBuild, the checkout creates separate shipments for the SalesOrder and the PCBuild. (Relationship)
16. Each SalesOrder and each PCBuild has exactly one payment. If a customer checks out a cart containing both individual items and a PCBuild, the checkout creates separate payments for the SalesOrder and the PCBuild. (Relationship)
17. Each delivery only belongs to one thing: either one specific order or one specific build, never both at once, and never neither. (Specialisation)
18. Payments work the same way: each one always goes back to either one order or one build, never a mix of both, and never nothing at all. (Specialisation)
19. Every staff member has exactly one job type at a time. Some are still waiting to be given a role after signing up, some are regular staff, some are technicians, and some are admins, but nobody has two of these at once. (Specialisation)
20. Stock can never go below zero. The amount of a product on hand is always zero or more. (Attribute/constraint)
21. Once something is bought, the price on that receipt stays locked in at what it cost at that moment, not whatever it costs now. (Attribute/constraint)
22. Nobody's password, whether it belongs to a customer or an employee, is ever kept in a way that can be read directly. It is only kept in a scrambled form. (Attribute/constraint)
23. The date a build starts can never be set in the future. It has to be today or earlier. (Attribute/constraint)

**หมายเหตุสำคัญเรื่องการแก้ไขรอบสุดท้าย (เทียบกับฉบับก่อนหน้า):**

- **ข้อ 15, 16 เปลี่ยนไปมาก** จากเดิมที่เขียนว่า "อาจต้องจัดส่ง/จ่ายเงินมากกว่า 1 ครั้ง" (zero or many) แก้เป็น **"exactly one shipment/payment"** เพราะไล่โค้ดจริงแล้วพบว่า `checkoutCart()` สร้าง Shipment/Payment แค่ 1 รายการต่อ SalesOrder หรือ PCBuild เสมอ ไม่มี flow ไหนสร้างซ้ำ ข้อความจึงยอมใช้ชื่อ entity แบบ PascalCase ตรงๆ (SalesOrder, PCBuild) เพื่อความแม่นยำ แลกกับความเป็นธรรมชาติของประโยคเล็กน้อย
- **ตัดข้อ "enforcement note" ออกไปทั้งข้อ** (เดิมมีข้อที่บอกว่า "the checkout process has to check it directly... stops the save" ซึ่ง Claude Code เคยทักว่าคำแรงเกินจริง เพราะไม่มี guard clause จริงในโค้ด) ทีมเลือกตัดทิ้งแทนการแก้คำ ทำให้ยอดรวมข้อลดจาก 24 เหลือ 23
- Specialisation terminology: TA/Claude Code เคยเสนอว่าข้อ 17-18 ควรเรียกว่า **"Category (Union)"** ตามศัพท์ Elmasri-Navathe แทน "Specialisation" (Category คือ subclass ที่มาจาก superclass หลายตัวแต่เลือกได้ทางเดียว ส่วน Specialisation คือ superclass เดียวแตกเป็น subclass) **แต่ฉบับส่งจริงยังคงป้ายว่า "Specialisation" ตามเดิม** เพราะยังผ่านเกณฑ์ขั้นต่ำอยู่ดี (มีข้อ 19 เรื่อง role เป็น Specialisation แท้ๆ)

**ตัวอย่างที่ไม่ควรทำ (โดน TA ทักไปแล้วในฉบับร่างแรก อย่าเขียนแบบนี้อีก):**
> "One Category classifies zero or many Products. Every Product must belong to exactly one Category." (ดูเป็น ER-first, ใช้ template ซ้ำทุกข้อ, ไม่จัดกลุ่มตามธุรกิจ)

## 7. สถานะการพัฒนาจริง (สำคัญ อย่าเดาเอง ต้องเช็คกับ Claude Code เสมอ)

- ตอนนี้ยังไม่ได้ต่อ MySQL จริง ใช้ dev store (`src/data/store.ts`) เก็บข้อมูลในหน่วยความจำแทน
- เพราะ Node.js เป็น single-thread และโค้ดเช็ค-แล้วหักสต็อกไม่มี `await` คั่นกลาง ตอนนี้ปลอดภัยจาก race condition โดยธรรมชาติ **แต่พอย้ายไป MySQL จริงต้องเพิ่ม transaction + row lock (`SELECT ... FOR UPDATE`) เอง ไม่ได้มาฟรีๆ**
- Role ของพนักงานตอนสมัครใหม่เริ่มที่ `unassigned` ต้องรอ admin อนุมัติก่อนถึงเข้าเมนูงานได้
- **บทเรียนสำคัญ:** อย่าเดาความหมายของชื่อ status/field จากชื่อเฉยๆ (เคยเดาผิดว่า `draft` status ของ PCBuild แปลว่า "เลือกอะไหล่ยังไม่ครบ" ทั้งที่จริงคือ "เลือกครบแล้ว บันทึกแล้ว แค่ยังไม่จ่ายเงิน") **ต้องขอให้ Claude Code โชว์โค้ดจริงมายืนยันเสมอ ก่อนเขียนอะไรลงเอกสาร**

## 8. Tech Stack

| Layer | เลือกใช้ | เหตุผล |
|---|---|---|
| Database | MySQL 8 | ต้องการ ACID transaction ตัดสต็อกพร้อมสร้างออเดอร์ |
| Modelling tool | Draw.io | บังคับใช้ในวิชานี้ |
| Query/admin tool | MySQL Workbench หรือ phpMyAdmin (ผ่าน XAMPP) | ฟรี ใช้ง่าย |
| Backend | Node.js + TypeScript + Express.js | ทีมมีพื้นฐาน JS/HTML/CSS อยู่แล้ว |
| Frontend | EJS + Tailwind CSS + JavaScript ธรรมดา | server-render เข้ากับ MVC ที่สอน |
| Hosting | XAMPP (dev) / Render (demo) | free tier พอสำหรับโปรเจกต์วิชาเรียน |
| Version control | GitHub | มาตรฐานทำงานเป็นทีม |

## 9. Milestones ของวิชา (M1 เสร็จแล้ว)

| # | งาน | กำหนดส่ง | สถานะ |
|---|---|---|---|
| M1 | Proposal (Lab 6 + Lab 7) | Week 6 | ✅ ส่งแล้ว |
| M2 | EER diagram ฉบับสมบูรณ์ (Crow's Foot notation) | Week 7 | กำลังทำ (Suphapish รับผิดชอบ) |
| M3 | Relational schema (3NF) | Week 9 | ยังไม่เริ่ม |
| M4 | SQL implementation (DDL + sample data) | Week 11 | ยังไม่เริ่ม |
| M5 | Queries และรายงาน (≥10 query) | Week 13 | ยังไม่เริ่ม |
| M6 | นำเสนอผลงานสุดท้าย | Week 15 | ยังไม่เริ่ม |

## 10. รูปแบบการทำงานที่ต้องการจาก AI (สำคัญมาก)

- **ห้ามใช้เครื่องหมาย em dash (—) เด็ดขาดในทุกเอกสารทุกงาน** เพราะดูเป็น AI เขียนชัดเจน ให้ใช้จุด, คอมม่า, หรือวงเล็บแทน
- ใช้ภาษาอังกฤษคำง่ายๆ อ่านแล้วเข้าใจทันที ไม่ใช้ศัพท์ยากเกินจำเป็น
- ทำเอกสารสำคัญเป็น 2 ภาษา (ไทย + อังกฤษ) เสมอเมื่อขอ
- **ตรวจสอบให้จริงก่อนส่งงาน** เช่น เช็คจำนวน entity/relationship ด้วยสคริปต์เทียบกับของเดิม ไม่ใช่แค่เขียนแล้วส่งเลย ถ้าทำไดอะแกรม ให้ render เป็นภาพดูจริงก่อนส่ง ไม่ใช่แค่เขียน XML ส่ง
- ถ้าจะอ้างว่าโค้ดทำงานแบบไหน ต้องขอดูโค้ดจริงยืนยันก่อน ห้ามเดาจากชื่อ field/status เฉยๆ
- ตอบตรงไปตรงมา ไม่อวยเกินจริง ถ้ามีจุดอ่อนหรือความเสี่ยงต้องบอกตรงๆ

## 11. เหตุการณ์สำคัญที่เคยเกิดขึ้น (กันพลาดซ้ำ)

1. **พิตช์ครั้งแรกไม่ผ่าน** เพราะเอา ERD ฉบับสมบูรณ์ (มี attribute ครบ) ไปโชว์ตอน proposal ทั้งที่อาจารย์ต้องการแค่ร่างหยาบๆ (rough sketch) และทีมอธิบาย ERD ไม่ได้เมื่อถูกถาม → บทเรียน: ต้องเข้าใจของตัวเองลึกพอจะอธิบายได้ ไม่ใช่แค่มีไฟล์สวย
2. **TA ทักว่า Business Rules ดูเหมือนวาด ER ก่อนแล้วมาคิด BR ทีหลัง** เพราะเขียนด้วย template ประโยคเดียวกันซ้ำทุกข้อ และเรียงตามลำดับ entity ใน ERD → แก้ด้วยการเขียนภาษาคนธรรมชาติ จัดกลุ่มตามสถานการณ์ธุรกิจแทน
3. **เคยเขียน BR ผิดจากโค้ดจริงหลายจุด** (SalesOrder/PCBuild ต้องมีอย่างน้อย 1 item เสมอ ไม่ใช่ 0 ได้, Shipment/Payment ของ SalesOrder และ PCBuild มีได้แค่ 1 รายการเสมอไม่ใช่หลายรายการ, ไม่มี guard clause ตรวจ exclusive-or จริงในโค้ด) → บทเรียน: ต้องขอ Claude Code ยืนยันกับโค้ดจริงทุกครั้งก่อนเขียนอะไรที่อ้างพฤติกรรมของระบบ ฉบับสุดท้ายที่ส่งไปแก้ตามนี้ครบแล้วและตัดข้อที่พิสูจน์ไม่ได้จริงออกไปเลย (ยอมให้ข้อความยาวขึ้น/ใช้ชื่อ entity ตรงๆ บ้าง แลกกับความถูกต้อง)

---

**สรุปสั้นๆ สำหรับ AI ตัวใหม่:** ช่วย First (นักศึกษาปี 2 ทีม 3 คน) ทำโปรเจกต์ฐานข้อมูลร้านคอม "Shift-High PC" ต่อจาก M2 (EER diagram) ไปจนถึง M6 (นำเสนอ) ตาม milestone ข้างบน โดยใช้ entity/relationship/business rules ที่ล็อกไว้แล้วในเอกสารนี้เป็นฐาน ห้ามเปลี่ยนแปลงโดยไม่มีเหตุผลใหม่ที่ยืนยันจากโค้ดจริง
