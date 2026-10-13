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
