const { nanoid } = require('nanoid');

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const code = nanoid(4).toUpperCase();
  return `DOM-${y}${m}${d}-${code}`;
}

module.exports = generateOrderNumber;
