const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getPublicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const [rows] = await pool.query(
    'SELECT username, nameUser, lastnameUser, imageUser FROM TB_Users WHERE username = ?',
    [username]
  );
  if (rows.length === 0) throw new ApiError(404, 'Usuario no encontrado.');
  res.json({ user: rows[0] });
});

const updateMe = asyncHandler(async (req, res) => {
  const { nameUser, lastnameUser } = req.body;
  const newImage = req.uploadedImagePath;

  const fields = [];
  const params = [];

  if (typeof nameUser === 'string' && nameUser.trim()) {
    const trimmed = nameUser.trim();
    if (trimmed.length > 100) throw new ApiError(400, 'Datos invalidos.', { nameUser: 'Maximo 100 caracteres.' });
    fields.push('nameUser = ?');
    params.push(trimmed);
  }

  if (typeof lastnameUser === 'string' && lastnameUser.trim()) {
    const trimmed = lastnameUser.trim();
    if (trimmed.length > 100) throw new ApiError(400, 'Datos invalidos.', { lastnameUser: 'Maximo 100 caracteres.' });
    fields.push('lastnameUser = ?');
    params.push(trimmed);
  }

  if (newImage) {
    fields.push('imageUser = ?');
    params.push(newImage);
  }

  if (fields.length === 0) {
    return res.json({ user: req.user });
  }

  params.push(req.user.username);
  await pool.query(`UPDATE TB_Users SET ${fields.join(', ')} WHERE username = ?`, params);

  const [rows] = await pool.query(
    'SELECT username, nameUser, lastnameUser, imageUser, roleUser FROM TB_Users WHERE username = ?',
    [req.user.username]
  );
  res.json({ user: rows[0] });
});

module.exports = { getPublicProfile, updateMe };
