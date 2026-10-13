// ทดสอบชั้นฐานข้อมูล (services) กับ MySQL จริงแบบอัตโนมัติ 60+ กรณี
// วิธีรัน: รัน database/schema.sql + seed.sql ใหม่ก่อน แล้วสั่ง  npm run test:db
// คำเตือน: สคริปต์นี้เขียนข้อมูลทดสอบลงฐานข้อมูล รันเสร็จแล้วให้รัน schema.sql + seed.sql ใหม่อีกครั้ง
import { pool, query, queryOne, checkDatabase } from '../src/config/db';
import { refreshLookups, categoryNameById, brandNameById } from '../src/data/lookups';
import * as customerAuth from '../src/services/customerAuthService';
import * as customerSvc from '../src/services/customerService';
import * as employeeAuth from '../src/services/employeeAuthService';
import * as employeeSvc from '../src/services/employeeService';
import * as productSvc from '../src/services/productService';
import * as stockSvc from '../src/services/stockService';
import * as cartSvc from '../src/services/cartService';
import * as buildSvc from '../src/services/buildService';
import * as orderSvc from '../src/services/orderService';
import * as shipmentSvc from '../src/services/shipmentService';
import * as staffSvc from '../src/services/staffService';

let passed = 0;
let failed = 0;
function ok(cond: unknown, msg: string) {
  if (cond) {
    passed++;
    console.log('  ✓', msg);
  } else {
    failed++;
    console.log('  ✗ FAIL:', msg);
  }
}
async function throws(fn: () => Promise<unknown>, msg: string, match?: RegExp) {
  try {
    await fn();
    ok(false, `${msg} (expected an error)`);
  } catch (e: any) {
    ok(!match || match.test(e.message), `${msg} -> "${e.message}"`);
  }
}
const stock = async (id: number) =>
  (await queryOne<{ s: number }>('SELECT stock_quantity AS s FROM product WHERE product_id = ?', [id]))!.s;

