-- =====================================================================
-- Shift-High PC: queries only (Q1-Q14)
-- Run this file any time to see the query results again.
-- It does NOT drop or create anything, so data added on the website
-- (new stock, orders, accounts) stays in the database.
--
-- Run pc_shop_full.sql (or schema.sql + seed.sql) once first to create pc_shop.
-- Same queries as the end of pc_shop_full.sql.
-- =====================================================================

-- =====================================================================
-- Shift-High PC  —  14 queries (Q1–Q14): Q1–Q10 SELECT, Q11–Q14 UPDATE / DELETE / INSERT
-- Uses ONLY what was taught in Lectures 8–10 and Labs 8–9:
--   SELECT, WHERE (AND/OR, BETWEEN, IN, LIKE, IS NULL), aliases, calculated columns,
--   ORDER BY, LIMIT, COUNT/SUM/MIN/MAX/AVG/ROUND, GROUP BY, HAVING,
--   INNER JOIN (2–4 tables), LEFT JOIN + IS NULL, compound join conditions.
-- Run after the database pc_shop exists (pc_shop_full.sql, or schema.sql + seed.sql).
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
