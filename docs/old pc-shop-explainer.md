# เอกสารอธิบายโปรเจกต์: PC Shop (ระบบร้านคอมพิวเตอร์)

## 1. โปรเจกต์นี้คืออะไร ทำอะไร

โปรเจกต์นี้คือ **เว็บแอปพลิเคชันสำหรับร้านขายอุปกรณ์คอมพิวเตอร์** ที่แก้ปัญหาทั้งฝั่งลูกค้าและฝั่งร้านไปพร้อมกัน

**ฝั่งลูกค้า:** เวลาลูกค้าอยากซื้ออุปกรณ์คอมหรือประกอบคอมสักเครื่อง มักต้องเดินทางไปที่ร้านเท่านั้น เพราะไม่มีทางรู้ล่วงหน้าเลยว่าร้านมีสินค้าอะไรบ้าง เหลือของไหม หรือราคาเท่าไหร่ ยิ่งถ้าอยากประกอบคอมเอง ปัญหาจะซับซ้อนขึ้นไปอีก เพราะลูกค้าต้องจำเองว่าเลือกอะไหล่ครบทุกชิ้นหรือยัง (CPU, เมนบอร์ด, การ์ดจอ, แรม ฯลฯ) และคาดเดาราคารวมทั้งชุดไม่ได้จนกว่าจะยืนคุยกับพนักงานที่หน้าร้าน

**ฝั่งร้าน:** เมื่อรับทั้งงานขายของหน้าร้านและงานประกอบคอมพร้อมกัน พนักงานมักไม่มีระบบกลางที่บอกได้ว่าอะไหล่ชิ้นไหนถูกจองไว้ให้ลูกค้าที่กำลังรอประกอบอยู่แล้ว จึงเกิดเหตุการณ์ขายอะไหล่ชิ้นเดียวกันซ้ำให้ลูกค้าอีกคนหนึ่งโดยไม่ตั้งใจ ทำให้ต้องขอโทษลูกค้าและเสียเวลาแก้ปัญหาทีหลัง การไม่มีช่องทางขายออนไลน์ยังทำให้ร้านพลาดโอกาสขายจากลูกค้าที่ไม่สะดวกเดินทางมาที่ร้านด้วย

เว็บนี้จึงออกแบบให้รองรับทั้งสองรูปแบบการซื้อในระบบเดียวกัน พร้อมติดตามสถานะได้ตั้งแต่ลูกค้าจ่ายเงินจนถึงของไปส่งถึงมือ เปิดช่องทางขายออนไลน์เพิ่มให้ร้าน และลดปัญหาอะไหล่ถูกขายซ้ำจากการไม่สื่อสารกันของพนักงาน

## 2. ในเว็บทำอะไรได้บ้าง (Feature ทั้งหมด)

### ฝั่งลูกค้า

| ฟีเจอร์ | อธิบาย |
|---|---|
| ดูรายการ + รายละเอียดสินค้า | ดูสินค้าทั้งหมดแยกตามหมวดหมู่ และดูหน้ารายละเอียดสินค้าทีละชิ้น (**ดูได้โดยไม่ต้อง login**) |
| สมัครสมาชิก/ล็อกอิน (บังคับ) | ต้อง login ก่อนถึงจะ add to cart, จัดสเปคคอม, หรือ checkout ได้ ทุกฟีเจอร์ที่เกี่ยวกับการซื้อบังคับ login ทั้งหมด |
| เลือกซื้อสินค้าปกติ | หยิบใส่ตะกร้า แล้วชำระเงิน |
| จัดสเปคคอม (จุดเด่นของระบบ) | เลือกอะไหล่ทีละหมวด (CPU → เมนบอร์ด → การ์ดจอ → แรม → ...) ประกอบเป็นสเปคเครื่องของตัวเอง ใส่ลงตะกร้าเป็น "ชุด" ได้เหมือนสินค้าปกติ แล้ว checkout ผ่านระบบเดียวกัน |
| ติดตามสถานะงานประกอบ | ดูได้ว่างานอยู่ขั้นไหน (รอช่างรับงาน → กำลังประกอบ → ประกอบเสร็จ → กำลังจัดส่ง → ถึงแล้ว) |
| ดูประวัติคำสั่งซื้อทั้งหมด | เพราะทุกคนมี account อยู่แล้ว (บังคับ login) จึงดูประวัติคำสั่งซื้อ/งานจัดสเปคทั้งหมดของตัวเองย้อนหลังได้เสมอ |
| ข้อมูลติดต่อร้าน | แสดงเบอร์โทร, LINE ID, อีเมลของร้าน (เช่นในส่วน footer) ให้ลูกค้าติดต่อสอบถามได้นอกเว็บ (ไม่มีระบบเก็บประวัติการสนทนาในเว็บ) |

