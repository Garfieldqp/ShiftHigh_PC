import { getCart, setCart, saveCarts } from '../data/cartStore';
import { Product } from '../models/Product';
import { PCBuild } from '../models/PCBuild';
import { BuildItem } from '../models/BuildItem';
import { query, queryOne, execute, withTransaction } from '../config/db';
import { assertExactlyOneLink } from '../utils/validate';

// ตะกร้าสินค้า + checkout - หัวใจของ flow การซื้อทั้งหมด
// ตะกร้าเก็บแค่ "อ้างอิง" (type: 'product'|'build' + ref_id) ไม่ได้ก็อปปี้ข้อมูลสินค้ามาเก็บซ้ำ (ดู data/cartStore.ts)
// พอกด checkout ถึงจะสร้าง sales_order / เปลี่ยน pc_build + payment จริงใน MySQL ภายใน transaction เดียว
// (START TRANSACTION ... COMMIT หรือ ROLLBACK ถ้ามีขั้นไหนพัง - ดู withTransaction ใน config/db.ts)
//
// Flow checkout ตะกร้าผสม (สินค้าปกติ + ชุดคอมที่จัดสเปคไว้):
//   1. ตรวจตะกร้า แยกเป็น 2 ส่วน
//      - มีสินค้าเดี่ยว → สร้าง sales_order + order_item
//      - มีชุดคอม       → pc_build (สร้างไว้แล้วตอนกด "ใส่ตะกร้า" ที่หน้าจัดสเปค) แค่เปลี่ยนสถานะ draft → paid
//   2. ทั้งสองส่วนใช้ที่อยู่จัดส่งเดียวกัน จ่ายเงินหน้าเดียวกัน
//   3. สร้าง payment แยกตามรายการ (order_id หรือ build_id อย่างใดอย่างหนึ่ง - BR18, BR20)

export async function addProductToCart(customerId: number, productId: number, quantity: number): Promise<void> {
  const product = await queryOne<Product>('SELECT * FROM product WHERE product_id = ?', [productId]);
  if (!product) throw new Error('ไม่พบสินค้านี้');
  if (quantity < 1) throw new Error('จำนวนต้องมากกว่า 0');

  const cart = getCart(customerId);
  const existing = cart.find((line) => line.type === 'product' && line.ref_id === productId);

  // เช็คกับสต็อกจริง นับรวมจำนวนที่มีอยู่ในตะกร้าแล้วด้วย กันกดเพิ่มทีละนิดจนเกินสต็อกทั้งที่แต่ละครั้งดูเหมือนไม่เกิน
  const currentQtyInCart = existing?.quantity ?? 0;
  if (currentQtyInCart + quantity > product.stock_quantity) {
    throw new Error(`สินค้า "${product.product_name}" มีไม่พอ (เหลือ ${product.stock_quantity})`);
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ type: 'product', ref_id: productId, quantity });
  }
  saveCarts();
}

export async function addBuildToCart(customerId: number, buildId: number): Promise<void> {
  const build = await queryOne('SELECT build_id FROM pc_build WHERE build_id = ? AND customer_id = ?', [
    buildId,
    customerId,
  ]);
  if (!build) throw new Error('ไม่พบชุดคอมนี้');

  const cart = getCart(customerId);
  if (!cart.some((line) => line.type === 'build' && line.ref_id === buildId)) {
    cart.push({ type: 'build', ref_id: buildId, quantity: 1 });
  }
  saveCarts();
}

export async function removeFromCart(customerId: number, type: 'product' | 'build', refId: number): Promise<void> {
  setCart(
    customerId,
    getCart(customerId).filter((line) => !(line.type === type && line.ref_id === refId))
  );
}

// แก้จำนวนสินค้าที่มีอยู่แล้วในตะกร้าโดยตรง (เฉพาะสินค้าเดี่ยว - ชุดจัดสเปคมีจำนวนคงที่ 1 เสมอ)
// กรอกเกินสต็อกไม่ได้ (ตัดให้เหลือเท่าที่มีจริง), กรอก 0 หรือติดลบ = เอาออกจากตะกร้าเลย
export async function updateProductQuantity(customerId: number, productId: number, quantity: number): Promise<void> {
  const cart = getCart(customerId);
  const line = cart.find((l) => l.type === 'product' && l.ref_id === productId);
  if (!line) return;

  const product = await queryOne<{ stock_quantity: number }>(
    'SELECT stock_quantity FROM product WHERE product_id = ?',
    [productId]
  );
  const clamped = product ? Math.min(quantity, product.stock_quantity) : quantity;

  // ตัดให้ไม่เกินสต็อกจริงแล้วอาจเหลือ < 1 ได้ (เช่น สต็อกหมดพอดีระหว่างที่ของอยู่ในตะกร้า) - เอาออกจากตะกร้าไปเลย
  // กันไม่ให้ค้างเป็นแถวจำนวน 0 ที่กดปุ่ม +/- ต่อไม่ได้อีก
  if (clamped < 1) {
    setCart(customerId, cart.filter((l) => l !== line));
  } else {
    line.quantity = clamped;
    saveCarts();
  }
}

