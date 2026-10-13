# Shift-High PC

> "need pc trust shift-high pc"

เว็บแอปร้านคอมพิวเตอร์ - ขายสินค้าปกติ **+** ระบบจัดสเปคคอมพิวเตอร์ตามสั่ง (custom PC build) พร้อมติดตามสถานะงานประกอบและการจัดส่งแบบ real-time

เอกสารนี้เขียนไว้ให้คนที่**ไม่เคยเห็นโปรเจกต์นี้มาก่อน** อ่านแล้วรันเว็บขึ้นมาได้เอง และเข้าใจว่าแต่ละส่วนทำงานยังไง โดยไม่ต้องถามใครเพิ่ม

📄 สเปกโปรเจกต์แบบละเอียด (entity/ER diagram/business rules ทั้งหมด): [`docs/pc-shop-explainer.md`](./docs/pc-shop-explainer.md)
📄 ข้อมูลดิบของทุก entity (ไว้ใช้ตอบคำถามอาจารย์/ทำ ERD): [`docs/entity-data-export.md`](./docs/entity-data-export.md)
🎨 โลโก้ร้าน: [`public/images/logo.jpg`](./public/images/logo.jpg) - สีแบรนด์ (ส้ม-ดำ) กำหนดไว้ใน [`tailwind.config.js`](./tailwind.config.js) เป็นสี `brand-*`

---

## สารบัญ