### ฝั่งพนักงาน (สมัครเองได้ แต่ใช้งานได้ต่อเมื่อ admin อนุมัติ role แล้วเท่านั้น)

แบ่ง role ตามหลัก **Separation of Duties** คือไม่ให้ role เดียวมีอำนาจทำทุกอย่าง โดยเฉพาะอำนาจที่กระทบความปลอดภัยของระบบเอง (อนุมัติ/เปลี่ยน role คนอื่น) จำกัดไว้เฉพาะ admin เท่านั้น

| บทบาท | ทำอะไรได้ |
|---|---|
| รอตรวจสอบ (`unassigned`) | สถานะเริ่มต้นหลังสมัคร ล็อกอินเข้าระบบได้ แต่เข้าเมนูงานใดๆ ไม่ได้จนกว่า admin จะอนุมัติ |
| พนักงานทั่วไป (`staff`) | ปรับสต็อกสินค้า, อัปเดตสถานะจัดส่ง, ดูรายงานยอดขาย, ดู/จัดการรายการคำสั่งซื้อแต่ละใบ (**ทำเรื่องบัญชีพนักงานคนอื่นไม่ได้**) |
| ช่าง (`technician`) | เห็นคิวงานจัดสเปคที่จ่ายเงินแล้ว เปิดดูรายละเอียดอะไหล่ รับงานไปประกอบ อัปเดตสถานะ |
| แอดมิน (`admin`) | ทำได้ทุกอย่างของ `staff` บวก: อนุมัติ/ปฏิเสธพนักงานที่สมัครใหม่, เปลี่ยน role ใครก็ได้, ปิดการใช้งานบัญชี, เพิ่ม/แก้/ลบสินค้า-หมวดหมู่-แบรนด์ |

**เหตุผลที่ให้พนักงานสมัครเองได้:** ถ้าร้านมีช่างหรือพนักงานเยอะ การให้ admin ต้องพิมพ์ข้อมูล (ชื่อ, อีเมล, ตั้งรหัสผ่าน) แทนทุกคนจะไม่สะดวก จึงเปิดให้สมัครเองเหมือนลูกค้า แต่ role เริ่มต้นเป็น `unassigned` เข้าเมนูงานใดๆ ไม่ได้ จนกว่า admin จะเข้ามาอนุมัติและกำหนด role ให้

**เหตุผลที่แยก `staff` ออกจาก `admin`:** ถ้าบัญชี staff คนไหนถูกแฮ็กหรือพนักงานไม่ซื่อสัตย์ อย่างน้อยเขาก็เปลี่ยน role ตัวเองเป็น admin เองไม่ได้ หรือสร้างบัญชีปลอมแล้วอนุมัติตัวเองไม่ได้ ต้องผ่าน admin จริงเท่านั้น ช่วยลดความเสี่ยงด้านความปลอดภัยของระบบ

## 3. เขียนเว็บนี้จากอะไร (Tech Stack)