export interface CartLineView {
  type: 'product' | 'build';
  ref_id: number;
  quantity: number;
  name: string;
  unit_price: number;
  line_total: number;
  category_id?: number; // เอาไว้เลือกไอคอนรูปย่อ (เฉพาะ type: 'product')
  image_url?: string;
  stock_quantity?: number; // เอาไว้จำกัดปุ่ม + ไม่ให้กดเกินสต็อกจริง (เฉพาะ type: 'product')
}

/** ดึงหลายแถวด้วย id ชุดเดียว (WHERE id IN (...)) คืนเป็น Map ให้หยิบใช้ตาม id */
async function fetchByIds<T>(table: 'product' | 'pc_build', idColumn: string, ids: number[]): Promise<Map<number, T>> {
  const map = new Map<number, T>();
  if (ids.length === 0) return map;
  const rows = await query<any>(`SELECT * FROM ${table} WHERE ${idColumn} IN (?)`, [ids]);
  rows.forEach((r) => map.set(r[idColumn], r as T));
  return map;
}

export async function viewCart(customerId: number): Promise<CartLineView[]> {
  const cart = getCart(customerId);
  const products = await fetchByIds<Product>(
    'product',
    'product_id',
    cart.filter((l) => l.type === 'product').map((l) => l.ref_id)
  );
  const builds = await fetchByIds<PCBuild>(
    'pc_build',
    'build_id',
    cart.filter((l) => l.type === 'build').map((l) => l.ref_id)
  );

  return cart.map((line) => {
    if (line.type === 'product') {
      const product = products.get(line.ref_id);
      return {
        type: 'product' as const,
        ref_id: line.ref_id,
        quantity: line.quantity,
        name: product?.product_name ?? 'ไม่พบสินค้า',
        unit_price: product?.price ?? 0,
        line_total: (product?.price ?? 0) * line.quantity,
        category_id: product?.category_id,
        image_url: product?.image_url ?? undefined,
        stock_quantity: product?.stock_quantity,
      };
    }
    const build = builds.get(line.ref_id);
    return {
      type: 'build' as const,
      ref_id: line.ref_id,
      quantity: 1,
      name: build?.build_name ?? 'ไม่พบชุดคอม',
      unit_price: build?.total_price ?? 0,
      line_total: build?.total_price ?? 0,
    };
  });
}

export interface CheckoutResult {
  order_id?: number;
  build_ids: number[];
}

export type PaymentMethod = 'cod' | 'bank_transfer';

