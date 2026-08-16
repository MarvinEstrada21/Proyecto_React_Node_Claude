const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { fetchRecipeOr404 } = require('./recipesController');

async function fetchCommentOr404(idComment) {
  const [rows] = await pool.query('SELECT * FROM TB_Comments WHERE idComment = ?', [idComment]);
  if (rows.length === 0) throw new ApiError(404, 'Comentario no encontrado.');
  return rows[0];
}

const createComment = asyncHandler(async (req, res) => {
  const idRecipe = Number(req.params.id);
  if (!Number.isInteger(idRecipe)) throw new ApiError(400, 'Identificador invalido.');

  await fetchRecipeOr404(idRecipe);

  const { bodyComment } = req.body;
  const usernameComment = req.user.username;

  const [result] = await pool.query(
    `INSERT INTO TB_Comments (idRecipe, bodyComment, usernameComment, createdIn) VALUES (?, ?, ?, NOW())`,
    [idRecipe, bodyComment, usernameComment]
  );

  res.status(201).json({ idComment: result.insertId });
});

const updateComment = asyncHandler(async (req, res) => {
  const idComment = Number(req.params.id);
  if (!Number.isInteger(idComment)) throw new ApiError(400, 'Identificador invalido.');

  await fetchCommentOr404(idComment);

  if (req.user.roleUser !== 'admin') {
    throw new ApiError(403, 'Solo un administrador puede editar comentarios de otros usuarios.');
  }

  const { bodyComment } = req.body;
  await pool.query('UPDATE TB_Comments SET bodyComment = ? WHERE idComment = ?', [bodyComment, idComment]);
  res.json({ idComment });
});

const deleteComment = asyncHandler(async (req, res) => {
  const idComment = Number(req.params.id);
  if (!Number.isInteger(idComment)) throw new ApiError(400, 'Identificador invalido.');

  const comment = await fetchCommentOr404(idComment);

  const canDelete = req.user.roleUser === 'admin' || req.user.username === comment.usernameComment;
  if (!canDelete) {
    throw new ApiError(403, 'No tienes permiso para eliminar este comentario.');
  }

  await pool.query('DELETE FROM TB_Comments WHERE idComment = ?', [idComment]);
  res.status(204).send();
});

module.exports = { createComment, updateComment, deleteComment };