| ส่วน | เทคโนโลยีที่ใช้ | เหตุผล |
|---|---|---|
| Backend | **Node.js + Express.js** เขียนด้วย **TypeScript** | Express คือ framework จัดการ route/request-response บน Node ส่วน TypeScript ช่วยให้เขียนแล้วรู้ error ตั้งแต่ตอนเขียนโค้ด |
| Frontend/View | **EJS** + **Tailwind CSS** + **JavaScript ธรรมดา** (`fetch()`) | render HTML แบบ dynamic ฝั่ง server ตรงตามที่คอร์สสอน |
| Database | **MySQL** ผ่าน **mysql2** | เก็บข้อมูลจริงทั้งหมด (รายละเอียดหัวข้อ 4) |
| Auth | **JWT**: access token อายุสั้น + refresh token อายุยาว | มี 2 ระบบ login แยกกัน: ลูกค้า (บังคับก่อนซื้อของ) และพนักงาน (บังคับก่อนเข้าเมนูงาน ไม่ว่า role อะไร) |
| Deployment (แผนอนาคต) | Git-based deploy ไป **Render** | push GitHub → build (`tsc`) → `npm start` |

## 4. ฐานข้อมูลคืออะไร

**MySQL** คือระบบจัดการฐานข้อมูลเชิงสัมพันธ์ (Relational Database) ที่เก็บข้อมูลทุกอย่างของร้าน โค้ดเว็บ (Express) ทำหน้าที่ "รับคำสั่งจากผู้ใช้แล้วไปถาม/บันทึกข้อมูล" ส่วน MySQL คือที่ที่ข้อมูลจริงถูกเก็บไว้แบบถาวร

**เหตุผลที่เลือก MySQL แทน NoSQL:**

1. ข้อมูลมีความสัมพันธ์กันแน่นมาก ใช้ Foreign Key บังคับความถูกต้องได้ เช่น ห้ามลบสินค้าที่ยังมีอยู่ในออเดอร์
2. ต้องการ **ACID Transaction**: ตอนจ่ายเงิน ต้องหักสต็อกพร้อมสร้างออเดอร์และ Payment ในจังหวะเดียว ถ้าพลาดต้อง rollback ทั้งหมด
3. ต้อง query แบบ join หลายตารางบ่อย เช่น ดูสินค้าขายดีทั้งจากออเดอร์ปกติและจากการจัดสเปค
4. ขนาดข้อมูลร้านคอมทั่วไปไม่ได้ใหญ่ระดับต้องการ horizontal scaling แบบ NoSQL

**เหตุผลที่ Customer กับ Employee เป็นคนละตารางกัน (ไม่รวมเป็น User เดียว):**

ลูกค้ากับพนักงานมี attribute ไม่เหมือนกันจริงๆ ในโลกจริง (ลูกค้ามีที่อยู่จัดส่ง พนักงานมีวันเริ่มงานและ role) การแยกตารางทำให้ Foreign Key ควบคุมความถูกต้องได้เองตั้งแต่ระดับโครงสร้าง เช่น `SalesOrder.customer_id` อ้างอิงได้แค่คนในตาราง Customer เท่านั้น อ้างถึงพนักงานไม่ได้เลย ถ้ารวมเป็นตารางเดียวจะต้องเขียนโค้ดเช็คเองว่า FK แต่ละเส้นอ้างอิงเฉพาะ role ที่ถูกต้อง ซึ่งเพิ่มความเสี่ยงผิดพลาดโดยไม่จำเป็น

## 5. โครงสร้างโปรเจกต์ (MVC Pattern แบบพร้อมใช้งานจริง)

