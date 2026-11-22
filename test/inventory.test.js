const test = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

const lastUnit = { id: 1, name: 'Ghee', stock: 1, reserved: 0 };

test('CURRENT BEHAVIOUR: qty 1 passes with one sellable unit', () => {
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 1 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: qty 2 fails with one sellable unit', () => {
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 2 }]), {
    ok: false,
    msg: 'Ghee is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: qty 0 passes with one sellable unit', () => {
  assert.deepEqual(inventory.check([lastUnit], [{ id: lastUnit.id, qty: 0 }]), { ok: true });
});

test('CURRENT BEHAVIOUR: stock 4 and reserved 3 allow one unit', () => {
  const product = { id: 2, name: 'Chilli powder', stock: 4, reserved: 3 };
  assert.equal(inventory.getSellableStock(product), 1);
  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check([product], [{ id: product.id, qty: 2 }]), {
    ok: false,
    msg: 'Chilli powder is out of stock (1 sellable available)'
  });
});

test('CURRENT BEHAVIOUR: cancelling a pending order restores physical stock', () => {
  const product = {
    id: 2, sku: 'SPC-TEST', name: 'Chilli powder', hsn: '0904', price: 90, stock: 4, reserved: 3
  };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 1
  }];
  const order = { id: 101, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [] };
  const stockState = () => ({ stock: product.stock, reserved: product.reserved });

  assert.deepEqual(stockState(), { stock: 4, reserved: 3 });
  inventory.reserve(db.products, items);
  assert.deepEqual(stockState(), { stock: 3, reserved: 3 });
  db.orders.push(order);

  const result = orders.cancel(db, order.id, 'Test cancellation');
  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(stockState(), { stock: 4, reserved: 3 });
});

test('selling the remaining stock preserves reservations and cancellation restocks exactly once', () => {
  const product = {
    id: 3, sku: 'STOCK-TEST', name: 'Test product', hsn: '0405', price: 100, stock: 5, reserved: 3
  };
  const items = [{
    id: product.id,
    sku: product.sku,
    name: product.name,
    hsn: product.hsn,
    price: product.price,
    qty: 2
  }];
  const order = { id: 102, status: 'pending', paymentMode: 'cash', items };
  const db = { products: [product], orders: [order] };

  assert.equal(inventory.check(db.products, items).ok, true);
  assert.equal(inventory.check(db.products, [{ ...items[0], qty: 3 }]).ok, false);
  const splitLine = { ...items[0], qty: 1 };
  assert.equal(inventory.check(db.products, [splitLine, splitLine]).ok, true);
  assert.equal(inventory.check(db.products, [splitLine, ...items]).ok, false);

  inventory.reserve(db.products, items);
  assert.equal(product.stock, 3);
  assert.equal(product.reserved, 3);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 3);

  assert.equal(orders.cancel(db, order.id).ok, false);
  assert.equal(product.stock, 5);
  assert.equal(product.reserved, 3);
});
