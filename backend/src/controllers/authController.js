const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const BCRYPT_COST = 12;
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function toPublicUser(row) {
  return {
    username: row.username,
    nameUser: row.nameUser,
    lastnameUser: row.lastnameUser,
    imageUser: row.imageUser,
    roleUser: row.roleUser,
  };
}

const register = asyncHandler(async (req, res) => {
  const { username, nameUser, lastnameUser, password } = req.body;
  const imageUser = req.uploadedImagePath || null;

  const [existing] = await pool.query('SELECT username FROM TB_Users WHERE username = ?', [username]);
  if (existing.length > 0) {
    throw new ApiError(409, 'Datos invalidos.', { username: 'Este username ya esta registrado.' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  await pool.query(
    `INSERT INTO TB_Users (username, nameUser, lastnameUser, passwordUser, imageUser, roleUser, createdIn)
     VALUES (?, ?, ?, ?, ?, 'user', NOW())`,
    [username, nameUser, lastnameUser, passwordHash, imageUser]
  );

  const [rows] = await pool.query(
    'SELECT username, nameUser, lastnameUser, imageUser, roleUser FROM TB_Users WHERE username = ?',
    [username]
  );

  const user = toPublicUser(rows[0]);
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie('token', token, cookieOptions());
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await pool.query('SELECT * FROM TB_Users WHERE username = ?', [username]);

  const genericError = () => new ApiError(401, 'Usuario o contrasena incorrectos.');

  if (rows.length === 0) {
    if (req.recordLoginFailure) req.recordLoginFailure();
    throw genericError();
  }

  const user = rows[0];
  const matches = await bcrypt.compare(password, user.passwordUser);

  if (!matches) {
    if (req.recordLoginFailure) req.recordLoginFailure();
    throw genericError();
  }

  if (req.clearLoginFailures) req.clearLoginFailures();

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie('token', token, cookieOptions());
  res.json({ user: toPublicUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, logout, me };