```
pc-shop/
├─ src/
│  ├─ app.ts                        # ประกอบ Express app: middleware, view engine, mount routes
│  ├─ server.ts                     # จุดเริ่มโปรแกรมจริง แค่ import app แล้ว listen port
│  │
│  ├─ config/
│  │   ├─ db.ts                     # สร้าง MySQL connection pool จาก .env
│  │   └─ env.ts                    # โหลด/ตรวจสอบตัวแปรแวดล้อม
│  │
│  ├─ models/                       # [M] ข้อมูล + กฎธุรกิจของแต่ละ entity
│  │   ├─ Customer.ts    Employee.ts    Brand.ts       Category.ts
│  │   ├─ Product.ts     StockAdjustment.ts             SalesOrder.ts
│  │   ├─ OrderItem.ts   PCBuild.ts     BuildItem.ts    BuildStatusHistory.ts
│  │   └─ Shipment.ts    Payment.ts
│  │
│  ├─ services/                     # คุยกับฐานข้อมูลจริง (SQL ผ่าน pool)
│  │   ├─ customerAuthService.ts    # สมัคร/login ลูกค้า + JWT
│  │   ├─ employeeAuthService.ts    # สมัคร/login พนักงาน (role เริ่ม unassigned) + JWT
│  │   ├─ staffService.ts           # ฟังก์ชันที่ staff และ admin ใช้ร่วมกัน (สต็อก, จัดส่ง, รายงาน, รายการออเดอร์)
│  │   ├─ productService.ts         # list/detail/create product, category, brand
│  │   ├─ cartService.ts            # สร้างออเดอร์/build จากตะกร้าผสม (สินค้า + ชุดคอม)
│  │   ├─ orderService.ts           # ประวัติออเดอร์ของลูกค้า
│  │   ├─ buildService.ts           # สร้าง/ดึงงานจัดสเปค, มอบหมายช่าง
│  │   ├─ stockService.ts           # ปรับสต็อก + บันทึก StockAdjustment
│  │   ├─ shipmentService.ts        # สร้าง/อัปเดตการจัดส่ง
│  │   └─ employeeService.ts        # อนุมัติ/เปลี่ยน role/ปิดการใช้งานบัญชีพนักงาน
│  │
│  ├─ controllers/                  # [C] รับ request → เรียก service → render/ส่ง JSON
│  │   ├─ customerAuthController.ts productController.ts
│  │   ├─ cartController.ts         checkoutController.ts
│  │   ├─ orderController.ts        buildController.ts
│  │   ├─ employeeAuthController.ts technicianController.ts
│  │   ├─ staffController.ts        # สต็อก, จัดส่ง, รายงาน, ดู/อัปเดตสถานะออเดอร์ (staff และ admin เข้าได้ทั้งคู่)
│  │   └─ adminController.ts        # สินค้า, อนุมัติ/เปลี่ยน role/ลบบัญชีพนักงาน (admin เท่านั้น)
│  │
│  ├─ routes/
│  │   ├─ customerAuthRoutes.ts     employeeAuthRoutes.ts
│  │   ├─ productRoutes.ts          # GET /products, GET /products/:id (public ไม่ต้อง login)
│  │   ├─ cartRoutes.ts             # ต้อง customerAuthGuard ทุกเส้นทาง
│  │   ├─ orderRoutes.ts            buildRoutes.ts
│  │   ├─ technicianRoutes.ts       # authGuard + roleGuard('technician')
│  │   ├─ staffRoutes.ts            # GET /staff/orders, POST /staff/orders/:id/status และอื่นๆ (authGuard + roleGuard(['staff','admin']))
│  │   └─ adminRoutes.ts            # authGuard + roleGuard('admin') เท่านั้น
│  │
│  ├─ views/                        # [V] EJS templates
│  │   ├─ layouts/main.ejs   partials/header.ejs, footer.ejs
│  │   ├─ auth/customer-login.ejs, customer-register.ejs
│  │   ├─ auth/employee-login.ejs, employee-register.ejs
│  │   ├─ products/index.ejs, show.ejs
│  │   ├─ cart/index.ejs     checkout/index.ejs
│  │   ├─ orders/index.ejs, confirmation.ejs
│  │   ├─ build/select.ejs, status.ejs
│  │   ├─ technician/queue.ejs, build-detail.ejs
│  │   ├─ staff/stock.ejs, shipping-queue.ejs, reports.ejs, orders.ejs
│  │   └─ admin/products/index.ejs, products/new.ejs,
│  │             employees.ejs           # รวมพนักงานทุกสถานะ (unassigned/staff/technician/admin) แก้ role ได้ในหน้านี้ (admin เท่านั้นที่เข้าได้)
│  │
│  ├─ middleware/
│  │   ├─ customerAuthGuard.ts      # เช็ค JWT ลูกค้า ใช้กับ cart/build/checkout/orders ทั้งหมด
│  │   ├─ authGuard.ts              # เช็ค JWT พนักงาน
│  │   ├─ roleGuard.ts              # เช็ค role ตรงกับหน้านั้นไหม รับ array ของ role ที่อนุญาตได้ เช่น ['staff','admin'] (ปฏิเสธถ้า role = unassigned เสมอ)
│  │   └─ errorHandler.ts
│  │
│  ├─ types/index.ts
│  └─ utils/password.ts             # hash/compare (bcrypt)
│
├─ public/css/tailwind.css   public/js/cart.js, checkout.js, build.js   public/images/
├─ data/schema.sql                  # CREATE TABLE ทั้ง 13 entity
├─ scripts/seed.ts
├─ .env   .env.example   package.json   tsconfig.json
```