async function main() {
  console.log('setup');
  await checkDatabase();
  await refreshLookups();
  ok(categoryNameById(1) === 'CPU' && brandNameById(1) === 'Intel', 'lookups cache category/brand names');

  console.log('customer auth');
  const c = await customerAuth.registerCustomer({ full_name: 'ทดสอบ ระบบ', email: 'itest@example.com', phone: '081-234-5678', password: 'pw123456' });
  ok(c.customer_id > 3 && c.phone === '0812345678', `register customer id=${c.customer_id}, phone normalized`);
  await throws(() => customerAuth.registerCustomer({ full_name: 'ทดสอบ สอง', email: 'ITEST@example.com', password: 'x' }), 'duplicate email (case-insensitive) rejected', /ถูกใช้/);
  ok((await customerAuth.loginCustomer('itest@example.com', 'pw123456')).customer_id === c.customer_id, 'login with correct password');
  await throws(() => customerAuth.loginCustomer('itest@example.com', 'wrong'), 'wrong password rejected', /ไม่ถูกต้อง/);
  await customerSvc.updateProfile(c.customer_id, { full_name: 'ทดสอบ แก้ไข', address: 'เชียงใหม่' });
  const c2 = await customerSvc.getCustomerById(c.customer_id);
  ok(c2!.full_name === 'ทดสอบ แก้ไข' && c2!.address === 'เชียงใหม่' && c2!.created_at instanceof Date, 'update profile + created_at is a Date');
  await customerSvc.changePassword(c.customer_id, 'pw123456', 'newpass1');
  ok(!!(await customerAuth.loginCustomer('itest@example.com', 'newpass1')), 'change password works');

  console.log('products');
  const active = await productSvc.listProducts();
  ok(active.length === 48 && typeof active[0].price === 'number' && active[0].is_active === true, `48 active products, price is number, is_active boolean`);
  ok((await productSvc.listProducts({ category_id: 1 })).length === 6, 'filter by category');
  ok((await productSvc.listBuildCategories()).length === 7, '7 build categories');
  const np = await productSvc.createProduct({ product_name: 'Test Fan', category_id: 8, brand_id: 12, price: 199, stock_quantity: 3 } as any);
  ok(np.product_id === 49 && np.is_active === true, 'create product');
  await throws(() => productSvc.createProduct({ product_name: 'Bad', category_id: 8, brand_id: 12, price: 0, stock_quantity: 1 } as any), 'price 0 rejected', /ราคา/);
  await throws(() => productSvc.createProduct({ product_name: 'Bad', category_id: 99, brand_id: 12, price: 5, stock_quantity: 1 } as any), 'unknown category rejected', /หมวดหมู่/);
  await productSvc.updateProduct(49, { price: 249, spec_detail: 'ขนาด: 120mm' });
  ok((await productSvc.getProductById(49))!.price === 249, 'update product price');
  await productSvc.setProductActive(49, false);
  ok((await productSvc.listProducts()).length === 48 && (await productSvc.listProductsForAdmin()).length === 49, 'soft delete hides from shop, admin still sees');

  console.log('stock adjustments');
  const s16 = await stock(16);
  await stockSvc.adjustStock(16, 2, 4, 'restock', 'ทดสอบ');
  ok((await stock(16)) === s16 + 4, 'restock adds');
  await stockSvc.adjustStock(16, 1, 2, 'correction');
  const lastAdj = await queryOne<any>('SELECT * FROM stock_adjustment ORDER BY adjustment_id DESC LIMIT 1');
  ok((await stock(16)) === 2 && lastAdj.quantity_changed === 2 - (s16 + 4) && lastAdj.employee_id === 1, 'correction sets exact value and logs the difference');

  console.log('cart + draft build + checkout');
  const cid = c.customer_id;
  await cartSvc.addProductToCart(cid, 43, 2);
  await cartSvc.addProductToCart(cid, 43, 1);
  await throws(() => cartSvc.addProductToCart(cid, 49 + 0, 99), 'adding more than stock rejected', /มีไม่พอ/);
  await cartSvc.updateProductQuantity(cid, 43, 1000);
  let view = await cartSvc.viewCart(cid);
  ok(view.length === 1 && view[0].quantity === (await stock(43)) && view[0].unit_price === 590, 'quantity clamped to stock in cart view');
  await cartSvc.updateProductQuantity(cid, 43, 2);
  const build = await buildSvc.createDraftBuild(cid, 'ทดสอบชุด', [
    { product_id: 1, quantity: 1 },
    { product_id: 7, quantity: 1 },
    { product_id: 19, quantity: 1 },
    { product_id: 19, quantity: 1 },
  ]);
  ok(build.status === 'draft' && build.total_price === 6490 + 3990 + 1890 * 2 && build.build_date instanceof Date, `draft build total ${build.total_price}, duplicate parts merged`);
  await throws(() => buildSvc.createDraftBuild(cid, 'ว่าง', []), 'build with no parts rejected (BR7)', /อย่างน้อย/);
  await cartSvc.addBuildToCart(cid, build.build_id);
  view = await cartSvc.viewCart(cid);
  ok(view.length === 2 && view[1].unit_price === build.total_price, 'cart shows build line');

  // price change after the build was created must not change its saved price (BR23)
  await productSvc.updateProduct(19, { price: 2190 });
  const bitems = await buildSvc.getBuildItems(build.build_id);
  ok(bitems.find((i) => i.product_id === 19)!.unit_price === 1890 && bitems.find((i) => i.product_id === 19)!.quantity === 2, 'build_item keeps old unit_price after product price change (BR23)');

  const before = { p43: await stock(43), p1: await stock(1), p19: await stock(19) };
  const res = await cartSvc.checkoutCart(cid, '99 ถนนทดสอบ', 'bank_transfer');
  ok(!!res.order_id && res.build_ids[0] === build.build_id, `checkout created order ${res.order_id} and paid build ${build.build_id}`);
  ok((await stock(43)) === before.p43 - 2 && (await stock(1)) === before.p1 - 1 && (await stock(19)) === before.p19 - 2, 'stock deducted for items and build parts');
  const order = await orderSvc.getOrderById(res.order_id!);
  ok(order!.status === 'paid' && order!.total_amount === 1180 && order!.shipping_status === null, 'order paid, total 1180, no shipment yet');
  ok((await orderSvc.getPaymentMethodForOrder(res.order_id!)) === 'bank_transfer', 'order payment recorded');
  const pays = await query<any>('SELECT * FROM payment WHERE order_id = ? OR build_id = ?', [res.order_id, build.build_id]);
  ok(pays.length === 2, 'two separate payments for mixed cart (BR18)');
  ok((await cartSvc.viewCart(cid)).length === 0, 'cart emptied after checkout');
  ok((await buildSvc.getBuildById(build.build_id))!.status === 'paid', 'build is now paid');
  const oi = await orderSvc.getOrderItems(res.order_id!);
  ok(oi.length === 1 && oi[0].product_name.includes('Logitech') && oi[0].unit_price === 590, 'order items with product name and locked price');

  console.log('checkout rollback');
  await cartSvc.addProductToCart(cid, 45, 1);
  const s45 = await stock(45);
  await query('UPDATE product SET stock_quantity = 0 WHERE product_id = 45');
  const ordersBefore = (await query('SELECT order_id FROM sales_order')).length;
  await throws(() => cartSvc.checkoutCart(cid, 'x', 'cod'), 'checkout fails when stock ran out', /มีไม่พอ/);
  ok((await query('SELECT order_id FROM sales_order')).length === ordersBefore && (await cartSvc.viewCart(cid)).length === 1, 'nothing written, cart kept');
  await query('UPDATE product SET stock_quantity = ? WHERE product_id = 45', [s45]);
  await cartSvc.removeFromCart(cid, 'product', 45);
  await throws(() => cartSvc.checkoutCart(cid, 'x', 'cod'), 'empty cart rejected', /ตะกร้าว่าง/);
  await cartSvc.addBuildToCart(cid, build.build_id);
  await throws(() => cartSvc.checkoutCart(cid, 'x', 'cod'), 'cannot pay for an already-paid build twice', /ไม่พบชุดคอม/);
  await cartSvc.removeFromCart(cid, 'build', build.build_id);

  console.log('technician flow');
  const queue = await buildSvc.listQueueForTechnician();
  ok(queue.some((b) => b.build_id === build.build_id) && queue.some((b) => b.build_id === 3), 'queue has new build and seeded build 3');
  await buildSvc.assignTechnician(build.build_id, 3);
  await throws(() => buildSvc.assignTechnician(build.build_id, 3), 'second assign rejected (BR11)', /ถูกรับไปแล้ว/);
  await buildSvc.updateBuildStatus(build.build_id, 3, 'assembling');
  await buildSvc.updateBuildStatus(build.build_id, 3, 'completed');
  await buildSvc.updateBuildStatus(build.build_id, 2, 'shipped');
  let bship = await shipmentSvc.getShipmentForBuild(build.build_id);
  ok(bship?.shipping_status === 'shipped' && bship.order_id === null && bship.employee_id === 2, 'shipment created for build when shipped');
  await buildSvc.updateBuildStatus(build.build_id, 2, 'delivered');
  bship = await shipmentSvc.getShipmentForBuild(build.build_id);
  ok(bship?.shipping_status === 'delivered' && bship.delivered_date instanceof Date, 'build delivered, same single shipment updated (BR17)');
  const hist = await buildSvc.getBuildHistory(build.build_id);
  ok(hist.map((h) => h.status).join(',') === 'assigned,assembling,completed,shipped,delivered', 'history has one row per status change');
  ok((await buildSvc.listBuildsByTechnician(3)).some((b) => b.build_id === build.build_id), 'technician history lists the build');
  ok((await buildSvc.getBuildCustomerContact(build.build_id))!.email === 'itest@example.com', 'customer contact for technician');

  console.log('cancel returns reserved stock');
  const s5 = await stock(5);
  await buildSvc.assignTechnician(3, 3);
  await buildSvc.updateBuildStatus(3, 3, 'cancelled', 'อะไหล่ไม่เข้ากัน');
  ok((await stock(5)) === s5 + 1 && (await buildSvc.getBuildById(3))!.status === 'cancelled', 'cancelled paid build returns parts to stock');
  const draftX = await buildSvc.createDraftBuild(1, 'ร่างทดสอบยกเลิก', [{ product_id: 2, quantity: 1 }]);
  ok(draftX.status === 'draft', 'new draft build is draft');
  const s2 = await stock(2);
  await buildSvc.updateBuildStatus(draftX.build_id, 2, 'cancelled');
  ok((await stock(2)) === s2, 'cancelling a draft does not add stock (it was never deducted)');

  console.log('customer views');
  const myBuilds = await buildSvc.listBuildsByCustomer(1);
  ok(myBuilds.every((b) => b.status !== 'draft') && myBuilds.length === 2, 'customer build list hides drafts');
  const d2 = await buildSvc.createDraftBuild(1, 'ร่างใหม่', [{ product_id: 3, quantity: 1 }]);
  const drafts = await buildSvc.listDraftBuildsNotInCart(1, new Set());
  ok(drafts.some((b) => b.build_id === d2.build_id), 'draft not in cart is listed');
  const myOrders = await orderSvc.listOrdersByCustomer(1);
  ok(myOrders.length === 1 && myOrders[0].shipping_status === 'delivered', 'seed customer sees delivered order');

  console.log('staff');
  await shipmentSvc.setOrderShippingStatus(res.order_id!, 2, 'preparing');
  await shipmentSvc.setOrderShippingStatus(res.order_id!, 2, 'shipped');
  await shipmentSvc.setOrderShippingStatus(res.order_id!, 2, 'delivered');
  const osh = await shipmentSvc.getShipmentForOrder(res.order_id!);
  ok(osh!.shipping_status === 'delivered' && !!osh!.delivered_date, 'order shipment goes preparing → shipped → delivered');
  ok((await query('SELECT * FROM shipment WHERE order_id = ?', [res.order_id])).length === 1, 'still exactly one shipment for that order');
  const allOrders = await staffSvc.listAllOrders();
  const so = allOrders.find((o) => o.order_id === res.order_id)!;
  ok(allOrders.length === 4 && so.items.length === 1 && so.customer_name === 'ทดสอบ แก้ไข' && so.history.length === 3, 'staff order list with items, customer, history');
  const allBuilds = await staffSvc.listAllBuilds();
  ok(allBuilds.length === 5 && allBuilds.find((b) => b.build_id === 2)!.history.length === 5, 'staff build list (no drafts) with history');
  await staffSvc.updateOrderStatus(3, 2, 'cancelled');
  ok((await orderSvc.getOrderById(3))!.status === 'cancelled', 'staff can change order status');
  const report = await staffSvc.getSalesReport();
  console.log('    report:', JSON.stringify(report));
  ok(typeof report.total_revenue === 'number' && report.total_revenue === 79960 && report.total_orders === 3 + 3 && report.best_selling_products.length === 5, 'sales report numbers');

  console.log('employees');
  const e = await employeeAuth.registerEmployee({ full_name: 'พนักงาน ใหม่', email: 'new@shift-high-pc.example', password: 'pw' });
  ok(e.role === 'unassigned' && e.hire_date === null && e.is_active === true, 'new employee is unassigned');
  await throws(() => employeeAuth.loginEmployee('new@shift-high-pc.example', 'pw'), 'unassigned cannot log in', /รอการอนุมัติ/);
  await employeeSvc.approveEmployee(e.employee_id, 'technician');
  const e2 = await employeeSvc.getEmployeeById(e.employee_id);
  ok(e2!.role === 'technician' && e2!.hire_date instanceof Date, 'approve sets role and hire_date');
  ok(!!(await employeeAuth.loginEmployee('new@shift-high-pc.example', 'pw')), 'approved employee logs in');
  await employeeSvc.disableAccount(e.employee_id);
  await throws(() => employeeAuth.loginEmployee('new@shift-high-pc.example', 'pw'), 'disabled cannot log in', /ปิดการใช้งาน/);
  await employeeSvc.enableAccount(e.employee_id);
  await employeeSvc.enableAccount(e.employee_id); // unchanged row must not throw "not found"
  await employeeSvc.changeRole(e.employee_id, 'staff');
  await employeeSvc.updateOwnProfile(e.employee_id, { full_name: 'พนักงาน แก้ชื่อ', phone: '0899999999' });
  await employeeSvc.changePassword(e.employee_id, 'pw', 'pw2');
  ok(!!(await employeeAuth.loginEmployee('new@shift-high-pc.example', 'pw2')), 'profile + password change');
  ok((await employeeSvc.listEmployees()).length === 4, 'list employees');
  await throws(() => employeeSvc.changeRole(999, 'staff'), 'unknown employee -> not found', /ไม่พบ/);

  console.log('concurrent checkout of the last unit');
  await query('UPDATE product SET stock_quantity = 1 WHERE product_id = 46');
  await cartSvc.addProductToCart(2, 46, 1);
  await cartSvc.addProductToCart(3, 46, 1);
  const results = await Promise.allSettled([cartSvc.checkoutCart(2, 'a', 'cod'), cartSvc.checkoutCart(3, 'b', 'cod')]);
  const wins = results.filter((r) => r.status === 'fulfilled').length;
  console.log('    results:', results.map((r) => (r.status === 'fulfilled' ? 'ok' : (r as any).reason.message)).join(' | '));
  ok(wins === 1 && (await stock(46)) === 0, 'only one of two simultaneous buyers gets the last unit, stock never negative');

  console.log('reserved stock view');
  const v = await query<any>(
    `SELECT p.product_id, p.stock_quantity AS available, SUM(bi.quantity) AS reserved
     FROM product p
     JOIN build_item bi ON bi.product_id = p.product_id
     JOIN pc_build b ON b.build_id = bi.build_id
     WHERE b.status IN ('paid', 'assigned', 'assembling', 'completed')
     GROUP BY p.product_id, p.stock_quantity`
  );
  ok(v.length > 0 && v.every((r) => Number(r.reserved) >= 1), `reserved stock query finds reserved parts (${v.length} products)`);

  console.log(`\n${passed} passed, ${failed} failed`);
  await pool.end();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => {
  console.error('CRASH', e);
  await pool.end();
  process.exit(1);
});
