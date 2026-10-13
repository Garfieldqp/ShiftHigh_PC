-- =====================================================================
-- Shift-High PC: FULL SCRIPT (run top to bottom in MySQL Workbench)
-- 1) schema.sql   create database pc_shop and the 13 tables
-- 2) seed.sql     categories, brands, products, test accounts,
--                 sample orders, builds, payments and shipments
-- 3) queries      14 queries: Q1-Q10 SELECT, then Q11-Q14 UPDATE / DELETE / INSERT
--
-- Same content as database/schema.sql and database/seed.sql in the project.
-- If pc_shop already exists, first run:  DROP DATABASE pc_shop;
-- =====================================================================

-- =====================================================================
-- Shift-High PC: create database and tables (MySQL 8)
-- 13 tables, matching section 4.1 of the revised Lab 7 proposal.
--
-- Run in MySQL Workbench: File > Open SQL Script > Execute (lightning icon).
-- To start again from nothing, first run:  DROP DATABASE pc_shop;
-- =====================================================================

CREATE DATABASE pc_shop;
USE pc_shop;

-- ---------------------------------------------------------------------
-- Customer
-- ---------------------------------------------------------------------
CREATE TABLE customer (
  customer_id    INT NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(20),
  password_hash  VARCHAR(255) NOT NULL,   -- BR24: only the hashed password is stored
  address        VARCHAR(500),
  created_at     TIMESTAMP NOT NULL,
  CONSTRAINT Customer_PK PRIMARY KEY (customer_id)
);

-- ---------------------------------------------------------------------
-- Employee (BR21: one role value at a time, 'unassigned' = waiting for approval)
-- ---------------------------------------------------------------------
CREATE TABLE employee (
  employee_id    INT NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,   -- BR24
  phone          VARCHAR(20),
  role           VARCHAR(20) NOT NULL DEFAULT 'unassigned',
  hire_date      DATE,                    -- NULL while still unassigned
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT Employee_PK PRIMARY KEY (employee_id),
  CONSTRAINT Employee_Role_CHK CHECK (role IN ('unassigned', 'staff', 'technician', 'admin'))
);

-- ---------------------------------------------------------------------
-- Brand, Category
-- ---------------------------------------------------------------------
CREATE TABLE brand (
  brand_id        INT NOT NULL AUTO_INCREMENT,
  brand_name      VARCHAR(100) NOT NULL,
  country_origin  VARCHAR(100),
  CONSTRAINT Brand_PK PRIMARY KEY (brand_id)
);

CREATE TABLE category (
  category_id         INT NOT NULL AUTO_INCREMENT,
  category_name       VARCHAR(100) NOT NULL,
  is_build_component  BOOLEAN NOT NULL DEFAULT TRUE,
  description         VARCHAR(255),
  CONSTRAINT Category_PK PRIMARY KEY (category_id)
);