**Flow การทำงาน:**

```
Browser เข้าหน้าเว็บ → Route → Guard (ถ้ามี) → Controller
→ Service (query MySQL) → Model (ตรวจกฎ)
→ Controller สั่ง res.render() → EJS ประกอบ HTML → ส่งกลับ Browser
```

**Flow checkout แบบตะกร้าผสม (สินค้าปกติ + ชุดคอม):**

```
ลูกค้ากด checkout (ตะกร้ามีทั้งสินค้าเดี่ยวและชุดคอมที่จัดสเปคไว้)
→ cartService ตรวจตะกร้า แยกเป็น 2 ส่วน
  - มีสินค้าเดี่ยว → สร้าง SalesOrder + OrderItem
  - มีชุดคอม → สร้าง PCBuild + BuildItem (เก็บอะไหล่แต่ละชิ้นไว้ให้ช่างเห็น)
→ ทั้งสองส่วนใช้ที่อยู่จัดส่งเดียวกัน จ่ายเงินหน้าเดียวกัน
→ สร้าง Payment แยกตามรายการ (order_id หรือ build_id อย่างใดอย่างหนึ่ง)
```

## 6. Business Rules (กฎทางธุรกิจ) และเหตุผล

| # | กฎ | เหตุผล |
|---|---|---|
| 1 | ลูกค้าต้อง login ก่อนถึงจะ add to cart, จัดสเปคคอม, หรือ checkout ได้ (ดูสินค้าอย่างเดียวไม่ต้อง login) | บังคับให้ทุกคนมี account ทำให้ระบบมีประวัติคำสั่งซื้อของทุกคนเสมอ ไม่ต้องแยกเคส guest/member ให้ซับซ้อน |
| 2 | พนักงานสมัครเองได้เหมือนลูกค้า แต่ role เริ่มต้นเป็น `unassigned` เข้าเมนูงานใดๆ ไม่ได้จนกว่า admin จะอนุมัติ | ลดภาระ admin ที่ต้องพิมพ์ข้อมูลแทนพนักงานทุกคน แต่ยังป้องกันคนนอกสมัครแล้วได้สิทธิ์เข้าระบบทันที |
| 3 | เฉพาะ `admin` เท่านั้นที่อนุมัติพนักงานใหม่, เปลี่ยน role คนอื่น, หรือปิดบัญชีได้ `staff` ทำไม่ได้ แม้จะเป็นพนักงานเหมือนกัน | หลัก Separation of Duties: ป้องกันไม่ให้บัญชีที่ถูกแฮ็กหรือพนักงานไม่ซื่อสัตย์ยกระดับสิทธิ์ตัวเองหรือสร้างบัญชีปลอมได้ |
| 4 | รหัสผ่านของ Customer และ Employee เก็บเป็น hash เท่านั้น | มาตรฐานความปลอดภัยขั้นพื้นฐาน |
| 5 | พนักงานทุกบทบาทอยู่ใน entity เดียวคือ `Employee` แยกด้วย `role` (`unassigned`/`staff`/`technician`/`admin`) | คนเดียวอาจถูกปรับ role ภายหลังได้ ลดความซ้ำซ้อนของตาราง |
| 6 | Customer และ Employee เป็นคนละ entity กัน ไม่รวมเป็นตารางเดียว | attribute ต่างกันจริงในโลกจริง และ FK แต่ละเส้นจะอ้างอิงเฉพาะ entity ที่ถูกต้องได้เองตั้งแต่ระดับโครงสร้าง ไม่ต้องเขียนโค้ดเช็ค role ของ FK เพิ่มเติม |
| 7 | ทุกครั้งที่ปรับสต็อก ต้องบันทึกลง `StockAdjustment` | audit ย้อนหลังได้ว่าใครปรับ เมื่อไหร่ เท่าไหร่ |
| 8 | สต็อกที่ลดจากการขายไม่ต้องบันทึกซ้ำใน `StockAdjustment` | trace ผ่าน `OrderItem`/`BuildItem` ได้อยู่แล้ว |
| 9 | `PCBuild.assigned_technician_id` เก็บผู้รับผิดชอบปัจจุบัน ส่วน `BuildStatusHistory` เก็บ log ทั้งหมด | ต้องรู้ทั้งสถานะปัจจุบันและประวัติย้อนหลัง |
| 10 | `Shipment` ใช้ร่วมกันได้ทั้ง `SalesOrder` และ `PCBuild` (ตรงกับ Lab 7 Proposal ที่ส่งไปแล้ว - BR15) แต่ละใบมี Shipment เป็นของตัวเอง 1 รายการเสมอ | มี attribute เฉพาะทาง (เลขพัสดุ, สถานะจัดส่ง) ที่ใช้ร่วมกันได้ทั้งสองแบบการซื้อ ไม่ต้องแยกตารางซ้ำซ้อน - `buildService.updateBuildStatus()` สร้าง/อัปเดต Shipment ให้ build อัตโนมัติตอนสถานะเปลี่ยนเป็น `shipped`/`delivered` (เรียก `shipmentService.setBuildShippingStatus()`) ส่วน `PCBuild.status` ยังเป็น source of truth หลักของ lifecycle ทั้งหมดอยู่ดี |
| 11 | `Payment` และ `Shipment` มี FK ทั้ง `order_id` และ `build_id` แบบ nullable ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น (exclusive-or) | มาจากออเดอร์ปกติ**หรือ**งานจัดสเปคเสมอ ไม่ใช่ทั้งคู่พร้อมกัน จึงรองรับตะกร้าผสมที่สร้างทั้งสองอย่างพร้อมกันได้ในการ checkout ครั้งเดียว - บังคับด้วย `assertExactlyOneLink()` ที่ [validate.ts](../src/utils/validate.ts) จริง เรียกก่อน insert ทุกจุดทั้ง `Payment` และ `Shipment` |
| 11.1 | แต่ละ `SalesOrder`/`PCBuild` จ่ายเงินครั้งเดียวเต็มจำนวนเสมอ ไม่มีผ่อนจ่ายหลายงวด (`Payment` : `SalesOrder` และ `Payment` : `PCBuild` เป็น 1:1 ไม่ใช่ 1:N) | ตัดฟีเจอร์แบ่งจ่ายออกจาก scope เพื่อลดความซับซ้อน โปรเจกต์นี้ไม่มี payment gateway จริงอยู่แล้ว การจ่ายครั้งเดียวจบเพียงพอ |
| 12 | `OrderItem`/`BuildItem` เป็น associative entity ไม่ใช่ entity อิสระ | ความสัมพันธ์แบบ M:N ต้องมีตารางกลางแตกความสัมพันธ์ตามหลัก ER-to-Relational mapping |
| 13 | Staff และ admin ต้องดูและอัปเดตสถานะ `SalesOrder` แต่ละใบได้ ไม่ใช่แค่ดูรายงานสรุป | ใบงานกำหนดว่าต้องมี CRUD ครบของ main record ทุกตัว รายงานสรุป (Q1, Q2) เป็นแค่ข้อมูลรวม ไม่ใช่การจัดการรายตัว |

