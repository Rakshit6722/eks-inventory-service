require('dotenv').config();
const { initAndSeed } = require('./pg');

const items = {
  'item-1': { id: 'item-1', name: 'Wireless Mouse', price: 24.99, stock: 25 },
  'item-2': { id: 'item-2', name: 'Mechanical Keyboard', price: 79.99, stock: 15 },
  'item-3': { id: 'item-3', name: '27-inch Monitor', price: 229.0, stock: 8 },
  'item-4': { id: 'item-4', name: 'USB-C Hub', price: 39.5, stock: 30 },
  'item-5': { id: 'item-5', name: 'Noise-Canceling Headset', price: 149.0, stock: 12 }
};

initAndSeed(items)
  .then(() => {
    console.log('DB init/seed complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('DB init/seed failed', err);
    process.exit(1);
  });
