import { openDB } from 'idb';

const DB_NAME = 'vitalblaze-pos';
const DB_VERSION = 1;
const HELD_CARTS_STORE = 'held-carts';
const OFFLINE_SALES_STORE = 'offline-sales';

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(HELD_CARTS_STORE)) {
        db.createObjectStore(HELD_CARTS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(OFFLINE_SALES_STORE)) {
        db.createObjectStore(OFFLINE_SALES_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function saveHeldCart(cart) {
  const db = await getDb();
  await db.put(HELD_CARTS_STORE, cart);
}

export async function getHeldCarts() {
  const db = await getDb();
  return db.getAll(HELD_CARTS_STORE);
}

export async function removeHeldCart(id) {
  const db = await getDb();
  await db.delete(HELD_CARTS_STORE, id);
}

export async function queueOfflineSale(sale) {
  const db = await getDb();
  await db.put(OFFLINE_SALES_STORE, sale);
}

export async function getOfflineSales() {
  const db = await getDb();
  return db.getAll(OFFLINE_SALES_STORE);
}