-- ---------------------------------------------------------------------
-- Product (BR9: one category, BR10: one brand, BR22: stock never below zero)
-- ---------------------------------------------------------------------
CREATE TABLE product (
  product_id       INT NOT NULL AUTO_INCREMENT,
  product_name     VARCHAR(200) NOT NULL,
  category_id      INT NOT NULL,
  brand_id         INT NOT NULL,
  price            DECIMAL(10,2) NOT NULL,
  stock_quantity   INT NOT NULL DEFAULT 0,
  spec_detail      VARCHAR(1000),
  image_url        VARCHAR(500),
  warranty_months  INT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = hidden from the shop, old orders still point here
  CONSTRAINT Product_PK PRIMARY KEY (product_id),
  CONSTRAINT Product_FK1 FOREIGN KEY (category_id) REFERENCES category (category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Product_FK2 FOREIGN KEY (brand_id) REFERENCES brand (brand_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Product_CHK CHECK (price > 0 AND stock_quantity >= 0)
);

-- ---------------------------------------------------------------------
-- StockAdjustment (BR14: must record the product and the employee)
-- ---------------------------------------------------------------------
CREATE TABLE stock_adjustment (
  adjustment_id     INT NOT NULL AUTO_INCREMENT,
  product_id        INT NOT NULL,
  employee_id       INT NOT NULL,
  quantity_changed  INT NOT NULL,
  adjustment_type   VARCHAR(20) NOT NULL,
  note              VARCHAR(255),
  adjusted_at       TIMESTAMP NOT NULL,
  CONSTRAINT Stock_Adjustment_PK PRIMARY KEY (adjustment_id),
  CONSTRAINT Stock_Adjustment_FK1 FOREIGN KEY (product_id) REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Stock_Adjustment_FK2 FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Stock_Adjustment_CHK CHECK (adjustment_type IN ('restock', 'correction'))
);

-- ---------------------------------------------------------------------
-- SalesOrder (BR1: each order belongs to one customer)
-- ---------------------------------------------------------------------
CREATE TABLE sales_order (
  order_id          INT NOT NULL AUTO_INCREMENT,
  customer_id       INT NOT NULL,
  order_date        TIMESTAMP NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount      DECIMAL(12,2) NOT NULL,
  shipping_address  VARCHAR(500) NOT NULL,
  CONSTRAINT Sales_Order_PK PRIMARY KEY (order_id),
  CONSTRAINT Sales_Order_FK FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Sales_Order_CHK CHECK (status IN ('pending', 'paid', 'cancelled') AND total_amount >= 0)
);

-- ---------------------------------------------------------------------
-- OrderItem: associative entity (M:N between SalesOrder and Product)
-- BR3, BR5, BR23 (unit_price = price at the time of purchase)
-- ---------------------------------------------------------------------
CREATE TABLE order_item (
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  CONSTRAINT Order_Item_PK PRIMARY KEY (order_id, product_id),
  CONSTRAINT Order_Item_FK1 FOREIGN KEY (order_id) REFERENCES sales_order (order_id)
    ON DELETE CASCADE,
  CONSTRAINT Order_Item_FK2 FOREIGN KEY (product_id) REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Order_Item_CHK CHECK (quantity > 0 AND unit_price >= 0)
);

-- ---------------------------------------------------------------------
-- PCBuild (BR2: one customer, BR11: technician is optional, at most one)
-- ---------------------------------------------------------------------
CREATE TABLE pc_build (
  build_id                INT NOT NULL AUTO_INCREMENT,
  customer_id             INT NOT NULL,
  assigned_technician_id  INT,
  build_name              VARCHAR(100) NOT NULL,
  build_date              TIMESTAMP NOT NULL,      -- BR25: always set by the server to the current time
  status                  VARCHAR(20) NOT NULL DEFAULT 'draft',
  total_price             DECIMAL(12,2) NOT NULL,
  shipping_address        VARCHAR(500),
  CONSTRAINT PC_Build_PK PRIMARY KEY (build_id),
  CONSTRAINT PC_Build_FK1 FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT PC_Build_FK2 FOREIGN KEY (assigned_technician_id) REFERENCES employee (employee_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT PC_Build_CHK CHECK (status IN ('draft', 'paid', 'assigned', 'assembling',
                                            'completed', 'shipped', 'delivered', 'cancelled')
                                 AND total_price >= 0)
);

-- ---------------------------------------------------------------------
-- BuildItem: associative entity (M:N between PCBuild and Product)
-- BR6, BR8, BR23 (unit_price copied from product.price when the build is created)
-- ---------------------------------------------------------------------
CREATE TABLE build_item (
  build_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  CONSTRAINT Build_Item_PK PRIMARY KEY (build_id, product_id),
  CONSTRAINT Build_Item_FK1 FOREIGN KEY (build_id) REFERENCES pc_build (build_id)
    ON DELETE CASCADE,
  CONSTRAINT Build_Item_FK2 FOREIGN KEY (product_id) REFERENCES product (product_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Build_Item_CHK CHECK (quantity > 0 AND unit_price >= 0)
);

-- ---------------------------------------------------------------------
-- BuildStatusHistory (BR12: belongs to one build, BR13: made by one employee)
-- ---------------------------------------------------------------------
CREATE TABLE build_status_history (
  history_id   INT NOT NULL AUTO_INCREMENT,
  build_id     INT NOT NULL,
  employee_id  INT NOT NULL,
  status       VARCHAR(20) NOT NULL,
  updated_at   TIMESTAMP NOT NULL,
  note         VARCHAR(255),
  CONSTRAINT Build_Status_History_PK PRIMARY KEY (history_id),
  CONSTRAINT Build_Status_History_FK1 FOREIGN KEY (build_id) REFERENCES pc_build (build_id)
    ON DELETE CASCADE,
  CONSTRAINT Build_Status_History_FK2 FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Shipment (BR16: handled by one employee)
-- BR19 exclusive arc: exactly one of order_id / build_id is set (CHECK below).
-- order_id and build_id are used in the CHECK, so MySQL does not allow
-- CASCADE on their foreign keys: they use RESTRICT instead.
-- ---------------------------------------------------------------------
CREATE TABLE shipment (
  shipment_id      INT NOT NULL AUTO_INCREMENT,
  order_id         INT,
  build_id         INT,
  employee_id      INT NOT NULL,
  courier_name     VARCHAR(100) NOT NULL DEFAULT '-',
  tracking_number  VARCHAR(100),
  shipped_date     TIMESTAMP,
  delivered_date   TIMESTAMP,
  shipping_status  VARCHAR(20) NOT NULL DEFAULT 'preparing',
  CONSTRAINT Shipment_PK PRIMARY KEY (shipment_id),
  CONSTRAINT Shipment_FK1 FOREIGN KEY (order_id) REFERENCES sales_order (order_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT Shipment_FK2 FOREIGN KEY (build_id) REFERENCES pc_build (build_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT Shipment_FK3 FOREIGN KEY (employee_id) REFERENCES employee (employee_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT Shipment_Arc_CHK CHECK ((order_id IS NOT NULL AND build_id IS NULL)
                                  OR (order_id IS NULL AND build_id IS NOT NULL)),
  CONSTRAINT Shipment_Status_CHK CHECK (shipping_status IN ('preparing', 'shipped', 'delivered'))
);

-- ---------------------------------------------------------------------
-- Payment (BR18: created at checkout)
-- BR20 exclusive arc: the same as shipment.
-- ---------------------------------------------------------------------
CREATE TABLE payment (
  payment_id      INT NOT NULL AUTO_INCREMENT,
  order_id        INT,
  build_id        INT,
  amount          DECIMAL(12,2) NOT NULL,
  payment_date    TIMESTAMP NOT NULL,
  payment_method  VARCHAR(20) NOT NULL,
  payment_status  VARCHAR(20) NOT NULL DEFAULT 'paid',
  CONSTRAINT Payment_PK PRIMARY KEY (payment_id),
  CONSTRAINT Payment_FK1 FOREIGN KEY (order_id) REFERENCES sales_order (order_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT Payment_FK2 FOREIGN KEY (build_id) REFERENCES pc_build (build_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT Payment_Arc_CHK CHECK ((order_id IS NOT NULL AND build_id IS NULL)
                                 OR (order_id IS NULL AND build_id IS NOT NULL)),
  CONSTRAINT Payment_CHK CHECK (amount >= 0 AND payment_method IN ('cod', 'bank_transfer'))
);


-- =====================================================================
-- Shift-High PC: sample data. Run AFTER schema.sql.
-- Catalogue (8 categories, 20 brands, 48 products) and test accounts come
-- from the app's original dev seed. Sample orders and builds are added so
-- reports and the technician queue have something to show.
--
-- Test accounts (development only, change before real use):
--   admin@shift-high-pc.example       / admin1234
--   staff@shift-high-pc.example       / staff1234
--   technician@shift-high-pc.example  / tech1234
--   customer@example.com              / customer1234
--   somchai@example.com, malee@example.com / customer1234 (sample customers)
-- =====================================================================
USE pc_shop;

-- ---------- Category ----------
INSERT INTO category (category_id, category_name, is_build_component, description) VALUES
  (1, 'CPU', TRUE, 'หน่วยประมวลผลกลาง'),
  (2, 'เมนบอร์ด', TRUE, 'Motherboard'),
  (3, 'การ์ดจอ', TRUE, 'Graphics Card'),
  (4, 'แรม', TRUE, 'Memory'),
  (5, 'SSD/HDD', TRUE, 'พื้นที่จัดเก็บข้อมูล'),
  (6, 'พาวเวอร์ซัพพลาย', TRUE, 'Power Supply'),
  (7, 'เคส', TRUE, 'Case'),
  (8, 'อุปกรณ์เสริม', FALSE, 'เมาส์ คีย์บอร์ด หูฟัง ฯลฯ');

-- ---------- Brand ----------
INSERT INTO brand (brand_id, brand_name, country_origin) VALUES
  (1, 'Intel', 'USA'),
  (2, 'AMD', 'USA'),
  (3, 'ASUS', 'Taiwan'),
  (4, 'MSI', 'Taiwan'),
  (5, 'Corsair', 'USA'),
  (6, 'NVIDIA', 'USA'),
  (7, 'Samsung', 'South Korea'),
  (8, 'Gigabyte', 'Taiwan'),
  (9, 'Kingston', 'USA'),
  (10, 'Western Digital', 'USA'),
  (11, 'Seagate', 'USA'),
  (12, 'Cooler Master', 'Taiwan'),
  (13, 'NZXT', 'USA'),
  (14, 'Logitech', 'Switzerland'),
  (15, 'Razer', 'Singapore'),
  (16, 'G.Skill', 'Taiwan'),
  (17, 'Deepcool', 'China'),
  (18, 'Sapphire', 'Hong Kong'),
  (19, 'Lian Li', 'Taiwan'),
  (20, 'SteelSeries', 'Denmark');

-- ---------- Product (stock = starting stock before the sample sales below) ----------
INSERT INTO product (product_id, product_name, category_id, brand_id, price, stock_quantity, spec_detail, image_url, warranty_months, is_active) VALUES
  (1, 'Intel Core i5-14400F', 1, 1, 6490, 25, 'คอร์ / เธรด: 10 คอร์ / 16 เธรด
ความเร็วบูสต์สูงสุด: 4.7GHz
ความเร็วพื้นฐาน: 2.5GHz
ซ็อกเก็ต: LGA1700
แคช L3: 20MB
TDP: 65W
กราฟิกในตัว: ไม่มี', '/images/products/1.jpg', 36, TRUE),
  (2, 'Intel Core i7-14700K', 1, 1, 13900, 15, 'คอร์ / เธรด: 20 คอร์ (8P+12E) / 28 เธรด
ความเร็วบูสต์สูงสุด: 5.6GHz
ความเร็วพื้นฐาน: 3.4GHz
ซ็อกเก็ต: LGA1700
แคช L3: 33MB
TDP: 125W
กราฟิกในตัว: มี (Intel UHD Graphics 770)', '/images/products/2.jpg', 36, TRUE),
  (3, 'Intel Core i9-14900K', 1, 1, 21900, 8, 'คอร์ / เธรด: 24 คอร์ (8P+16E) / 32 เธรด
ความเร็วบูสต์สูงสุด: 6.0GHz
ความเร็วพื้นฐาน: 3.2GHz
ซ็อกเก็ต: LGA1700
แคช L3: 36MB
TDP: 125W
กราฟิกในตัว: มี (Intel UHD Graphics 770)', '/images/products/3.jpg', 36, TRUE),
  (4, 'AMD Ryzen 5 7600', 1, 2, 7990, 18, 'คอร์ / เธรด: 6 คอร์ / 12 เธรด
ความเร็วบูสต์สูงสุด: 5.1GHz
ความเร็วพื้นฐาน: 3.8GHz
ซ็อกเก็ต: AM5
แคช L3: 32MB
TDP: 65W
กราฟิกในตัว: มี (AMD Radeon Graphics)', '/images/products/4.jpg', 36, TRUE),
  (5, 'AMD Ryzen 7 7800X3D', 1, 2, 13900, 12, 'คอร์ / เธรด: 8 คอร์ / 16 เธรด
ความเร็วบูสต์สูงสุด: 5.0GHz
ความเร็วพื้นฐาน: 4.2GHz
ซ็อกเก็ต: AM5
แคช L3: 96MB (3D V-Cache)
TDP: 120W
กราฟิกในตัว: มี (AMD Radeon Graphics)', '/images/products/5.jpg', 36, TRUE),
  (6, 'AMD Ryzen 9 7950X', 1, 2, 19900, 6, 'คอร์ / เธรด: 16 คอร์ / 32 เธรด
ความเร็วบูสต์สูงสุด: 5.7GHz
ความเร็วพื้นฐาน: 4.5GHz
ซ็อกเก็ต: AM5
แคช L3: 64MB
TDP: 170W
กราฟิกในตัว: มี (AMD Radeon Graphics)', '/images/products/6.jpg', 36, TRUE),
  (7, 'ASUS PRIME B760M-A', 2, 3, 3990, 15, 'ซ็อกเก็ตที่รองรับ: LGA1700 (Intel 12th-14th Gen)
ชิปเซ็ต: Intel B760
แรมที่รองรับ: DDR5 สูงสุด 192GB
ฟอร์มแฟกเตอร์: Micro-ATX
สล็อต M.2: 2 ช่อง
Wi-Fi ในตัว: ไม่มี', '/images/products/7.jpg', 36, TRUE),
  (8, 'ASUS ROG STRIX Z790-E GAMING WIFI', 2, 3, 15900, 5, 'ซ็อกเก็ตที่รองรับ: LGA1700 (Intel 12th-14th Gen)
ชิปเซ็ต: Intel Z790
แรมที่รองรับ: DDR5 สูงสุด 128GB
ฟอร์มแฟกเตอร์: ATX
สล็อต M.2: 4 ช่อง (รองรับ PCIe 5.0)
Wi-Fi ในตัว: มี (Wi-Fi 6E)', '/images/products/8.jpg', 36, TRUE),
  (9, 'Gigabyte B760M AORUS ELITE AX', 2, 8, 5490, 20, 'ซ็อกเก็ตที่รองรับ: LGA1700 (Intel 12th-14th Gen)
ชิปเซ็ต: Intel B760
แรมที่รองรับ: DDR5 สูงสุด 192GB
ฟอร์มแฟกเตอร์: Micro-ATX
สล็อต M.2: 2 ช่อง
Wi-Fi ในตัว: มี (Wi-Fi 6)', '/images/products/9.jpg', 36, TRUE),
  (10, 'MSI PRO B650M-A', 2, 4, 4290, 12, 'ซ็อกเก็ตที่รองรับ: AM5 (AMD Ryzen 7000/8000 Series)
ชิปเซ็ต: AMD B650
แรมที่รองรับ: DDR5 สูงสุด 192GB
ฟอร์มแฟกเตอร์: Micro-ATX
สล็อต M.2: 2 ช่อง
Wi-Fi ในตัว: ไม่มี', '/images/products/10.jpg', 36, TRUE),
  (11, 'MSI MPG X670E CARBON WIFI', 2, 4, 14900, 6, 'ซ็อกเก็ตที่รองรับ: AM5 (AMD Ryzen 7000/8000 Series)
ชิปเซ็ต: AMD X670E
แรมที่รองรับ: DDR5 สูงสุด 128GB
ฟอร์มแฟกเตอร์: ATX
สล็อต M.2: 4 ช่อง (รองรับ PCIe 5.0)
Wi-Fi ในตัว: มี (Wi-Fi 6E)', '/images/products/11.jpg', 36, TRUE),
  (12, 'ASUS TUF GAMING B650-PLUS WIFI', 2, 3, 7290, 14, 'ซ็อกเก็ตที่รองรับ: AM5 (AMD Ryzen 7000/8000 Series)
ชิปเซ็ต: AMD B650
แรมที่รองรับ: DDR5 สูงสุด 128GB
ฟอร์มแฟกเตอร์: ATX
สล็อต M.2: 3 ช่อง
Wi-Fi ในตัว: มี (Wi-Fi 6)', '/images/products/12.jpg', 36, TRUE),
  (13, 'NVIDIA GeForce RTX 4060', 3, 6, 12900, 10, 'หน่วยความจำ: 8GB GDDR6
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 1.4a x3
พลังงานที่ต้องการ: PSU 550W ขึ้นไป
ความยาวการ์ด: 240mm
เหมาะสำหรับ: เล่นเกมความละเอียด 1080p-1440p', '/images/products/13.jpg', 36, TRUE),
  (14, 'ASUS Dual GeForce RTX 4060 Ti OC 8GB', 3, 3, 15900, 9, 'หน่วยความจำ: 8GB GDDR6
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 1.4a x3
พลังงานที่ต้องการ: PSU 550W ขึ้นไป
ความยาวการ์ด: 267mm
เหมาะสำหรับ: เล่นเกมความละเอียด 1440p', '/images/products/14.jpg', 36, TRUE),
  (15, 'Gigabyte GeForce RTX 4070 GAMING OC 12GB', 3, 8, 23900, 7, 'หน่วยความจำ: 12GB GDDR6X
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 1.4a x3
พลังงานที่ต้องการ: PSU 650W ขึ้นไป
ความยาวการ์ด: 276mm
เหมาะสำหรับ: เล่นเกมความละเอียด 1440p-4K', '/images/products/15.jpg', 36, TRUE),
  (16, 'MSI GeForce RTX 4080 SUPER GAMING X SLIM 16GB', 3, 4, 44900, 3, 'หน่วยความจำ: 16GB GDDR6X
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 1.4a x3
พลังงานที่ต้องการ: PSU 750W ขึ้นไป
ความยาวการ์ด: 300mm
เหมาะสำหรับ: เล่นเกมความละเอียด 4K', '/images/products/16.jpg', 36, TRUE),
  (17, 'Sapphire PULSE Radeon RX 7700 XT 12GB', 3, 18, 17900, 8, 'หน่วยความจำ: 12GB GDDR6
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 2.1 x3
พลังงานที่ต้องการ: PSU 650W ขึ้นไป
ความยาวการ์ด: 267mm
เหมาะสำหรับ: เล่นเกมความละเอียด 1440p', '/images/products/17.jpg', 24, TRUE),
  (18, 'ASUS TUF Gaming Radeon RX 7900 XTX OC 24GB', 3, 3, 42900, 4, 'หน่วยความจำ: 24GB GDDR6
พอร์ตเชื่อมต่อจอ: HDMI 2.1, DisplayPort 2.1 x3
พลังงานที่ต้องการ: PSU 850W ขึ้นไป
ความยาวการ์ด: 348mm
เหมาะสำหรับ: เล่นเกมความละเอียด 4K', '/images/products/18.jpg', 36, TRUE),
  (19, 'Corsair Vengeance 16GB DDR5', 4, 5, 1890, 40, 'ความจุ: 16GB (1x16GB)
ความเร็ว: 5600MHz
ประเภทหน่วยความจำ: DDR5
ไฟ RGB: ไม่มี
เหมาะสำหรับ: เมนบอร์ดที่รองรับ DDR5', '/images/products/19.jpg', 999, TRUE),
  (20, 'Kingston FURY Beast 32GB (2x16GB) DDR5', 4, 9, 3290, 30, 'ความจุ: 32GB (2x16GB)
ความเร็ว: 5600MHz
ประเภทหน่วยความจำ: DDR5
ไฟ RGB: ไม่มี
เหมาะสำหรับ: เมนบอร์ดที่รองรับ DDR5 พร้อม Intel XMP', '/images/products/20.jpg', 999, TRUE),
  (21, 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5', 4, 16, 4590, 22, 'ความจุ: 32GB (2x16GB)
ความเร็ว: 6000MHz
ประเภทหน่วยความจำ: DDR5
ไฟ RGB: มี
เหมาะสำหรับ: เครื่องเกมมิ่งที่ต้องการไฟสวยงาม', '/images/products/21.jpg', 999, TRUE),
  (22, 'Corsair Dominator Platinum RGB 64GB (2x32GB) DDR5', 4, 5, 9990, 10, 'ความจุ: 64GB (2x32GB)
ความเร็ว: 6000MHz
ประเภทหน่วยความจำ: DDR5
ไฟ RGB: มี
เหมาะสำหรับ: งานตัดต่อวิดีโอ/เวิร์คสเตชัน', '/images/products/22.jpg', 999, TRUE),
  (23, 'Kingston FURY Renegade 16GB (2x8GB) DDR4', 4, 9, 1690, 35, 'ความจุ: 16GB (2x8GB)
ความเร็ว: 3600MHz
ประเภทหน่วยความจำ: DDR4
ไฟ RGB: ไม่มี
เหมาะสำหรับ: เมนบอร์ดรุ่นเก่าที่รองรับ DDR4', '/images/products/23.jpg', 999, TRUE),
  (24, 'G.Skill Ripjaws V 32GB (2x16GB) DDR4', 4, 16, 2490, 28, 'ความจุ: 32GB (2x16GB)
ความเร็ว: 3200MHz
ประเภทหน่วยความจำ: DDR4
ไฟ RGB: ไม่มี
เหมาะสำหรับ: เมนบอร์ดรุ่นเก่าที่รองรับ DDR4', '/images/products/24.jpg', 999, TRUE),
  (25, 'Samsung 980 1TB NVMe SSD', 5, 7, 2490, 30, 'ความจุ: 1TB
อินเทอร์เฟซ: M.2 NVMe PCIe 3.0
ความเร็วอ่าน: 3500MB/s
ความเร็วเขียน: 3000MB/s
ประเภท: SSD', '/images/products/25.jpg', 60, TRUE),
  (26, 'Samsung 990 PRO 2TB NVMe SSD', 5, 7, 6990, 15, 'ความจุ: 2TB
อินเทอร์เฟซ: M.2 NVMe PCIe 4.0
ความเร็วอ่าน: 7450MB/s
ความเร็วเขียน: 6900MB/s
ประเภท: SSD', '/images/products/26.jpg', 60, TRUE),
  (27, 'Western Digital Black SN850X 1TB NVMe SSD', 5, 10, 3290, 25, 'ความจุ: 1TB
อินเทอร์เฟซ: M.2 NVMe PCIe 4.0
ความเร็วอ่าน: 7300MB/s
ความเร็วเขียน: 6300MB/s
ประเภท: SSD', '/images/products/27.jpg', 60, TRUE),
  (28, 'Kingston NV2 500GB NVMe SSD', 5, 9, 1190, 45, 'ความจุ: 500GB
อินเทอร์เฟซ: M.2 NVMe PCIe 4.0
ความเร็วอ่าน: 3500MB/s
ความเร็วเขียน: 2100MB/s
ประเภท: SSD', '/images/products/28.jpg', 36, TRUE),
  (29, 'Seagate BarraCuda 2TB HDD', 5, 11, 1890, 20, 'ความจุ: 2TB
อินเทอร์เฟซ: SATA III
ความเร็วหมุน: 7200RPM
ขนาด: 3.5 นิ้ว
ประเภท: HDD', '/images/products/29.jpg', 24, TRUE),
  (30, 'Western Digital Blue 4TB HDD', 5, 10, 3490, 16, 'ความจุ: 4TB
อินเทอร์เฟซ: SATA III
ความเร็วหมุน: 5400RPM
ขนาด: 3.5 นิ้ว
ประเภท: HDD', '/images/products/30.jpg', 24, TRUE),
  (31, 'Corsair RM750e 750W', 6, 5, 3290, 14, 'กำลังไฟ: 750W
มาตรฐานประสิทธิภาพ: 80+ Gold
สายไฟ: Full Modular
พัดลมระบายความร้อน: 135mm', '/images/products/31.jpg', 60, TRUE),
  (32, 'Corsair CV650 650W', 6, 5, 1990, 22, 'กำลังไฟ: 650W
มาตรฐานประสิทธิภาพ: 80+ Bronze
สายไฟ: Non-Modular
พัดลมระบายความร้อน: 120mm', '/images/products/32.jpg', 60, TRUE),
  (33, 'MSI MAG A650BN 650W', 6, 4, 1890, 18, 'กำลังไฟ: 650W
มาตรฐานประสิทธิภาพ: 80+ Bronze
สายไฟ: Non-Modular
พัดลมระบายความร้อน: 120mm', '/images/products/33.jpg', 60, TRUE),
  (34, 'Cooler Master MWE Gold 850 V2 850W', 6, 12, 3690, 10, 'กำลังไฟ: 850W
มาตรฐานประสิทธิภาพ: 80+ Gold
สายไฟ: Full Modular
พัดลมระบายความร้อน: 135mm', '/images/products/34.jpg', 60, TRUE),
  (35, 'ASUS ROG Strix 1000W Gold Aura Edition', 6, 3, 6990, 5, 'กำลังไฟ: 1000W
มาตรฐานประสิทธิภาพ: 80+ Gold
สายไฟ: Full Modular
พัดลมระบายความร้อน: 135mm พร้อมไฟ ARGB', '/images/products/35.jpg', 120, TRUE),
  (36, 'Deepcool PK550D 550W', 6, 17, 1390, 25, 'กำลังไฟ: 550W
มาตรฐานประสิทธิภาพ: 80+ Bronze
สายไฟ: Non-Modular
พัดลมระบายความร้อน: 120mm', '/images/products/36.jpg', 36, TRUE),
  (37, 'MSI MAG Forge 100M', 7, 4, 1690, 20, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 6 ตัว
วัสดุหน้ากาก: กระจกด้านข้าง (Tempered Glass)
พอร์ตด้านหน้า: USB 3.0 x2, Audio Jack', '/images/products/37.jpg', 24, TRUE),
  (38, 'Cooler Master MasterBox TD500 Mesh', 7, 12, 2690, 16, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 6 ตัว (มากับพัดลม ARGB 3 ตัว)
วัสดุหน้ากาก: ตะแกรงระบายอากาศ (Mesh)
พอร์ตด้านหน้า: USB 3.0 x2, USB-C x1, Audio Jack', '/images/products/38.jpg', 24, TRUE),
  (39, 'NZXT H510 Flow', 7, 13, 2990, 12, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 4 ตัว
วัสดุหน้ากาก: ตะแกรงระบายอากาศ (Mesh)
พอร์ตด้านหน้า: USB 3.0 x1, USB-C x1, Audio Jack', '/images/products/39.jpg', 24, TRUE),
  (40, 'Lian Li LANCOOL 216', 7, 19, 2890, 10, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 7 ตัว (มากับพัดลม 200mm 2 ตัว)
วัสดุหน้ากาก: ตะแกรงระบายอากาศหน้ากว้างพิเศษ
พอร์ตด้านหน้า: USB 3.0 x2, USB-C x1, Audio Jack', '/images/products/40.jpg', 24, TRUE),
  (41, 'ASUS TUF Gaming GT301', 7, 3, 3290, 8, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 6 ตัว
วัสดุหน้ากาก: กระจกนิรภัย (Tempered Glass)
พอร์ตด้านหน้า: USB 3.0 x2, USB-C x1, Audio Jack', '/images/products/41.jpg', 24, TRUE),
  (42, 'Deepcool CH510 MESH DIGITAL', 7, 17, 2190, 14, 'ขนาดเคส: Mid Tower
รองรับเมนบอร์ด: ATX, Micro-ATX, Mini-ITX
ช่องใส่พัดลม: สูงสุด 6 ตัว
วัสดุหน้ากาก: ตะแกรงระบายอากาศ (Mesh) พร้อมจอ LCD แสดงผล
พอร์ตด้านหน้า: USB 3.0 x2, Audio Jack', '/images/products/42.jpg', 24, TRUE),
  (43, 'Logitech G102 LIGHTSYNC Gaming Mouse', 8, 14, 590, 50, 'เซนเซอร์: 8000 DPI
น้ำหนัก: 85g
การเชื่อมต่อ: สาย USB
ไฟ RGB: มี', '/images/products/43.jpg', 24, TRUE),
  (44, 'Razer DeathAdder V3 Gaming Mouse', 8, 15, 1690, 30, 'เซนเซอร์: 30000 DPI (Focus Pro 30K)
น้ำหนัก: 59g
การเชื่อมต่อ: สาย USB
ไฟ RGB: ไม่มี', '/images/products/44.jpg', 24, TRUE),
  (45, 'Logitech G213 Prodigy Gaming Keyboard', 8, 14, 1590, 25, 'สวิตช์: Membrane (กันน้ำหกใส่)
การเชื่อมต่อ: สาย USB
ไฟ RGB: มี
เค้าโครงปุ่ม: Full-size (ไทย/อังกฤษ)', '/images/products/45.jpg', 24, TRUE),
  (46, 'SteelSeries Apex 3 Gaming Keyboard', 8, 20, 1990, 18, 'สวิตช์: Membrane (กันน้ำระดับ IP32)
การเชื่อมต่อ: สาย USB
ไฟ RGB: มี
เค้าโครงปุ่ม: Full-size (ไทย/อังกฤษ)', '/images/products/46.jpg', 24, TRUE),
  (47, 'Razer Kraken X Gaming Headset', 8, 15, 1290, 20, 'ไดรเวอร์เสียง: 40mm
น้ำหนัก: 250g
การเชื่อมต่อ: 3.5mm Audio Jack
ไมโครโฟน: มี (ปรับทิศทางได้)', '/images/products/47.jpg', 12, TRUE),
  (48, 'ASUS TUF Gaming VG249Q1A 23.8" Monitor', 8, 3, 4990, 12, 'ขนาดจอ: 23.8 นิ้ว
ความละเอียด: Full HD (1920x1080)
รีเฟรชเรท: 165Hz
พาแนล: IPS
เวลาตอบสนอง: 1ms (MPRT)', '/images/products/48.jpg', 36, TRUE);

-- ---------- Employee (one per working role) ----------
INSERT INTO employee (employee_id, full_name, email, password_hash, phone, role, hire_date, is_active) VALUES
  (1, 'Admin Shift-High', 'admin@shift-high-pc.example', '$2b$10$YWruq8dCtF9sjBYGtE8vx.69x9GRhhCHeKeSVgZNS17Q9Nuq934qC', '0800000001', 'admin', '2026-06-01', TRUE),
  (2, 'Staff ทดสอบ', 'staff@shift-high-pc.example', '$2b$10$rGXHB9jOsFqCqC21btrDFO48bEpKb/t0gl99OYhr4/UI.yzTwr2MG', '0800000002', 'staff', '2026-06-01', TRUE),
  (3, 'ช่างทดสอบ', 'technician@shift-high-pc.example', '$2b$10$ZH1VhLA5W2xbQ08pY1zxD.3MBhken4zCffyVSGNkTJ4PkyzHpExbS', '0800000003', 'technician', '2026-06-01', TRUE);

-- ---------- Customer ----------
INSERT INTO customer (customer_id, full_name, email, phone, password_hash, address, created_at) VALUES
  (1, 'ลูกค้าทดสอบ', 'customer@example.com', '0900000001', '$2b$10$oWw5.sI3UZbCE59QqVzleOtWIJHqNtvpAqMjVtH.Mk0Lc/pbRZ.PC', '123 ถนนทดสอบ กรุงเทพฯ', '2026-08-01 09:00:00'),
  (2, 'สมชาย ใจดี', 'somchai@example.com', '0900000002', '$2b$10$RpUPXYYvy8PH1L1gkvgAwe5hz7ECKm63ZYfO9HNwmkICZXd8e7FBu', '45 ถนนนิมมานเหมินท์ เชียงใหม่', '2026-08-15 13:20:00'),
  (3, 'มาลี สุขสันต์', 'malee@example.com', '0900000003', '$2b$10$7i2.AV8iM5LL2MPqH.yE8eEOzMmL2ToEmpmsJVl.N8VN23KgFZ1me', '9 ถนนห้วยแก้ว เชียงใหม่', '2026-09-02 18:45:00');

-- ---------- Sample sales orders (each: order + items + payment, shipment if sent) ----------
INSERT INTO sales_order (order_id, customer_id, order_date, status, total_amount, shipping_address) VALUES (1, 1, '2026-09-10 11:05:00', 'paid', 4370, '123 ถนนทดสอบ กรุงเทพฯ');
INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES (1, 43, 1, 590), (1, 19, 2, 1890);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (1, NULL, 4370, '2026-09-10 11:05:00', 'cod', 'paid');
INSERT INTO shipment (order_id, build_id, employee_id, courier_name, shipped_date, delivered_date, shipping_status) VALUES (1, NULL, 2, '-', '2026-09-11 10:00:00', '2026-09-13 15:30:00', 'delivered');

INSERT INTO sales_order (order_id, customer_id, order_date, status, total_amount, shipping_address) VALUES (2, 2, '2026-09-28 16:40:00', 'paid', 4080, '45 ถนนนิมมานเหมินท์ เชียงใหม่');
INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES (2, 25, 1, 2490), (2, 45, 1, 1590);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (2, NULL, 4080, '2026-09-28 16:40:00', 'bank_transfer', 'paid');
INSERT INTO shipment (order_id, build_id, employee_id, courier_name, shipped_date, delivered_date, shipping_status) VALUES (2, NULL, 2, '-', '2026-09-29 09:10:00', NULL, 'preparing');

INSERT INTO sales_order (order_id, customer_id, order_date, status, total_amount, shipping_address) VALUES (3, 3, '2026-10-05 20:15:00', 'paid', 1290, '9 ถนนห้วยแก้ว เชียงใหม่');
INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES (3, 47, 1, 1290);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (3, NULL, 1290, '2026-10-05 20:15:00', 'bank_transfer', 'paid');

-- ---------- Sample PC builds ----------
-- build 1: being assembled, build 2: delivered, build 3: paid and waiting in the queue
INSERT INTO pc_build (build_id, customer_id, assigned_technician_id, build_name, build_date, status, total_price, shipping_address) VALUES (1, 1, 3, 'สายเกม', '2026-09-20 14:00:00', 'assembling', 34630, '123 ถนนทดสอบ กรุงเทพฯ');
INSERT INTO build_item (build_id, product_id, quantity, unit_price) VALUES (1, 1, 1, 6490), (1, 7, 1, 3990), (1, 13, 1, 12900), (1, 19, 2, 1890), (1, 25, 1, 2490), (1, 31, 1, 3290), (1, 37, 1, 1690);
INSERT INTO build_status_history (build_id, employee_id, status, updated_at, note) VALUES (1, 3, 'assigned', '2026-09-21 09:00:00', 'ช่างรับงาน'), (1, 3, 'assembling', '2026-09-22 10:30:00', NULL);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (NULL, 1, 34630, '2026-09-20 14:00:00', 'cod', 'paid');

INSERT INTO pc_build (build_id, customer_id, assigned_technician_id, build_name, build_date, status, total_price, shipping_address) VALUES (2, 2, 3, 'สายทำงาน', '2026-09-01 10:00:00', 'delivered', 21440, '45 ถนนนิมมานเหมินท์ เชียงใหม่');
INSERT INTO build_item (build_id, product_id, quantity, unit_price) VALUES (2, 4, 1, 7990), (2, 10, 1, 4290), (2, 20, 1, 3290), (2, 28, 1, 1190), (2, 32, 1, 1990), (2, 38, 1, 2690);
INSERT INTO build_status_history (build_id, employee_id, status, updated_at, note) VALUES (2, 3, 'assigned', '2026-09-02 09:00:00', 'ช่างรับงาน'), (2, 3, 'assembling', '2026-09-02 13:00:00', NULL), (2, 3, 'completed', '2026-09-04 17:00:00', NULL), (2, 2, 'shipped', '2026-09-05 10:00:00', NULL), (2, 2, 'delivered', '2026-09-07 14:00:00', NULL);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (NULL, 2, 21440, '2026-09-01 10:00:00', 'bank_transfer', 'paid');
INSERT INTO shipment (order_id, build_id, employee_id, courier_name, shipped_date, delivered_date, shipping_status) VALUES (NULL, 2, 2, '-', '2026-09-05 10:00:00', '2026-09-07 14:00:00', 'delivered');

INSERT INTO pc_build (build_id, customer_id, assigned_technician_id, build_name, build_date, status, total_price, shipping_address) VALUES (3, 3, NULL, 'สายสตรีม', '2026-10-08 19:30:00', 'paid', 63250, '9 ถนนห้วยแก้ว เชียงใหม่');
INSERT INTO build_item (build_id, product_id, quantity, unit_price) VALUES (3, 5, 1, 13900), (3, 12, 1, 7290), (3, 15, 1, 23900), (3, 21, 1, 4590), (3, 26, 1, 6990), (3, 34, 1, 3690), (3, 40, 1, 2890);
INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (NULL, 3, 63250, '2026-10-08 19:30:00', 'bank_transfer', 'paid');

-- ---------- Stock deducted by the sample sales above (checkout does this in the app) ----------
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 1;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 4;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 5;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 7;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 10;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 12;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 13;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 15;
UPDATE product SET stock_quantity = stock_quantity - 4 WHERE product_id = 19;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 20;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 21;
UPDATE product SET stock_quantity = stock_quantity - 2 WHERE product_id = 25;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 26;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 28;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 31;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 32;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 34;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 37;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 38;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 40;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 43;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 45;
UPDATE product SET stock_quantity = stock_quantity - 1 WHERE product_id = 47;

-- ---------- Sample stock adjustments ----------
INSERT INTO stock_adjustment (product_id, employee_id, quantity_changed, adjustment_type, note, adjusted_at) VALUES (16, 2, 5, 'restock', 'รับของล็อตใหม่', '2026-09-25 09:30:00');
UPDATE product SET stock_quantity = stock_quantity + 5 WHERE product_id = 16;
INSERT INTO stock_adjustment (product_id, employee_id, quantity_changed, adjustment_type, note, adjusted_at) VALUES (48, 1, -2, 'correction', 'นับของจริงแล้วขาด 2 ชิ้น', '2026-10-01 18:00:00');
UPDATE product SET stock_quantity = stock_quantity - 2 WHERE product_id = 48;



-- =====================================================================
-- Shift-High PC  —  14 queries (Q1–Q14): Q1–Q10 SELECT, Q11–Q14 UPDATE / DELETE / INSERT
-- Uses ONLY what was taught in Lectures 8–10 and Labs 8–9:
--   SELECT, WHERE (AND/OR, BETWEEN, IN, LIKE, IS NULL), aliases, calculated columns,
--   ORDER BY, LIMIT, COUNT/SUM/MIN/MAX/AVG/ROUND, GROUP BY, HAVING,
--   INNER JOIN (2–4 tables), LEFT JOIN + IS NULL, compound join conditions.
-- Run after schema.sql + seed.sql (both are included above in this file).
-- =====================================================================
USE pc_shop;

-- ---------------------------------------------------------------------
-- Q1. Customer searching the shop
-- "Show RTX graphics cards that cost between 10,000 and 30,000 baht, cheapest first."
-- Taught in: Lecture 8 — WHERE with LIKE, BETWEEN, AND; ORDER BY
-- ---------------------------------------------------------------------
SELECT p.product_name, p.price, p.stock_quantity
FROM product p
WHERE p.product_name LIKE '%RTX%'
  AND p.price BETWEEN 10000 AND 30000
  AND p.is_active = TRUE
ORDER BY p.price ASC;

-- ---------------------------------------------------------------------
-- Q2. Staff restocking
-- "Which products on sale have 5 or fewer left? Show brand and category."
-- Taught in: Lecture 9 — joining three tables; join + WHERE
-- ---------------------------------------------------------------------
SELECT p.product_name, b.brand_name, c.category_name, p.stock_quantity
FROM product p
JOIN brand b    ON b.brand_id    = p.brand_id
JOIN category c ON c.category_id = p.category_id
WHERE p.is_active = TRUE
  AND p.stock_quantity <= 5
ORDER BY p.stock_quantity ASC, p.product_name;

-- ---------------------------------------------------------------------
-- Q3. Owner reviewing the catalogue
-- "For each category: how many products, cheapest, most expensive, and average price?
--  Only categories with at least 5 products."
-- Taught in: Lecture 8 — aggregate functions, ROUND, GROUP BY, HAVING
-- ---------------------------------------------------------------------
SELECT c.category_name,
       COUNT(*)                AS products,
       MIN(p.price)            AS cheapest,
       MAX(p.price)            AS most_expensive,
       ROUND(AVG(p.price), 2)  AS average_price
FROM product p
JOIN category c ON c.category_id = p.category_id
WHERE p.is_active = TRUE
GROUP BY c.category_id, c.category_name
HAVING COUNT(*) >= 5
ORDER BY average_price DESC;

-- ---------------------------------------------------------------------
-- Q4. Owner
-- "What are the top 5 best-selling products from paid orders, and how much did each earn?"
-- Taught in: Lecture 9 / Lab 9 task 1.4 — join + GROUP BY, calculated SUM, ORDER BY … LIMIT
-- ---------------------------------------------------------------------
SELECT p.product_name,
       SUM(oi.quantity)                 AS units_sold,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_item oi
JOIN sales_order o ON o.order_id   = oi.order_id
JOIN product p     ON p.product_id = oi.product_id
WHERE o.status = 'paid'
GROUP BY p.product_id, p.product_name
ORDER BY units_sold DESC, revenue DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- Q5. Owner deciding what to stock more of
-- "Which product category brings in the most revenue from paid orders?"
-- Taught in: Lecture 9 — joining four tables; join + GROUP BY
-- ---------------------------------------------------------------------
SELECT c.category_name,
       SUM(oi.quantity)                 AS units_sold,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_item oi
JOIN sales_order o ON o.order_id    = oi.order_id
JOIN product p     ON p.product_id  = oi.product_id
JOIN category c    ON c.category_id = p.category_id
WHERE o.status = 'paid'
GROUP BY c.category_id, c.category_name
ORDER BY revenue DESC;

-- ---------------------------------------------------------------------
-- Q6. Marketing
-- "Which customers have spent 3,000 baht or more on paid orders? Biggest spenders first."
-- Taught in: Lecture 8 — WHERE + GROUP BY + HAVING together; Lecture 9 — join
-- ---------------------------------------------------------------------
SELECT cu.full_name, cu.email,
       COUNT(o.order_id)   AS paid_orders,
       SUM(o.total_amount) AS total_spent
FROM customer cu
JOIN sales_order o ON o.customer_id = cu.customer_id
WHERE o.status = 'paid'
GROUP BY cu.customer_id, cu.full_name, cu.email
HAVING SUM(o.total_amount) >= 3000
ORDER BY total_spent DESC;

-- ---------------------------------------------------------------------
-- Q7. Technician queue
-- "Which paid PC builds have no technician yet? Oldest first, with the customer's name."
-- Taught in: Lecture 8 — IS NULL (never = NULL); Lecture 9 — join + WHERE
-- ---------------------------------------------------------------------
SELECT b.build_id, b.build_name, cu.full_name AS customer,
       b.build_date, b.total_price
FROM pc_build b
JOIN customer cu ON cu.customer_id = b.customer_id
WHERE b.status = 'paid'
  AND b.assigned_technician_id IS NULL
ORDER BY b.build_date ASC;

-- ---------------------------------------------------------------------
-- Q8. Admin checking workload
-- "How many builds is each technician working on right now — including technicians with none?"
-- Taught in: Lecture 9 — LEFT JOIN keeps unmatched rows; Lecture 10 — compound join condition (AND in ON)
-- Note: the status condition must be in ON, not WHERE. In WHERE it would remove the
--       technicians with no builds and turn the LEFT JOIN back into an inner join.
-- ---------------------------------------------------------------------
SELECT e.full_name AS technician,
       COUNT(b.build_id) AS active_builds
FROM employee e
LEFT JOIN pc_build b
       ON b.assigned_technician_id = e.employee_id
      AND b.status IN ('assigned', 'assembling')
WHERE e.role = 'technician'
  AND e.is_active = TRUE
GROUP BY e.employee_id, e.full_name
ORDER BY active_builds DESC;

-- ---------------------------------------------------------------------
-- Q9. Owner looking for dead stock
-- "Which products on sale have never been sold — not in any order and not in any PC build?"
-- Taught in: Lecture 9 — LEFT JOIN + IS NULL ("which … have no …?");
--            Lecture 10 — joining three tables with left outer joins
-- ---------------------------------------------------------------------
SELECT p.product_id, p.product_name, p.price, p.stock_quantity
FROM product p
LEFT JOIN order_item oi ON oi.product_id = p.product_id
LEFT JOIN build_item bi ON bi.product_id = p.product_id
WHERE p.is_active = TRUE
  AND oi.product_id IS NULL
  AND bi.product_id IS NULL
ORDER BY p.price DESC;

-- ---------------------------------------------------------------------
-- Q10. Shipping desk
-- "Which paid orders still have no shipment created? Show customer and address."
-- Taught in: Lecture 9 — LEFT JOIN + IS NULL combined with an inner join
-- ---------------------------------------------------------------------
SELECT o.order_id, cu.full_name AS customer, o.order_date, o.shipping_address
FROM sales_order o
JOIN customer cu     ON cu.customer_id = o.customer_id
LEFT JOIN shipment s ON s.order_id     = o.order_id
WHERE o.status = 'paid'
  AND s.shipment_id IS NULL
ORDER BY o.order_date;


-- =====================================================================
-- Q11–Q14: UPDATE / DELETE / INSERT examples that show constraints working
-- Lecture 8's term-project checklist asks for these in report section 7.
-- Each one is commented with what MySQL should answer.
-- =====================================================================

-- Q11. UPDATE many rows: 5% price rise on every Corsair product (Lecture 8, "UPDATE many rows")
-- Check first, as the lecture says:
SELECT product_id, product_name, price FROM product WHERE brand_id = 5;
-- Remove the -- below to run it. It really changes the prices in the database;
-- to go back to the seed prices, run DROP DATABASE pc_shop; and this file again.
-- UPDATE product SET price = ROUND(price * 1.05, 2) WHERE brand_id = 5;

-- Q12. CHECK constraint stops bad data
-- ✗ expected error 3819 / 4025: Check constraint 'Product_CHK' is violated
-- UPDATE product SET stock_quantity = -1 WHERE product_id = 1;

-- Q13. ON DELETE RESTRICT protects history (default for our foreign keys)
-- ✗ expected error 1451: Cannot delete or update a parent row … Product_FK1
-- DELETE FROM category WHERE category_id = 1;

-- Q14. Exclusive-or CHECK: a payment must belong to an order OR a build
-- ✗ expected error: Check constraint 'Payment_Arc_CHK' is violated
-- INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (NULL, NULL, 100, '2026-10-13 10:00:00', 'cod', 'paid');
