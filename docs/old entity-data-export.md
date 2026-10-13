# Entity/Attribute Raw Data Export - Shift-High PC

> ไฟล์นี้สร้างขึ้นเพื่อส่งข้อมูลดิบของโปรเจกต์ (entity, attribute, field ที่เพิ่มทีหลัง, สถานะหน้าเว็บ) ไปให้แชท Claude อีกฝั่งที่ดูแลใบงาน/ER-Diagram/business rules ของโปรเจกต์นี้ ไม่ใช่เอกสารสเปกหลักของโปรเจกต์ (ดูสเปกหลักที่ [`pc-shop-explainer.md`](./pc-shop-explainer.md))
>
> สร้างเมื่อ: 2026-09-10

---

## 1. `src/types/index.ts` (เนื้อหาเต็ม)

```typescript
import { EmployeeRole } from '../models/Employee';

export interface CustomerJwtPayload {
  customer_id: number;
  email: string;
}

export interface EmployeeJwtPayload {
  employee_id: number;
  email: string;
  role: EmployeeRole;
}

// เพิ่ม field ให้ Express.Request เพื่อให้ guard แนบข้อมูลผู้ใช้ที่ login ไว้ใช้ต่อใน controller
declare global {
  namespace Express {
    interface Request {
      customer?: CustomerJwtPayload;
      employee?: EmployeeJwtPayload;
    }
  }
}

export {};
```

**หมายเหตุ**: ไฟล์นี้เป็นแค่ type ของ JWT payload (ใช้ตอนถอดรหัส token) ไม่ใช่ entity หลัก - entity ตัวจริงทั้ง 13 ตัวอยู่แยกไฟล์ในโฟลเดอร์ `src/models/` (ข้อ 2 ด้านล่าง)

---

## 2. `src/models/*.ts` ทั้ง 13 ไฟล์ (เนื้อหาเต็มทุกไฟล์)

### `Brand.ts`

```typescript
export interface Brand {
  brand_id: number;
  brand_name: string;
  country_origin?: string;
}
```

### `Category.ts`

```typescript
export interface Category {
  category_id: number;
  category_name: string;
  is_build_component: boolean;
  description?: string;
}
```

### `Customer.ts`

```typescript
export interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  phone?: string;
  password_hash: string;
  address?: string;
  created_at: Date;
}
```

### `Employee.ts`

```typescript
export type EmployeeRole = 'unassigned' | 'staff' | 'technician' | 'admin';

export interface Employee {
  employee_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role: EmployeeRole;
  hire_date?: Date | null;
  // เพิ่มจากเอกสารเดิม - จำเป็นสำหรับฟีเจอร์ "ปิดการใช้งานบัญชี" ที่ admin ทำได้ (business rule ข้อ 3)
  is_active: boolean;
}
```

### `Product.ts`

```typescript
export interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  brand_id: number;
  price: number;
  stock_quantity: number;
  spec_detail?: string;
  image_url?: string;
  warranty_months?: number;
  is_active: boolean;
}
```

### `StockAdjustment.ts`

```typescript
export type AdjustmentType = 'restock' | 'correction';

export interface StockAdjustment {
  adjustment_id: number;
  product_id: number;
  employee_id: number;
  quantity_changed: number;
  adjustment_type: AdjustmentType;
  note?: string;
  adjusted_at: Date;
}
```

### `SalesOrder.ts`

```typescript
export type SalesOrderStatus = 'pending' | 'paid' | 'cancelled';

export interface SalesOrder {
  order_id: number;
  customer_id: number;
  order_date: Date;
  status: SalesOrderStatus;
  total_amount: number;
  shipping_address: string;
}
```

### `OrderItem.ts`

```typescript
// associative entity ระหว่าง SalesOrder กับ Product (M:N)
export interface OrderItem {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}
```

### `PCBuild.ts`

