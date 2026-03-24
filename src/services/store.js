const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function filePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function load(collection) {
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function save(collection, data) {
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2));
}

function add(collection, item) {
  const items = load(collection);
  item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  item.createdAt = new Date().toISOString();
  items.push(item);
  save(collection, items);
  return item;
}

function update(collection, id, updates) {
  const items = load(collection);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  save(collection, items);
  return items[idx];
}

function remove(collection, id) {
  const items = load(collection);
  const filtered = items.filter((i) => i.id !== id);
  save(collection, filtered);
  return filtered.length < items.length;
}

module.exports = { load, save, add, update, remove };