## 7. รายการ Entity ทั้งหมด พร้อม Attribute (13 entities)

**สัญลักษณ์:** ตัวหนา = Primary Key (PK), (FK) = Foreign Key

### กลุ่ม Master Data

**Customer**: ข้อมูลลูกค้า
- **customer_id**, full_name, email (unique), phone, password_hash, address, created_at

**Employee**: ข้อมูลพนักงาน สมัครเองได้ role เริ่มต้นเป็น unassigned
- **employee_id**, full_name, email (unique), password_hash, phone, role (`unassigned` / `staff` / `technician` / `admin`), hire_date (nullable จนกว่าจะถูกอนุมัติ)

**Brand**: แบรนด์สินค้า
- **brand_id**, brand_name, country_origin

**Category**: หมวดหมู่สินค้า
- **category_id**, category_name, is_build_component, description

**Product**: สินค้า/อะไหล่
- **product_id**, product_name, category_id (FK), brand_id (FK), price, stock_quantity, spec_detail, image_url, warranty_months, is_active

### กลุ่มสต็อก

**StockAdjustment**: บันทึกประวัติการปรับปรุงจำนวนสต็อกสินค้า
- **adjustment_id**, product_id (FK), employee_id (FK), quantity_changed, adjustment_type (`restock` / `correction`), note, adjusted_at

