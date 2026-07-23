const { nanoid } = require('nanoid');

function generateTicketNumber() {
  const part1 = nanoid(4).toUpperCase();
  const part2 = nanoid(4).toUpperCase();
  return `DOM-${part1}-${part2}`;
}

module.exports = generateTicketNumber;
