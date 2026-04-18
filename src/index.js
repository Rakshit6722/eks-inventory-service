require('dotenv').config();

const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE_PATH = '/api/inventory';

const items = {
  'item-1': { id: 'item-1', name: 'Wireless Mouse', price: 24.99, stock: 25 },
  'item-2': { id: 'item-2', name: 'Mechanical Keyboard', price: 79.99, stock: 15 },
  'item-3': { id: 'item-3', name: '27-inch Monitor', price: 229.0, stock: 8 },
  'item-4': { id: 'item-4', name: 'USB-C Hub', price: 39.5, stock: 30 },
  'item-5': { id: 'item-5', name: 'Noise-Canceling Headset', price: 149.0, stock: 12 }
};

app.get(`${BASE_PATH}/items/:id`, (req, res) => {
  const item = items[req.params.id];

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.json(item);
});

app.post(`${BASE_PATH}/items/:id/reserve`, (req, res) => {
  const item = items[req.params.id];
  const quantity = req.body.quantity ?? 1;

  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
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

app.get(`${BASE_PATH}/health`, (req, res) => {
  const hasDatabase = !!(process.env.DATABASE_URL || process.env.DB_HOST);
  res.json({
    service: 'inventory-service',
    status: 'ok',
    database: hasDatabase ? 'configured' : 'not configured',
    databaseUrl: process.env.DATABASE_URL || null,
    totalItems: Object.keys(items).length,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`inventory-service listening on port ${PORT}`);
});