```typescript
export type PCBuildStatus =
  | 'draft'
  | 'paid'
  | 'assigned'
  | 'assembling'
  | 'completed'
  | 'shipped'
  | 'delivered'
  // เพิ่มจากเอกสารเดิม - กรณีช่างกับลูกค้าตกลงกันแล้วว่าประกอบไม่ได้จริงๆ (เช่น อะไหล่เข้ากันไม่ได้)
  | 'cancelled';

export interface PCBuild {
  build_id: number;
  customer_id: number;
  assigned_technician_id?: number | null;
  build_name: string;
  build_date: Date;
  status: PCBuildStatus;
  total_price: number;
  // เพิ่มจากเอกสารเดิม - ลูกค้ากรอกที่อยู่ตอน checkout เหมือน SalesOrder แต่เอกสารต้นฉบับไม่มีที่เก็บให้ PCBuild
  // จึงเซ็ตค่านี้ตอน checkoutCart() แปลงสถานะ draft -> paid (ก่อนหน้านั้นยังเป็น undefined)
  shipping_address?: string;
}
```

### `BuildItem.ts`

```typescript
// associative entity ระหว่าง PCBuild กับ Product (M:N)
export interface BuildItem {
  build_id: number;
  product_id: number;
  quantity: number;
}
```

### `BuildStatusHistory.ts`

```typescript
import { PCBuildStatus } from './PCBuild';

export interface BuildStatusHistory {
  history_id: number;
  build_id: number;
  employee_id: number;
  status: PCBuildStatus;
  updated_at: Date;
  note?: string;
}
```

### `Shipment.ts`

> **ยืนยันตรงกับ Lab 7 Proposal ที่ส่งไปแล้ว (BR15, BR17)**: `Shipment` ใช้ร่วมกันได้ทั้ง `SalesOrder` และ `PCBuild` แต่ละใบมี Shipment เป็นของตัวเอง 1 รายการเสมอ - `buildService.updateBuildStatus()` สร้าง/อัปเดต Shipment ให้ build จริงตอนสถานะเปลี่ยนเป็น `shipped`/`delivered` (เรียก `shipmentService.setBuildShippingStatus()`)

```typescript
// order_id / build_id เป็น FK แบบ nullable แต่ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น (exclusive-or)
export interface Shipment {
  shipment_id: number;
  order_id?: number | null;
  build_id?: number | null;
  employee_id: number;
  courier_name: string;
  tracking_number?: string;
  shipped_date?: Date | null;
  delivered_date?: Date | null;
  shipping_status: string;
}
```

### `Payment.ts`

```typescript
// order_id / build_id เป็น FK แบบ nullable แต่ต้องมีค่าอย่างใดอย่างหนึ่งเท่านั้น (exclusive-or)
export interface Payment {
  payment_id: number;
  order_id?: number | null;
  build_id?: number | null;
  amount: number;
  payment_date: Date;
  payment_method: string;
  payment_status: string;
}
```

---

## 3. Mock data array แยกใน services

**ไม่มี** - เพราะมี model file แยกครบแล้ว (ข้อ 2) ข้อมูลจำลอง (seed data) ทั้งหมดอยู่รวมที่ไฟล์เดียวคือ `src/data/store.ts` (ทำหน้าที่เป็น "ฐานข้อมูลจำลอง" แทน MySQL) ไม่ได้กระจายเป็น mock array แยกไฟล์ตาม service - services ทุกไฟล์ import object เดียวกันจากที่นี่มาอ่าน/เขียน

---

## 4. Field/attribute ทั้งหมดของแต่ละ entity (ตอนนี้)