1. [โปรเจกต์นี้คืออะไร](#โปรเจกต์นี้คืออะไร)
2. [สถานะตอนนี้](#สถานะตอนนี้)
3. [เริ่มรันเว็บ (Quick Start)](#เริ่มรันเว็บ-quick-start)
4. [บัญชีทดสอบ](#บัญชีทดสอบ)
5. [วิธีใช้งานแต่ละส่วน (ทีละ role)](#วิธีใช้งานแต่ละส่วน-ทีละ-role)
6. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
7. [13 Entity ในระบบ](#13-entity-ในระบบ)
8. [แนวคิด/pattern สำคัญที่ใช้ทั้งโปรเจกต์](#แนวคิดpattern-สำคัญที่ใช้ทั้งโปรเจกต์)
9. [ตัวแปรสภาพแวดล้อม (.env)](#ตัวแปรสภาพแวดล้อม-env)
10. [คำสั่ง npm ทั้งหมด](#คำสั่ง-npm-ทั้งหมด)
11. [แก้ปัญหาที่พบบ่อย](#แก้ปัญหาที่พบบ่อย)
12. [สิ่งที่เหลือ](#สิ่งที่เหลือ)

---

## โปรเจกต์นี้คืออะไร

ร้านขายคอมพิวเตอร์ออนไลน์ที่รองรับการซื้อ 2 แบบในระบบเดียว:

- **ซื้อสินค้าสำเร็จรูป** - เลือกสินค้าจากหน้าร้าน (48 ชิ้น ครบ 8 หมวดหมู่ 20 แบรนด์) ใส่ตะกร้า เช็คเอาต์ปกติ
- **จัดสเปคคอมเอง** - เลือกอะไหล่ทีละหมวด (CPU/เมนบอร์ด/การ์ดจอ/ฯลฯ) ระบบคำนวณราคารวมอัตโนมัติ แล้วมีทีมช่างรับงานไปประกอบจริง พร้อมหน้าติดตามสถานะแบบ timeline

ฝั่งหลังบ้านรองรับ 3 บทบาทพนักงาน (staff / technician / admin) ที่แบ่งสิทธิ์ตามหน้าที่จริง (ดูหัวข้อ [Separation of Duties](#role-พนักงาน) ด้านล่าง) ใช้ได้สองภาษา (ไทย/อังกฤษ) สลับได้ทุกหน้า

---

## สถานะตอนนี้

**ฟีเจอร์ทั้งหมดทำงานได้จริงแล้ว** ทั้ง auth, ซื้อของ, จัดสเปคคอม, checkout, งานช่าง, staff, admin - ทดสอบ end-to-end ผ่านทุก role แล้ว รวมถึงผ่านการทำ **responsive design ครบทุกขนาดจอ** (มือถือ/แท็บเล็ต/เดสก์ท็อป)

ข้อมูลทั้งหมดเก็บใน **MySQL 8** แล้ว (ฐานข้อมูล `pc_shop` 13 ตาราง ตาม Lab 7 proposal ฉบับแก้ไข) สร้างด้วยไฟล์ใน [`database/`](database/README.md)

> services ทุกไฟล์ query MySQL ผ่าน [`src/config/db.ts`](src/config/db.ts) ส่วน controllers/routes/views ไม่ได้เปลี่ยน งานที่แก้หลายตารางพร้อมกัน (checkout, ปรับสต็อก, เปลี่ยนสถานะงานประกอบ) ทำใน transaction เดียว (START TRANSACTION / COMMIT / ROLLBACK) และ checkout หักสต็อกด้วย `UPDATE ... WHERE stock_quantity >= ?` กันขายของชิ้นเดียวกันซ้ำ โค้ด SQL ทั้งหมดใช้เฉพาะคำสั่งที่เรียนใน Lecture 8–12

### เช็คลิสต์ฟีเจอร์

- [x] หน้า Products (48 สินค้าจริง 8 หมวดหมู่ - filter หมวดหมู่/แบรนด์/ราคา + ค้นหา + เรียงลำดับ + หน้ารายละเอียดพร้อมตารางสเปคเต็ม)
- [x] Auth ลูกค้า (register/login/logout) - JWT access+refresh จริง เก็บใน httpOnly cookie, silent refresh อัตโนมัติ
- [x] Auth พนักงาน (register/login/logout) - สมัครแล้ว role เริ่มต้นเป็น `unassigned` ใช้งานไม่ได้จนกว่า admin จะอนุมัติ
- [x] ตะกร้าสินค้า (เช็คสต็อกตอนเพิ่มของจริง ไม่ใช่แค่ตอนจ่ายเงิน) + จัดสเปคคอม (เลือกอะไหล่ทีละหมวด คำนวณราคารวมอัตโนมัติ)
- [x] Checkout - เลือกวิธีชำระเงิน (เก็บเงินปลายทาง/โอนเงิน), แยกบันทึก `SalesOrder` / `PCBuild` + `Payment`, ตรวจและหักสต็อกจริง, ตะกร้าผสม (สินค้า+จัดสเปคคอมพร้อมกัน) มีหน้าสรุปแยกให้ครบทุกอย่างที่สั่งซื้อ
- [x] ประวัติคำสั่งซื้อ + หน้าติดตามสถานะงานประกอบแบบ timeline
- [x] คิวงานช่าง - รับงาน + อัปเดตสถานะ (log ประวัติทุกครั้งที่เปลี่ยนสถานะ)
- [x] การจัดส่ง - แต่ละ `SalesOrder`/`PCBuild` มี `Shipment` เป็นของตัวเอง 1 รายการเสมอ (ของ `PCBuild` ระบบสร้างให้อัตโนมัติตอนสถานะงานเปลี่ยนเป็น shipped/delivered)
- [x] Staff/Admin ร่วม: จัดการคำสั่งซื้อรายใบ, ปรับสต็อก, อัปเดตคิวจัดส่ง, ดูรายงานยอดขาย + สินค้าขายดี
- [x] Admin เท่านั้น: เพิ่ม/แก้ไขสินค้า (ตรวจราคา/สต็อกไม่ให้ติดลบ), อนุมัติ/เปลี่ยน role/ปิดบัญชีพนักงาน
- [x] รองรับมือถือ/แท็บเล็ตเต็มรูปแบบ: เมนูแฮมเบอร์เกอร์, ตัวกรองสินค้าพับเก็บได้, ตารางจัดการคำสั่งซื้อไม่ล้นจอ
- [x] สลับภาษาไทย/อังกฤษได้ทุกหน้า (ตกหล่นตรงไหน fallback กลับเป็นไทยอัตโนมัติ ไม่มีข้อความว่างเปล่า)
- [ ] ข้อมูลติดต่อร้านใน footer เป็น placeholder ไว้ก่อน (ยังไม่มีเบอร์/LINE/อีเมลจริงของร้าน)

---

## เริ่มรันเว็บ (Quick Start)

### เตรียมเครื่อง (ทำครั้งเดียว)

1. ติดตั้ง **Node.js** เวอร์ชัน LTS ล่าสุด - https://nodejs.org
2. ติดตั้ง **MySQL Community Server 8** + **MySQL Workbench** แล้วรัน `database/schema.sql` ตามด้วย `database/seed.sql` (ทีละขั้นอยู่ใน [`database/README.md`](database/README.md))

### รันเว็บ

```bash
npm install
```

```bash
cp .env.example .env
```

แล้วเปิดไฟล์ `.env` ใส่รหัสผ่าน MySQL ของ root ที่ `DB_PASSWORD=`

```bash
npm run dev
```

แล้วเปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

`npm run dev` รัน 2 อย่างพร้อมกัน:

- **เซิร์ฟเวอร์** (`ts-node-dev`) - auto-restart ทุกครั้งที่แก้โค้ด `.ts`
- **Tailwind watcher** - คอย build CSS ใหม่ทุกครั้งที่แก้ class ใน `.ejs`/`.css`

ตอนเปิดเซิร์ฟเวอร์ ระบบจะเช็คว่าต่อ MySQL ได้และมีตารางครบ ถ้าไม่ผ่านจะบอกสาเหตุแล้วปิดตัว (เช่น MySQL ไม่ได้เปิด, รหัสผ่านใน `.env` ผิด, ยังไม่ได้รัน schema.sql)

---

## บัญชีทดสอบ

มีให้พร้อมใช้ทุก role หลังรัน `database/seed.sql` (ดูต้นฉบับที่ [`database/README.md`](database/README.md)):

| Role | อีเมล | รหัสผ่าน | ล็อกอินที่ |
|---|---|---|---|
| ลูกค้า (customer) | `customer@example.com` | `customer1234` | `/auth/login` |
| พนักงานขาย (staff) | `staff@shift-high-pc.example` | `staff1234` | `/staff/auth/login` |
| ช่างเทคนิค (technician) | `technician@shift-high-pc.example` | `tech1234` | `/staff/auth/login` |
| ผู้ดูแลระบบ (admin) | `admin@shift-high-pc.example` | `admin1234` | `/staff/auth/login` |

⚠️ ใช้เพื่อทดสอบระหว่างพัฒนาเท่านั้น **ต้องลบ/เปลี่ยนก่อนขึ้นใช้งานจริง**

ต้องการล้างข้อมูลกลับไปเป็นค่าเริ่มต้น (เช่น ลบคำสั่งซื้อทดสอบที่สร้างไว้เยอะ): รัน `DROP DATABASE pc_shop;` ใน Workbench แล้วรัน `database/schema.sql` และ `database/seed.sql` ใหม่

---

## วิธีใช้งานแต่ละส่วน (ทีละ role)

### ฝั่งลูกค้า (ไม่ต้องล็อกอินก็ดูสินค้าได้ ต้องล็อกอินตอนจะซื้อ)

| ทำอะไร | ไปที่ |
|---|---|
| ดูสินค้าทั้งหมด / กรอง / ค้นหา | `/products` |
| ดูรายละเอียดสินค้า (ตารางสเปคเต็ม + จุดเด่น) | `/products/:id` |
| สมัครสมาชิก / ล็อกอิน | `/auth/register`, `/auth/login` |
| จัดสเปคคอมเอง (เลือกอะไหล่ทีละหมวด) | `/build` |
| ดูตะกร้า / แก้จำนวน / ลบ | `/cart` |
| เช็คเอาต์ (เลือกที่อยู่ + วิธีชำระเงิน) | `/checkout` |
| ดูประวัติคำสั่งซื้อทั้งหมด | `/orders` |
| ดูใบยืนยัน + ติดตามสถานะงานประกอบ | `/orders/:id`, `/build/:id/status` |
| จัดการโปรไฟล์ / เปลี่ยนรหัสผ่าน | `/account` |

**ลองเดโมเต็ม flow**: ล็อกอินด้วยบัญชีลูกค้าทดสอบ → `/build` เลือกอะไหล่จนครบ → กด "ใส่ตะกร้า" → `/cart` → `/checkout` เลือกวิธีชำระเงิน → ยืนยัน → จะเด้งไปหน้ายืนยันออเดอร์ที่มี timeline สถานะให้ดู (ถ้าตะกร้ามีทั้งสินค้าปกติและจัดสเปคคอมพร้อมกัน จะเจอหน้าสรุปกลางที่ลิงก์ไปทุกอย่างที่เพิ่งสั่งซื้อแทน)

### ฝั่งพนักงาน (สมัครเองได้ แต่ role เริ่มต้นเป็น `unassigned` ใช้งานไม่ได้จนกว่า admin จะอนุมัติ)

สมัครที่ `/staff/auth/register` แล้วรออนุมัติ หรือใช้บัญชีทดสอบด้านบนเพื่อข้ามขั้นตอนนี้ไปเลย

| Role | ทำอะไรได้ | ไปที่ |
|---|---|---|
| **technician** | ดูคิวงานจัดสเปคที่รอประกอบ, รับงาน, อัปเดตสถานะ (assigned → assembling → completed) | `/technician/queue`, `/technician/builds/:id` |
| **staff** | จัดการคำสั่งซื้อ+งานจัดสเปคทุกใบ (อัปเดตสถานะ/จัดส่ง), ปรับสต็อกสินค้า, ดูรายงานยอดขาย | `/staff/orders`, `/staff/stock`, `/staff/reports` |
| **admin** | ทำได้ทุกอย่างที่ staff ทำได้ **บวก** เพิ่ม/แก้ไขสินค้า และจัดการบัญชีพนักงาน (อนุมัติ/เปลี่ยน role/ปิดบัญชี) | `/admin/products`, `/admin/employees` |

<a id="role-พนักงาน"></a>
**หลักการแบ่งสิทธิ์ (Separation of Duties)**: `staff` ทำงานขาย/สต็อก/จัดส่ง/รายงานได้เหมือน `admin` ทุกอย่าง **ยกเว้น** เรื่องบัญชีพนักงาน - อนุมัติพนักงานใหม่ / เปลี่ยน role คนอื่น / ปิดบัญชี ทำได้เฉพาะ `admin` เท่านั้น (ทดสอบแล้วว่า staff เข้า `/admin/*` ไม่ได้ → ขึ้นหน้า 403) ดูโค้ดจริงที่ [`src/middleware/roleGuard.ts`](src/middleware/roleGuard.ts) ซึ่งรับ role ที่อนุญาตเป็น array เช่น `roleGuard(['staff', 'admin'])`

**ลองเดโมเต็ม flow ฝั่งพนักงาน**: ล็อกอิน admin → `/admin/employees` อนุมัติพนักงานใหม่ (ถ้ามีคนสมัครเข้ามา) → ล็อกอิน technician → `/technician/queue` รับงานที่ลูกค้าจัดสเปคไว้ → อัปเดตสถานะจนถึง completed → ล็อกอิน staff → `/staff/orders` อัปเดตสถานะจัดส่งต่อ (จะเห็น `Shipment` ถูกสร้างให้อัตโนมัติตอนกดสถานะเป็น shipped)

---

## โครงสร้างโปรเจกต์

```
pc_shop/
├─ src/
│  ├─ app.ts / server.ts     # ประกอบ Express app (routes/middleware/view engine) + จุดเริ่มโปรแกรม
│  ├─ config/
│  │  ├─ db.ts                # MySQL connection pool + query/execute/withTransaction
│  │  └─ env.ts                # อ่าน + validate ตัวแปรจาก .env
│  ├─ data/
│  │  ├─ lookups.ts            # cache ชื่อหมวดหมู่/แบรนด์ ให้ view เรียกใช้ได้ทุกหน้า
│  │  └─ cartStore.ts          # ตะกร้าสินค้าชั่วคราว (ไม่ใช่ entity) เก็บในหน่วยความจำ ว่างเมื่อเซิร์ฟเวอร์รีสตาร์ท
│  ├─ models/                  # TypeScript interface ของทั้ง 13 entity พร้อม comment อธิบายทุก field (ดูหัวข้อถัดไป)
│  ├─ services/                # โลจิกจริงทั้งหมด (query MySQL ผ่าน config/db.ts) - อ่าน/เขียนข้อมูล, ตรวจกฎธุรกิจ
│  ├─ controllers/             # รับ request → เรียก service → render view (ไม่มีโลจิกธุรกิจในนี้)
│  ├─ routes/                  # ผูก URL path เข้ากับ controller + guard แต่ละตัว
│  ├─ middleware/               # currentUser (ถอด JWT), authGuard/roleGuard/customerAuthGuard, i18n, errorHandler
│  ├─ views/                    # EJS templates (34 ไฟล์ ทุกไฟล์มี comment บอกว่าเป็นหน้าอะไร)
│  │  ├─ layouts/main.ejs       # โครงหน้าเดียวที่ทุกหน้าใช้ร่วมกัน (header/footer/นำทาง)
│  │  ├─ partials/               # ส่วนย่อยที่ include ซ้ำได้ (header, footer, nav แต่ละ role, การ์ดสินค้า, ฯลฯ)
│  │  └─ <feature>/              # หน้าแยกตามฟีเจอร์ (products, cart, checkout, orders, build, admin, staff, technician, ...)
│  ├─ i18n/translations.ts      # Dictionary คำแปล ไทย→อังกฤษ (390+ รายการ) ใช้กับฟังก์ชัน t() ในทุกหน้า
│  ├─ types/                     # JWT payload types + augment Express.Request (req.customer / req.employee)
│  └─ utils/                     # password.ts (hash/compare), validate.ts (ValidationError + guard กฎธุรกิจ), jwt.ts, cookies.ts, productSpec.ts (parse ตารางสเปค)
├─ public/
│  ├─ css/tailwind.css          # ไฟล์ CSS ที่ build แล้ว (ห้ามแก้มือ แก้ที่ src/styles/tailwind.css แทน)
│  ├─ js/                        # JS เท่าที่จำเป็นจริงๆ (error-focus.js, phone-input.js เท่านั้น - ไม่มี JS framework)
│  └─ images/logo.jpg
├─ src/styles/tailwind.css       # ต้นฉบับ Tailwind (@layer components สำหรับ class ที่ใช้ซ้ำ เช่น .card, .btn)
├─ database/
│  ├─ schema.sql                 # สร้างฐานข้อมูล + 13 ตาราง + PK/FK/CHECK
│  ├─ seed.sql                   # ข้อมูลตั้งต้น + บัญชีทดสอบ + ออเดอร์ตัวอย่าง
│  ├─ pc_shop_full.sql           # schema + seed + query 14 ข้อ รวมไฟล์เดียว
│  ├─ queries.sql                # query 14 ข้ออย่างเดียว รันซ้ำได้ ข้อมูลไม่หาย
│  └─ README.md                  # วิธีติดตั้งฐานข้อมูลทีละขั้น
├─ scripts/itest.ts              # ทดสอบชั้นฐานข้อมูลอัตโนมัติ (npm run test:db)
├─ docs/
│  ├─ pc-shop-explainer.md       # สเปกโปรเจกต์แบบเต็ม (feature/entity/ER diagram/business rules)
│  └─ entity-data-export.md      # ข้อมูลดิบทุก entity/field แบบละเอียด (สำหรับตอบคำถามอาจารย์/ทำ ERD)
├─ tailwind.config.js / postcss.config.js
├─ tsconfig.json
└─ .env.example                   # copy เป็น .env ก่อนรัน
```

**เส้นทางของ 1 request** (เช่นกด "เพิ่มลงตะกร้า"): `routes/cartRoutes.ts` รับ path → ผ่าน middleware guard ตรวจสิทธิ์ → เข้า `controllers/cartController.ts` (อ่าน `req.body`) → เรียก `services/cartService.ts` (เช็คสต็อก/กฎธุรกิจ แล้วอ่าน-เขียน MySQL ผ่าน `config/db.ts`) → controller เลือกว่าจะ `render` view ไหนกลับไป

---

## 13 Entity ในระบบ

| Entity | คืออะไร | ไฟล์ |
|---|---|---|
| Customer | ลูกค้า | [`models/Customer.ts`](src/models/Customer.ts) |
| Employee | พนักงานทุกบทบาท (แยกด้วย `role`) | [`models/Employee.ts`](src/models/Employee.ts) |
| Brand | แบรนด์สินค้า | [`models/Brand.ts`](src/models/Brand.ts) |
| Category | หมวดหมู่สินค้า | [`models/Category.ts`](src/models/Category.ts) |
| Product | สินค้า/อะไหล่ | [`models/Product.ts`](src/models/Product.ts) |
| StockAdjustment | ประวัติปรับสต็อกด้วยมือ | [`models/StockAdjustment.ts`](src/models/StockAdjustment.ts) |
| SalesOrder | คำสั่งซื้อสินค้าปกติ | [`models/SalesOrder.ts`](src/models/SalesOrder.ts) |
| OrderItem | รายการสินค้าในออเดอร์ (associative entity) | [`models/OrderItem.ts`](src/models/OrderItem.ts) |
| PCBuild | งานจัดสเปคคอม | [`models/PCBuild.ts`](src/models/PCBuild.ts) |
| BuildItem | รายการอะไหล่ในชุดจัดสเปค (associative entity) | [`models/BuildItem.ts`](src/models/BuildItem.ts) |
| BuildStatusHistory | ประวัติเปลี่ยนสถานะงานจัดสเปค | [`models/BuildStatusHistory.ts`](src/models/BuildStatusHistory.ts) |
| Shipment | ข้อมูลการจัดส่ง (ใช้ร่วมกับทั้ง SalesOrder/PCBuild) | [`models/Shipment.ts`](src/models/Shipment.ts) |
| Payment | การชำระเงิน (ใช้ร่วมกับทั้ง SalesOrder/PCBuild) | [`models/Payment.ts`](src/models/Payment.ts) |

ทุกไฟล์ใน `src/models/` มี comment อธิบาย field ทุกตัว (ความหมาย, FK ชี้ไปไหน, ค่าที่เป็นไปได้) เปิดอ่านไฟล์ไหนก็เข้าใจได้เลยโดยไม่ต้องดูเอกสารแยก

---

## แนวคิด/pattern สำคัญที่ใช้ทั้งโปรเจกต์

อ่านส่วนนี้ก่อนแก้โค้ด จะช่วยให้เขียนสไตล์เดียวกับของเดิมทั้งหมด:

- **MySQL ผ่าน `config/db.ts`** ([`src/config/db.ts`](src/config/db.ts)): ใช้ `query()` / `queryOne()` สำหรับ SELECT, `execute()` สำหรับ INSERT/UPDATE/DELETE, และ `withTransaction()` เมื่อต้องแก้หลายตารางพร้อมกัน ทุก query ใช้ `?` แทนการต่อ string กัน SQL injection มีแค่ services ที่ query ฐานข้อมูล (controllers ไม่แตะ SQL)
- **`ValidationError`** ([`src/utils/validate.ts`](src/utils/validate.ts)): `class ValidationError extends Error { field: string }` - throw ตัวนี้เมื่อฟอร์มไม่ผ่านการตรวจ (เช่นราคาติดลบ) controller จะจับแล้วส่ง `errorField` ไปที่ view เพื่อ highlight ช่องที่ผิดสีแดง (ผ่าน class `.input-error`) พร้อม auto-focus ไปช่องนั้นด้วย [`public/js/error-focus.js`](public/js/error-focus.js)
- **`assertExactlyOneLink()`** ([`src/utils/validate.ts`](src/utils/validate.ts)): `Payment` และ `Shipment` ผูกกับ `SalesOrder` **หรือ** `PCBuild` ได้อย่างใดอย่างหนึ่งเท่านั้น (exclusive-or) - ฟังก์ชันนี้เช็คก่อน insert ทุกครั้งจริงๆ (ไม่ใช่แค่เขียนโค้ดให้ถูกเฉยๆ) ถ้ามีทั้งคู่หรือไม่มีเลยจะ throw ทันที เรียกใช้จาก `cartService.ts` (ตอนสร้าง Payment) และ `shipmentService.ts` (ตอนสร้าง Shipment)
- **`t()` + dictionary** ([`src/i18n/translations.ts`](src/i18n/translations.ts)): ทุกข้อความในหน้าเว็บห่อด้วย `t('ข้อความไทย')` - ถ้าอยู่โหมดอังกฤษจะไปหาคำแปลใน dictionary (key คือข้อความไทยตัวเป๊ะๆ) ถ้าหาไม่เจอจะ fallback กลับมาเป็นไทยอัตโนมัติ (ไม่มีทางเจอข้อความว่างเปล่า) **ข้อควรระวัง**: key ในดิกชันนารีต้อง match ข้อความไทยแบบตัวต่อตัว (เว้นวรรค/คำผิดนิดเดียวก็ไม่ตรง) รวมถึง attribute อย่าง `placeholder=` ก็ต้องห่อ `t()` ด้วย ไม่ใช่แค่ข้อความที่โชว์บนจอ
- **`statusLabel()` / `statusColor()` / `categoryName()` / `brandName()`** (ผูกไว้ที่ `app.locals` ใน [`src/app.ts`](src/app.ts)): map ค่า enum ภาษาอังกฤษ (เช่น `pending`, `shipped`) หรือ id เป็นข้อความไทยพร้อมสี badge ใช้ได้ทุกหน้าโดยไม่ต้องส่งจาก controller
- **`parseSpecDetail()`** ([`src/utils/productSpec.ts`](src/utils/productSpec.ts)): แปลง `Product.spec_detail` (ข้อความ "หัวข้อ: ค่า" ทีละบรรทัด) ให้เป็นตารางสเปคในหน้ารายละเอียดสินค้า - เพิ่ม/แก้สินค้าใหม่แค่พิมพ์ตามฟอร์แมตนี้ในช่อง "รายละเอียดสเปค" ของหน้า admin
- **ไม่ใช้ JS framework**: ของที่ต้องเปิด/ปิด (accordion, dropdown, เมนูมือถือ, ตัวกรองสินค้าบนจอเล็ก) ใช้ `<details>/<summary>` ของ HTML ล้วนๆ ไม่พึ่ง JavaScript เพิ่ม ยกเว้นตอนต้องซิงค์ตาม breakpoint ของหน้าจอ (เช่นเปิดค้างไว้เสมอบนจอใหญ่) ซึ่งใช้ `window.matchMedia()` แทนการเช็ค `window.innerWidth` ครั้งเดียว (จะพังตอนหมุนจอ/ปรับขนาดหน้าต่างโดยไม่ reload)
- **Responsive**: ทุกหน้าออกแบบ mobile-first ด้วย Tailwind breakpoint (`sm:`/`lg:`) ทดสอบแล้วที่ 375px (มือถือ), 768px (แท็บเล็ต), 1024px+ (เดสก์ท็อป)

---

## ตัวแปรสภาพแวดล้อม (.env)

คัดลอกจาก `.env.example` แล้วใส่รหัสผ่าน MySQL ของเครื่องตัวเอง:

| ตัวแปร | ใช้ทำอะไร | ค่าเริ่มต้น |
|---|---|---|
| `PORT` | พอร์ตที่เซิร์ฟเวอร์รัน | `3000` |
| `NODE_ENV` | โหมดรัน | `development` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ค่าเชื่อมต่อ MySQL (ต้องใส่ `DB_PASSWORD` ให้ตรงกับรหัส root ของเครื่อง) | `localhost` / `3306` / `root` / ว่าง / `pc_shop` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | secret สำหรับเซ็น JWT - **ต้องเปลี่ยนก่อนขึ้นจริง** | `change-me-*-secret` |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | อายุ token | `15m` / `7d` |

---

## คำสั่ง npm ทั้งหมด

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | รันเซิร์ฟเวอร์ + Tailwind watcher พร้อมกัน (ใช้ตอนพัฒนา) |
| `npm run dev:server` | รันแค่เซิร์ฟเวอร์ (ts-node-dev, auto-restart) |
| `npm run watch:css` | รันแค่ Tailwind watch mode |
| `npm run build` | build CSS (minify) + compile TypeScript เป็น `dist/` สำหรับ production |
| `npm start` | รันเวอร์ชันที่ build แล้ว (`node dist/server.js`) - ต้อง `npm run build` ก่อน |
| `npm run test:db` | ทดสอบชั้นฐานข้อมูลอัตโนมัติ (เขียนข้อมูลทดสอบลง DB รันเสร็จให้รัน schema.sql + seed.sql ใหม่) |

---

## แก้ปัญหาที่พบบ่อย

- **พอร์ต 3000 ถูกใช้อยู่แล้ว**: แก้ `PORT` ใน `.env` เป็นเลขอื่น เช่น `3001`
- **หน้าเว็บไม่มี style / Tailwind class ไม่ทำงาน**: เช็คว่า terminal ที่รัน `npm run dev` ยังเปิดอยู่และไม่มี error สีแดงจาก Tailwind watcher (ถ้าปิด terminal ไปแล้ว css เก่าจะค้างอยู่ที่ `public/css/tailwind.css` ไม่อัปเดต)
- **แก้โค้ดแล้วเว็บไม่เปลี่ยน**: `.ts`/`.ejs`/`.css` ทุกไฟล์ทำให้ ts-node-dev auto-restart เองอยู่แล้ว ถ้ายังไม่เปลี่ยนลอง hard refresh เบราว์เซอร์ (Ctrl+Shift+R) ก่อนสงสัยว่าโค้ดพัง
- **ล็อกอินแล้วเด้งกลับหน้าล็อกอินทันที / ค้างเป็น role `unassigned`**: บัญชีพนักงานใหม่ต้องรอ `admin` อนุมัติที่ `/admin/employees` ก่อนถึงจะเข้าใช้งานได้ (ตั้งใจให้เป็นแบบนี้ ไม่ใช่บั๊ก)
- **อยากเริ่มข้อมูลใหม่หมด (ลบคำสั่งซื้อ/ผู้ใช้ทดสอบที่สร้างไว้)**: รัน `DROP DATABASE pc_shop;` ใน Workbench แล้วรัน `database/schema.sql` และ `database/seed.sql` ใหม่
- **เปิดเซิร์ฟเวอร์แล้วขึ้น "เชื่อมต่อฐานข้อมูลไม่สำเร็จ"**: เช็คว่า MySQL เปิดอยู่ (Workbench ต่อได้), `DB_PASSWORD` ใน `.env` ถูกต้อง, และรัน `schema.sql` แล้ว
- **ขึ้น `ER_NOT_SUPPORTED_AUTH_MODE` หรือ `Access denied`**: รหัสผ่านใน `.env` ไม่ตรงกับ root ของ MySQL
- **เพิ่มข้อความใหม่แล้วภาษาอังกฤษไม่ขึ้น**: ต้องเพิ่ม key ใน [`src/i18n/translations.ts`](src/i18n/translations.ts) ให้ **ตรงตัวเป๊ะ** กับข้อความไทยที่ใช้ใน view (คนละตัวอักษรเดียวก็ถือว่าไม่ match แล้ว fallback เป็นไทย) - อย่าลืมเช็ค attribute เช่น `placeholder=` ด้วย ไม่ใช่แค่ข้อความที่โชว์บนจอ

---

## สิ่งที่เหลือ

- [x] **ต่อ MySQL จริง**: `database/schema.sql` + `seed.sql` และ services ทุกไฟล์ query MySQL แล้ว
- [ ] ใส่ข้อมูลติดต่อร้านจริงใน footer (เบอร์/LINE/อีเมล) แทน placeholder ปัจจุบัน
- [ ] (ไม่บังคับ) รูปสินค้าจริง - ทั้ง 48 ชิ้นยังใช้ไอคอน placeholder ตามหมวดหมู่แทนรูปถ่ายจริง
- [ ] (ไม่บังคับ) ระบบลืมรหัสผ่าน (forgot password) - ยังไม่เคยถูกร้องขอให้ทำ ไม่ใช่ requirement
