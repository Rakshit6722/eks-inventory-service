const { Pool } = require('pg');

let pool;

function envFlag(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return String(raw).toLowerCase() === 'true' || raw === '1' || String(raw).toLowerCase() === 'yes';
}

function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
}

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  const sslEnabled = envFlag('DB_SSL', true);
  const ssl = sslEnabled ? { rejectUnauthorized: false } : false;

  pool = new Pool(
    connectionString
      ? { connectionString, ssl }
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: 'L~rE7[5fzxe5[TkX?mcnE:pIX#vM',
          ssl
        }
  );

  return pool;
}

async function checkDatabase() {
  const dbPool = getPool();
  const startedAt = Date.now();
  const result = await dbPool.query('SELECT 1 as ok');

  return {
    ok: result?.rows?.[0]?.ok === 1,
    latencyMs: Date.now() - startedAt
  };
}

async function initAndSeed(itemsMap = {}) {
  if (!hasDatabaseConfig()) return;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      stock INTEGER NOT NULL
    )`);

    const seedEntries = Object.values(itemsMap);
    for (const it of seedEntries) {
      // insert if not exists so we don't overwrite live stock counts
      await client.query(
        'INSERT INTO items(id, name, price, stock) VALUES($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',
        [it.id, it.name, it.price, it.stock]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getItemById(id) {
  if (!hasDatabaseConfig()) return null;
  const pool = getPool();
  const res = await pool.query('SELECT id, name, price::float as price, stock FROM items WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function countItems() {
  if (!hasDatabaseConfig()) return null;
  const pool = getPool();
  const res = await pool.query('SELECT COUNT(*)::int as c FROM items');
  return res.rows?.[0]?.c ?? null;
}

async function reserveItem(id, quantity = 1) {
  if (!hasDatabaseConfig()) throw new Error('database not configured');
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sel = await client.query('SELECT stock FROM items WHERE id = $1 FOR UPDATE', [id]);
    if (sel.rows.length === 0) {
      await client.query('ROLLBACK');
      const e = new Error('Item not found');
      e.code = 'NOT_FOUND';
      throw e;
    }

    const current = sel.rows[0].stock;
    if (current < quantity) {
      await client.query('ROLLBACK');
      const e = new Error('Insufficient stock');
      e.code = 'INSUFFICIENT';
      e.available = current;
      throw e;
    }

    const newStock = current - quantity;
    await client.query('UPDATE items SET stock = $1 WHERE id = $2', [newStock, id]);
    await client.query('COMMIT');
    return { remainingStock: newStock };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  hasDatabaseConfig,
  getPool,
  checkDatabase,
  initAndSeed,
  getItemById,
  reserveItem,
  countItems
};