| Entity | Fields |
|---|---|
| **Customer** | customer_id (PK), full_name, email (unique), phone, password_hash, address, created_at |
| **Employee** | employee_id (PK), full_name, email (unique), password_hash, phone, role (`unassigned`\|`staff`\|`technician`\|`admin`), hire_date, **is_active** |
| **Brand** | brand_id (PK), brand_name, country_origin |
| **Category** | category_id (PK), category_name, is_build_component, description |
| **Product** | product_id (PK), product_name, category_id (FK), brand_id (FK), price, stock_quantity, spec_detail, image_url, warranty_months, is_active |
| **StockAdjustment** | adjustment_id (PK), product_id (FK), employee_id (FK), quantity_changed, adjustment_type (`restock`\|`correction`), note, adjusted_at |
| **SalesOrder** | order_id (PK), customer_id (FK), order_date, status (`pending`\|`paid`\|`cancelled`), total_amount, shipping_address |
| **OrderItem** | order_id (FK,PK), product_id (FK,PK), quantity, unit_price |
| **PCBuild** | build_id (PK), customer_id (FK), assigned_technician_id (FK, nullable), build_name, build_date, status (`draft`\|`paid`\|`assigned`\|`assembling`\|`completed`\|`shipped`\|`delivered`\|**`cancelled`**), total_price, **shipping_address** |
| **BuildItem** | build_id (FK,PK), product_id (FK,PK), quantity |
| **BuildStatusHistory** | history_id (PK), build_id (FK), employee_id (FK), status, updated_at, note |
| **Shipment** | shipment_id (PK), order_id (FK, nullable), build_id (FK, nullable), employee_id (FK), courier_name, tracking_number, shipped_date, delivered_date, shipping_status (`preparing`\|`shipped`\|`delivered`) - **ใช้ร่วมกันได้ทั้ง SalesOrder และ PCBuild (1:1 กับแต่ละอัน)** |
| **Payment** | payment_id (PK), order_id (FK, nullable), build_id (FK, nullable), amount, payment_date, payment_method (`cod`\|`bank_transfer`), payment_status (`paid`) - **จ่ายครั้งเดียวเต็มจำนวนเสมอ ไม่มีผ่อนจ่าย (1:1 กับ SalesOrder/PCBuild)** |

รวม **13 entities** เท่าเดิมตามเอกสาร ไม่มี entity ใหม่เพิ่ม

---

## 5. Field ที่เพิ่มเข้ามาทีหลัง (นอกเหนือจาก pc-shop-explainer.md ต้นฉบับ)

มี 3 จุดที่ต่างจากสเปกเดิม ทั้งหมดเป็นการเพิ่ม field ไม่ใช่เพิ่ม entity ใหม่:

1. **`Employee.is_active: boolean`** - เอกสารเดิมไม่มี field นี้ เพิ่มเพราะ business rule ที่ระบุไว้ว่า admin ต้อง "ปิดการใช้งานบัญชีพนักงาน" ได้ (disable/enable) แต่ไม่มี field ไหนในสเปกเดิมเก็บสถานะนี้ไว้เลย จึงต้องเพิ่ม boolean flag นี้เข้ามาเพื่อรองรับฟีเจอร์จริง

2. **`PCBuild.shipping_address?: string`** - เอกสารเดิมให้ `SalesOrder` มี `shipping_address` แต่ `PCBuild` ไม่มี ทั้งที่ลูกค้าจัดสเปคคอมก็ต้องกรอกที่อยู่จัดส่งตอน checkout เหมือนกัน จึงเพิ่ม field นี้ให้ `PCBuild` ด้วย (เป็น optional เพราะตอนที่ build ยังอยู่สถานะ `draft` - ยังไม่ checkout - จะยังไม่มีค่า จะถูกเซ็ตตอนแปลงสถานะ draft → paid เท่านั้น)

3. **`PCBuild.status` เพิ่มค่า `'cancelled'`** - เอกสารเดิมมีแค่ 7 ค่า (draft/paid/assigned/assembling/completed/shipped/delivered) เพิ่มค่าที่ 8 คือ `cancelled` เพื่อรองรับกรณีที่ช่างกับลูกค้าตกลงกันว่าประกอบไม่ได้จริง (เช่น อะไหล่เข้ากันไม่ได้ทางเทคนิค) ซึ่งเป็นเคสที่เกิดขึ้นจริงได้แต่สเปกเดิมไม่ได้ระบุทางออกไว้

