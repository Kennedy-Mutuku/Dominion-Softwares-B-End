const slugify = require('slugify');
const { nanoid } = require('nanoid');

function generateSlug(title) {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = nanoid(6);
  return `${base}-${suffix}`;
}

module.exports = generateSlug;
