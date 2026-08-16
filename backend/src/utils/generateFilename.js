const crypto = require('crypto');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function generateFilename(mime) {
  const ext = EXT_BY_MIME[mime];
  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;
}

module.exports = { generateFilename, EXT_BY_MIME };