ไม่มี field หรือ entity อื่นนอกจาก 3 จุดนี้ที่เบี่ยงจากเอกสารต้นฉบับ

---

## 6. สถานะหน้าเว็บ (ทำเสร็จ/ยังไม่เสร็จ)

ทำเสร็จครบทุกหน้าแล้ว (ยกเว้นแค่ SQL จริงที่ยังไม่ทำตามแผน) รายการทั้งหมด:

| หน้า | ไฟล์ | สถานะ |
|---|---|---|
| หน้าแรก | `home.ejs` | เสร็จ |
| สินค้าทั้งหมด (list+filter+search+sort) | `products/index.ejs` | เสร็จ |
| รายละเอียดสินค้า | `products/show.ejs` | เสร็จ |
| สมัคร/ล็อกอินลูกค้า | `auth/customer-register.ejs`, `auth/customer-login.ejs` | เสร็จ |
| สมัคร/ล็อกอินพนักงาน | `auth/employee-register.ejs`, `auth/employee-login.ejs` | เสร็จ |
| จัดสเปคคอม (เลือกอะไหล่ทีละหมวด) | `build/select.ejs` | เสร็จ |
| ติดตามสถานะงานประกอบ (timeline) | `build/status.ejs` | เสร็จ |
| ตะกร้าสินค้า | `cart/index.ejs` | เสร็จ |
| Checkout (เลือกที่อยู่+วิธีชำระเงิน) | `checkout/index.ejs` | เสร็จ |
| ประวัติคำสั่งซื้อทั้งหมด | `orders/index.ejs` | เสร็จ |
| ใบยืนยันคำสั่งซื้อ | `orders/confirmation.ejs` | เสร็จ |
| โปรไฟล์ลูกค้า/เปลี่ยนรหัสผ่าน | `account/customer.ejs` | เสร็จ |
| โปรไฟล์พนักงาน/เปลี่ยนรหัสผ่าน | `account/employee.ejs` | เสร็จ |
| คิวงานช่าง | `technician/queue.ejs` | เสร็จ |
| รายละเอียดงาน+อัปเดตสถานะ (ช่าง) | `technician/build-detail.ejs` | เสร็จ |
| จัดการคำสั่งซื้อ+งานจัดสเปคทั้งหมด (staff) | `staff/orders.ejs` | เสร็จ |
| ปรับสต็อกสินค้า (staff) | `staff/stock.ejs` | เสร็จ |
| รายงานยอดขาย+สินค้าขายดี (staff) | `staff/reports.ejs` | เสร็จ |
| จัดการสินค้า - list (admin) | `admin/products/index.ejs` | เสร็จ |
| เพิ่ม/แก้ไขสินค้า (admin) | `admin/products/new.ejs`, `admin/products/edit.ejs` | เสร็จ (มี validation ราคา/สต็อก/หมวดหมู่/แบรนด์) |
| จัดการพนักงาน - อนุมัติ/role/ปิดบัญชี (admin) | `admin/employees.ejs` | เสร็จ |
| 403 / 404 | `403.ejs`, `404.ejs` | เสร็จ |

ทดสอบ end-to-end แล้วทุก role (customer, staff, technician, admin) รวมถึงทำ responsive design ครบทุกขนาดจอ (มือถือ 375px / แท็บเล็ต 768px / เดสก์ท็อป 1024px+) - เมนูแฮมเบอร์เกอร์บนมือถือ, ตัวกรองสินค้าพับเก็บได้, ตารางจัดการคำสั่งซื้อไม่ล้นจอ ก็ทำครบแล้วเช่นกัน

สิ่งเดียวที่ยังไม่ทำ: MySQL จริง (schema.sql + seed script) - ตอนนี้ใช้ dev store (`src/data/store.ts`) จำลองไปก่อนตามแผนเดิม, และเบอร์ติดต่อร้านใน footer ยังเป็น placeholder รอข้อมูลจริง