### กลุ่มซื้อของปกติ

**SalesOrder**: คำสั่งซื้อ
- **order_id**, customer_id (FK), order_date, status (`pending` / `paid` / `cancelled`), total_amount, shipping_address

**OrderItem**: รายการสินค้าในคำสั่งซื้อ (ตัวเชื่อม M:N ระหว่าง SalesOrder กับ Product)
- **order_id** (FK,PK), **product_id** (FK,PK), quantity, unit_price

### กลุ่มจัดสเปคคอม

**PCBuild**: งานจัดสเปคคอมของลูกค้า
- **build_id**, customer_id (FK), assigned_technician_id (FK → Employee, nullable), build_name, build_date, status (`draft` / `paid` / `assigned` / `assembling` / `completed` / `shipped` / `delivered`), total_price

**BuildItem**: รายการอะไหล่ในงานจัดสเปค (ตัวเชื่อม M:N ระหว่าง PCBuild กับ Product)
- **build_id** (FK,PK), **product_id** (FK,PK), quantity

**BuildStatusHistory**: ประวัติการเปลี่ยนสถานะงานจัดสเปค
- **history_id**, build_id (FK), employee_id (FK), status, updated_at, note

### กลุ่มจัดส่ง

**Shipment**: ข้อมูลการจัดส่ง (ใช้ได้ทั้งงานจัดสเปคและออเดอร์ปกติ - แต่ละใบมี Shipment เป็นของตัวเอง 1 รายการเสมอ)
- **shipment_id**, order_id (FK, nullable), build_id (FK, nullable), employee_id (FK), courier_name, tracking_number, shipped_date, delivered_date, shipping_status

### กลุ่มร่วม

**Payment**: การชำระเงิน (ใช้ได้ทั้งงานจัดสเปคและออเดอร์ปกติ - จ่ายครั้งเดียวเต็มจำนวนเสมอ ไม่มีผ่อนจ่ายหลายงวด)
- **payment_id**, order_id (FK, nullable), build_id (FK, nullable), amount, payment_date, payment_method, payment_status

## 8. ความสัมพันธ์ระหว่าง Entity (สำหรับวาด ER Diagram)

