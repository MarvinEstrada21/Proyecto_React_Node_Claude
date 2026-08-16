const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parseAndValidateIngredients } = require('../validators/recipeValidators');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

function deleteUploadedFile(publicPath) {
  if (!publicPath) return;
  // publicPath siempre proviene de la base de datos, y todo lo que llega a
  // la base de datos fue generado por el propio servidor (ver upload.js),
  // nunca se concatena con datos crudos del cliente.
  const relative = publicPath.replace(/^\/uploads\//, '');
  const fullPath = path.join(uploadsRoot, relative);
  fs.promises.unlink(fullPath).catch(() => {});
}

async function fetchRecipeOr404(idRecipe) {
  const [rows] = await pool.query(
    `SELECT r.*, u.nameUser AS authorNameUser, u.lastnameUser AS authorLastnameUser, u.imageUser AS authorImageUser
     FROM TB_Recipes r
     JOIN TB_Users u ON u.username = r.usernameAuthor
     WHERE r.idRecipe = ?`,
    [idRecipe]
  );
  if (rows.length === 0) {
    throw new ApiError(404, 'Receta no encontrada.');
  }
  return rows[0];
}

function canModify(recipe, user) {
  return user.roleUser === 'admin' || user.username === recipe.usernameAuthor;
}

const listRecipes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];

  if (req.query.category && typeof req.query.category === 'string') {
    where.push('r.categoryRecipe = ?');
    params.push(req.query.category.trim().slice(0, 100));
  }

  if (req.query.search && typeof req.query.search === 'string') {
    where.push('r.nameRecipe LIKE ?');
    params.push(`%${req.query.search.trim().slice(0, 200)}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT r.idRecipe, r.nameRecipe, r.categoryRecipe, r.descriptionRecipe, r.imageRecipe,
            r.usernameAuthor, r.createdIn, u.nameUser AS authorNameUser, u.lastnameUser AS authorLastnameUser
     FROM TB_Recipes r
     JOIN TB_Users u ON u.username = r.usernameAuthor
     ${whereSql}
     ORDER BY r.createdIn DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM TB_Recipes r ${whereSql}`,
    params
  );

  res.json({ recipes: rows, page, limit, total, totalPages: Math.ceil(total / limit) });
});

const listCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT categoryRecipe FROM TB_Recipes ORDER BY categoryRecipe ASC'
  );
  res.json({ categories: rows.map((r) => r.categoryRecipe) });
});

const getRecipe = asyncHandler(async (req, res) => {
  const idRecipe = Number(req.params.id);
  if (!Number.isInteger(idRecipe)) throw new ApiError(400, 'Identificador invalido.');

  const recipe = await fetchRecipeOr404(idRecipe);

  const [ingredients] = await pool.query(
    `SELECT idIngredient, nameIngredient, quantityIngredient, orderIngredient
     FROM TB_Ingredients WHERE idRecipe = ?
     ORDER BY orderIngredient ASC, idIngredient ASC`,
    [idRecipe]
  );

  const [comments] = await pool.query(
    `SELECT c.idComment, c.bodyComment, c.usernameComment, c.createdIn,
            u.nameUser AS commenterNameUser, u.lastnameUser AS commenterLastnameUser, u.imageUser AS commenterImageUser
     FROM TB_Comments c
     JOIN TB_Users u ON u.username = c.usernameComment
     WHERE c.idRecipe = ?
     ORDER BY c.createdIn DESC`,
    [idRecipe]
  );

  res.json({ recipe, ingredients, comments });
});

const createRecipe = asyncHandler(async (req, res) => {
  const { nameRecipe, categoryRecipe, descriptionRecipe, stepsRecipe } = req.body;
  const ingredients = parseAndValidateIngredients(req.body.ingredients);
  const imageRecipe = req.uploadedImagePath || null;
  const usernameAuthor = req.user.username;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO TB_Recipes (nameRecipe, categoryRecipe, descriptionRecipe, stepsRecipe, imageRecipe, usernameAuthor, createdIn)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [nameRecipe, categoryRecipe, descriptionRecipe, stepsRecipe, imageRecipe, usernameAuthor]
    );

    const idRecipe = result.insertId;

    for (const ing of ingredients) {
      await connection.query(
        `INSERT INTO TB_Ingredients (idRecipe, nameIngredient, quantityIngredient, orderIngredient)
         VALUES (?, ?, ?, ?)`,
        [idRecipe, ing.nameIngredient, ing.quantityIngredient, ing.orderIngredient]
      );
    }

    await connection.commit();
    res.status(201).json({ idRecipe });
  } catch (err) {
    await connection.rollback();
    if (imageRecipe) deleteUploadedFile(imageRecipe);
    throw err;
  } finally {
    connection.release();
  }
});

const updateRecipe = asyncHandler(async (req, res) => {
  const idRecipe = Number(req.params.id);
  if (!Number.isInteger(idRecipe)) throw new ApiError(400, 'Identificador invalido.');

  const recipe = await fetchRecipeOr404(idRecipe);
  if (!canModify(recipe, req.user)) {
    throw new ApiError(403, 'No tienes permiso para modificar esta receta.');
  }

  const { nameRecipe, categoryRecipe, descriptionRecipe, stepsRecipe } = req.body;
  const ingredients = parseAndValidateIngredients(req.body.ingredients);
  const newImage = req.uploadedImagePath || null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const imageRecipe = newImage || recipe.imageRecipe;

    await connection.query(
      `UPDATE TB_Recipes
       SET nameRecipe = ?, categoryRecipe = ?, descriptionRecipe = ?, stepsRecipe = ?, imageRecipe = ?
       WHERE idRecipe = ?`,
      [nameRecipe, categoryRecipe, descriptionRecipe, stepsRecipe, imageRecipe, idRecipe]
    );

    await connection.query('DELETE FROM TB_Ingredients WHERE idRecipe = ?', [idRecipe]);
    for (const ing of ingredients) {
      await connection.query(
        `INSERT INTO TB_Ingredients (idRecipe, nameIngredient, quantityIngredient, orderIngredient)
         VALUES (?, ?, ?, ?)`,
        [idRecipe, ing.nameIngredient, ing.quantityIngredient, ing.orderIngredient]
      );
    }

    await connection.commit();

    if (newImage && recipe.imageRecipe) {
      deleteUploadedFile(recipe.imageRecipe);
    }

    res.json({ idRecipe });
  } catch (err) {
    await connection.rollback();
    if (newImage) deleteUploadedFile(newImage);
    throw err;
  } finally {
    connection.release();
  }
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const idRecipe = Number(req.params.id);
  if (!Number.isInteger(idRecipe)) throw new ApiError(400, 'Identificador invalido.');

  const recipe = await fetchRecipeOr404(idRecipe);
  if (!canModify(recipe, req.user)) {
    throw new ApiError(403, 'No tienes permiso para eliminar esta receta.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM TB_Comments WHERE idRecipe = ?', [idRecipe]);
    await connection.query('DELETE FROM TB_Ingredients WHERE idRecipe = ?', [idRecipe]);
    await connection.query('DELETE FROM TB_Recipes WHERE idRecipe = ?', [idRecipe]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  if (recipe.imageRecipe) deleteUploadedFile(recipe.imageRecipe);

  res.status(204).send();
});

module.exports = {
  listRecipes,
  listCategories,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  fetchRecipeOr404,
  canModify,
};
