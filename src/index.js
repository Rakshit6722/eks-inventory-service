require('dotenv').config();


const express = require('express');
const { checkDatabase, hasDatabaseConfig, initAndSeed, getItemById, reserveItem, countItems } = require('./pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE_PATH = '/api/inventory';

// seed data used when initializing DB (only inserted if item id doesn't exist)
const items = {
  'item-1': { id: 'item-1', name: 'Wireless Mouse', price: 24.99, stock: 25 },
  'item-2': { id: 'item-2', name: 'Mechanical Keyboard', price: 79.99, stock: 15 },
  'item-3': { id: 'item-3', name: '27-inch Monitor', price: 229.0, stock: 8 },
  'item-4': { id: 'item-4', name: 'USB-C Hub', price: 39.5, stock: 30 },
  'item-5': { id: 'item-5', name: 'Noise-Canceling Headset', price: 149.0, stock: 12 }
};

app.get(`${BASE_PATH}/items/:id`, async (req, res) => {
  const id = req.params.id;
  if (hasDatabaseConfig()) {
    try {
      const item = await getItemById(id);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      return res.json(item);
    } catch (err) {
      console.error('db get item error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  const item = items[id];
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

app.post(`${BASE_PATH}/items/:id/reserve`, async (req, res) => {
  const id = req.params.id;
  const quantity = req.body.quantity ?? 1;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }

  if (hasDatabaseConfig()) {
    try {
      const result = await reserveItem(id, quantity);
      return res.json({
        message: 'Stock reserved',
        itemId: id,
        reserved: quantity,
        remainingStock: result.remainingStock
      });
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ error: 'Item not found' });
      if (err.code === 'INSUFFICIENT') return res.status(409).json({ error: 'Insufficient stock', itemId: id, requested: quantity, available: err.available });
      console.error('db reserve error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  const item = items[id];
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (item.stock < quantity) {
    return res.status(409).json({
      error: 'Insufficient stock',
      itemId: item.id,
      requested: quantity,
      available: item.stock
    });
  }

  item.stock -= quantity;

  return res.json({
    message: 'Stock reserved',
    itemId: item.id,
    reserved: quantity,
    remainingStock: item.stock
  });
});

app.get(`${BASE_PATH}/health`, async (req, res) => {
  const base = {
    service: 'inventory-service',
    status: 'ok',
    database: hasDatabaseConfig() ? 'configured' : 'not configured',
    databaseUrl: process.env.DATABASE_URL ? 'set' : null,
    timestamp: new Date().toISOString()
  };

  if (hasDatabaseConfig()) {
    try {
      const total = await countItems();
      return res.json({ ...base, totalItems: total });
    } catch (err) {
      console.error('health count items error', err);
      return res.json({ ...base, totalItems: null });
    }
  }

  return res.json({ ...base, totalItems: Object.keys(items).length });
});

app.get(`${BASE_PATH}/db-health`, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(200).json({
      service: 'inventory-service',
      database: 'not configured',
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const result = await checkDatabase();
    return res.status(200).json({
      service: 'inventory-service',
      database: 'connected',
      status: 'ok',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      service: 'inventory-service',
      database: 'unreachable',
      status: 'error',
      error: error?.message ?? String(error),
      timestamp: new Date().toISOString()
    });
  }
});

async function start() {
  if (!hasDatabaseConfig()) {
    console.error('inventory-service will not start: database configuration is missing');
    process.exit(1);
  }

  try {
    const result = await checkDatabase();
    console.log('Postgres connectivity check succeeded', result);

    await initAndSeed(items);
    console.log('Postgres schema initialized and seed data ensured');

    app.listen(PORT, () => {
      console.log(`inventory-service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('inventory-service will not start because Postgres is unavailable', error?.message ?? error);
    process.exit(1);
  }
}

// start();