| # | ความสัมพันธ์ | Cardinality | คำอธิบาย |
|---|---|---|---|
| 1 | Customer – places – SalesOrder | 1:N | ลูกค้าหนึ่งคนสั่งซื้อได้หลายครั้ง |
| 2 | SalesOrder – contains – OrderItem | 1:N | ออเดอร์หนึ่งมีหลายรายการสินค้า |
| 3 | Product – appears in – OrderItem | 1:N | แก้ปัญหา M:N ระหว่าง SalesOrder กับ Product |
| 4 | Category – classifies – Product | 1:N | หนึ่งหมวดหมู่มีหลายสินค้า |
| 5 | Brand – produces – Product | 1:N | หนึ่งแบรนด์มีหลายสินค้า |
| 6 | Product – has – StockAdjustment | 1:N | สินค้าหนึ่งชิ้นถูกปรับสต็อกได้หลายครั้ง |
| 7 | Employee – performs – StockAdjustment | 1:N | พนักงานหนึ่งคนปรับสต็อกได้หลายครั้ง |
| 8 | Customer – requests – PCBuild | 1:N | ลูกค้าขอจัดสเปคได้หลายครั้ง |
| 9 | Employee – assigned to – PCBuild | 1:N | ช่างหนึ่งคนรับผิดชอบได้หลายงาน |
| 10 | PCBuild – composed of – BuildItem | 1:N | งานจัดสเปคหนึ่งงานมีหลายอะไหล่ |
| 11 | Product – used in – BuildItem | 1:N | แก้ปัญหา M:N ระหว่าง PCBuild กับ Product |
| 12 | PCBuild – has – BuildStatusHistory | 1:N | มีการอัปเดตสถานะได้หลายครั้ง |
| 13 | Employee – updates – BuildStatusHistory | 1:N | พนักงานหนึ่งคนอัปเดตได้หลายครั้ง |
| 14 | PCBuild – has – Shipment | 1:1 | แต่ละ PCBuild มี Shipment เป็นของตัวเอง 1 รายการเสมอ |
| 15 | SalesOrder – has – Shipment | 1:1 | แต่ละ SalesOrder มี Shipment เป็นของตัวเอง 1 รายการเสมอเช่นกัน |
| 16 | Employee – performs – Shipment | 1:N | พนักงานหนึ่งคนดำเนินการจัดส่งได้หลายครั้ง |
| 17 | SalesOrder – generates – Payment | 1:1 | จ่ายเงินครั้งเดียวเต็มจำนวนเสมอ ไม่มีผ่อนจ่ายหลายงวด |
| 18 | PCBuild – generates – Payment | 1:1 | จ่ายเงินครั้งเดียวเต็มจำนวนเสมอเช่นกัน |

รวมทั้งหมด **18 relationships** ตรงกับ Lab 7 Proposal ที่ส่งไปแล้ว ยังคงเกินเกณฑ์ขั้นต่ำ 4 relationships มาก

**หมายเหตุสำคัญสำหรับตอนวาด ERD:**

- `OrderItem` และ `BuildItem` คือ **associative entity** ไม่ใช่ entity อิสระทั่วไป
- `Payment` และ `Shipment` มี FK สองเส้นที่เป็นแบบ "ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น" (exclusive-or: `order_id` หรือ `build_id`) ต้องเขียนกำกับ constraint นี้เพิ่มเติมจากตัวไดอะแกรม - บังคับด้วยฟังก์ชัน `assertExactlyOneLink()` จริงในโค้ด ไม่ใช่แค่ by convention
- `assigned_technician_id` ใน PCBuild เป็น FK แบบ nullable (ตอนสร้างงานใหม่ยังไม่มีช่างรับผิดชอบ)
- `Employee.role` มี 4 ค่า (`unassigned`/`staff`/`technician`/`admin`) ไม่ใช่ FK แต่เป็น attribute ธรรมดาที่ถูกจำกัดค่าด้วย CHECK constraint เฉพาะ `admin` เท่านั้นที่แก้ role ของคนอื่นได้ (Separation of Duties)

## 9. สรุปจำนวน Entity ตามเงื่อนไขอาจารย์

รวมทั้งหมด **13 entities** ซึ่งเกินเกณฑ์ 10 entity ที่อาจารย์กำหนด และทุกตัวมีเหตุผลรองรับการมีอยู่จริงในระบบ ไม่ได้ใส่มาเพื่อให้ครบจำนวนเฉยๆ
