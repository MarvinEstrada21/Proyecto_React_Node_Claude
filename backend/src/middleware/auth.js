const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const pool = require('../config/db');

// Verifica el JWT (leido de cookie httpOnly) y adjunta el usuario real,
// consultado en la base de datos, a req.user. El rol nunca se toma de
// datos enviados por el cliente.
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      throw new ApiError(401, 'No autenticado.');
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Sesion invalida o expirada.');
    }

    const [rows] = await pool.query(
      'SELECT username, nameUser, lastnameUser, imageUser, roleUser FROM TB_Users WHERE username = ?',
      [payload.username]
    );

    if (rows.length === 0) {
      throw new ApiError(401, 'Sesion invalida.');
    }

    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// Adjunta el usuario si hay una sesion valida, pero no bloquea la peticion
// si no la hay (util para rutas publicas que cambian de comportamiento
// segun si hay sesion, ej. listar recetas).
async function attachUserIfPresent(req, res, next) {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return next();

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next();
    }

    const [rows] = await pool.query(
      'SELECT username, nameUser, lastnameUser, imageUser, roleUser FROM TB_Users WHERE username = ?',
      [payload.username]
    );

    if (rows.length > 0) {
      req.user = rows[0];
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.roleUser !== 'admin') {
    return next(new ApiError(403, 'Requiere permisos de administrador.'));
  }
  next();
}

module.exports = { requireAuth, attachUserIfPresent, requireAdmin };
