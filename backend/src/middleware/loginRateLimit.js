const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

// Limite por IP: evita fuerza bruta distribuida contra muchas cuentas.
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos desde esta direccion. Intenta mas tarde.' },
});

// Limite por cuenta: evita fuerza bruta dirigida a un solo username,
// independientemente de la IP de origen. Se guarda en memoria del
// proceso porque el esquema de la base de datos no puede modificarse
// para agregar columnas de control de intentos.
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const attemptsByUsername = new Map();

function cleanupExpired(entry, now) {
  return entry.firstAttemptAt && now - entry.firstAttemptAt < LOCK_WINDOW_MS;
}

function loginAccountLimiter(req, res, next) {
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  if (!username) return next();

  const now = Date.now();
  const entry = attemptsByUsername.get(username);

  if (entry && cleanupExpired(entry, now) && entry.count >= MAX_ATTEMPTS) {
    return next(new ApiError(429, 'Demasiados intentos fallidos para esta cuenta. Intenta mas tarde.'));
  }

  req.recordLoginFailure = () => {
    const current = attemptsByUsername.get(username);
    if (!current || !cleanupExpired(current, now)) {
      attemptsByUsername.set(username, { count: 1, firstAttemptAt: now });
    } else {
      current.count += 1;
    }
  };

  req.clearLoginFailures = () => {
    attemptsByUsername.delete(username);
  };

  next();
}

module.exports = { loginIpLimiter, loginAccountLimiter };