export async function checkoutCart(
  customerId: number,
  shippingAddress: string,
  paymentMethod: PaymentMethod
): Promise<CheckoutResult> {
  const cart = getCart(customerId);
  if (cart.length === 0) {
    throw new Error('ตะกร้าว่าง ไม่สามารถชำระเงินได้');
  }

  const productLines = cart.filter((l) => l.type === 'product');
  const buildLines = cart.filter((l) => l.type === 'build');

  // ทั้งหมดอยู่ใน transaction เดียว: ถ้าขั้นไหนพัง (เช่น สต็อกไม่พอ) MySQL จะ ROLLBACK ทุกอย่างกลับ
  // ไม่มีทางเกิดออเดอร์ที่ไม่มีสินค้า (BR4) หรือหักสต็อกไปครึ่งเดียว
  const result = await withTransaction(async (conn) => {
    const now = new Date();

    // ----- 1) ชุดคอมในตะกร้า ต้องเป็นของลูกค้าคนนี้และยังเป็น draft (กันจ่ายซ้ำ) -----
    const builds: PCBuild[] = [];
    for (const line of buildLines) {
      const build = await queryOne<PCBuild>(
        "SELECT * FROM pc_build WHERE build_id = ? AND customer_id = ? AND status = 'draft'",
        [line.ref_id, customerId],
        conn
      );
      if (!build) throw new Error(`ไม่พบชุดคอมรหัส ${line.ref_id}`);
      builds.push(build);
    }
    const buildItems =
      builds.length > 0
        ? await query<BuildItem>(
            'SELECT * FROM build_item WHERE build_id IN (?)',
            [builds.map((b) => b.build_id)],
            conn
          )
        : [];

    // ----- 2) รวมจำนวนที่ต้องหักต่อสินค้า (สินค้าเดี่ยว + อะไหล่ในชุดคอม) -----
    const demand = new Map<number, number>();
    productLines.forEach((l) => demand.set(l.ref_id, (demand.get(l.ref_id) ?? 0) + l.quantity));
    buildItems.forEach((bi) => demand.set(bi.product_id, (demand.get(bi.product_id) ?? 0) + bi.quantity));

    // ----- 3) อ่านข้อมูลสินค้าที่เกี่ยวข้อง (ราคา + สต็อก) -----
    const productIds = [...demand.keys()];
    const productRows =
      productIds.length > 0
        ? await query<Product>('SELECT * FROM product WHERE product_id IN (?)', [productIds], conn)
        : [];
    const products = new Map(productRows.map((p) => [p.product_id, p]));

    // ----- 4) ตรวจสต็อกทั้งหมดก่อนหักจริง -----
    for (const line of productLines) {
      const product = products.get(line.ref_id);
      if (!product) throw new Error(`ไม่พบสินค้ารหัส ${line.ref_id}`);
      if (product.stock_quantity < line.quantity) {
        throw new Error(`สินค้า "${product.product_name}" มีไม่พอ (เหลือ ${product.stock_quantity})`);
      }
    }
    for (const build of builds) {
      for (const bi of buildItems.filter((x) => x.build_id === build.build_id)) {
        const product = products.get(bi.product_id);
        if (!product || product.stock_quantity < (demand.get(bi.product_id) ?? 0)) {
          throw new Error(`อะไหล่ในชุด "${build.build_name}" มีไม่พอ`);
        }
      }
    }

    const out: CheckoutResult = { build_ids: [] };

    // ----- 5) สินค้าเดี่ยว → sales_order + order_item + payment -----
    if (productLines.length > 0) {
      const totalAmount = productLines.reduce(
        (sum, line) => sum + products.get(line.ref_id)!.price * line.quantity,
        0
      );
      // โปรเจกต์นี้ยังไม่มี payment gateway จริง - ถือว่าจ่ายสำเร็จทันทีตอน checkout
      const orderResult = await execute(
        "INSERT INTO sales_order (customer_id, order_date, status, total_amount, shipping_address) VALUES (?, ?, 'paid', ?, ?)",
        [customerId, now, totalAmount, shippingAddress],
        conn
      );
      const orderId = orderResult.insertId;

      for (const line of productLines) {
        const product = products.get(line.ref_id)!;
        // unit_price = ราคา ณ ตอนซื้อ ล็อกไว้ไม่เปลี่ยนตามราคาสินค้าภายหลัง (BR23)
        await execute(
          'INSERT INTO order_item (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, product.product_id, line.quantity, product.price],
          conn
        );
      }

      assertExactlyOneLink(orderId, null, 'Payment (สินค้าปกติ)');
      await execute(
        "INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (?, NULL, ?, ?, ?, 'paid')",
        [orderId, totalAmount, now, paymentMethod],
        conn
      );
      out.order_id = orderId;
    }

    // ----- 6) ชุดคอม → เปลี่ยน pc_build จาก draft เป็น paid + payment -----
    for (const build of builds) {
      // AND status = 'draft' กันกรณีกด checkout ซ้อนกัน 2 ครั้ง: ครั้งที่สองจะไม่เจอแถวที่ยังเป็น draft แล้ว
      const updatedBuild = await execute(
        "UPDATE pc_build SET status = 'paid', shipping_address = ? WHERE build_id = ? AND status = 'draft'",
        [shippingAddress, build.build_id],
        conn
      );
      if (updatedBuild.affectedRows !== 1) throw new Error(`ไม่พบชุดคอมรหัส ${build.build_id}`);
      assertExactlyOneLink(null, build.build_id, 'Payment (จัดสเปคคอม)');
      await execute(
        "INSERT INTO payment (order_id, build_id, amount, payment_date, payment_method, payment_status) VALUES (NULL, ?, ?, ?, ?, 'paid')",
        [build.build_id, build.total_price, now, paymentMethod],
        conn
      );
      out.build_ids.push(build.build_id);
    }

    // ----- 7) หักสต็อกจริง (การขายไม่ต้องบันทึกใน stock_adjustment เพราะ trace จาก order_item/build_item ได้) -----
    // เงื่อนไข AND stock_quantity >= ? คือตัวกันขายเกินสต็อกจริง: ถ้าลูกค้าอีกคนเพิ่งซื้อตัดหน้าไป
    // UPDATE นี้จะไม่โดนแถวไหน (affectedRows = 0) แล้วเรา throw ให้ ROLLBACK ทั้ง transaction
    // หักเรียงตาม product_id เสมอ ลูกค้าสองคนที่ซื้อสินค้าซ้ำกันจะได้ไม่รอกันเองจนค้าง (deadlock)
    for (const [productId, qty] of [...demand].sort((x, y) => x[0] - y[0])) {
      const updated = await execute(
        'UPDATE product SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND stock_quantity >= ?',
        [qty, productId, qty],
        conn
      );
      if (updated.affectedRows !== 1) {
        throw new Error(`สินค้า "${products.get(productId)?.product_name ?? productId}" มีไม่พอ`);
      }
    }

    return out;
  });

  // ล้างตะกร้าหลัง COMMIT สำเร็จเท่านั้น ถ้า transaction พัง ตะกร้ายังอยู่ให้ลองใหม่ได้
  setCart(customerId, []);
  return result;
}
