const { body } = require('express-validator');
const ApiError = require('../utils/ApiError');

const recipeFieldValidators = [
  body('nameRecipe')
    .trim()
    .notEmpty().withMessage('El nombre de la receta es obligatorio.')
    .bail()
    .isLength({ max: 200 }).withMessage('El nombre no puede superar los 200 caracteres.'),
  body('categoryRecipe')
    .trim()
    .notEmpty().withMessage('La categoria es obligatoria.')
    .bail()
    .isLength({ max: 100 }).withMessage('La categoria no puede superar los 100 caracteres.'),
  body('descriptionRecipe')
    .trim()
    .notEmpty().withMessage('La descripcion es obligatoria.')
    .bail()
    .isLength({ max: 500 }).withMessage('La descripcion no puede superar los 500 caracteres.'),
  body('stepsRecipe')
    .trim()
    .notEmpty().withMessage('Los pasos de preparacion son obligatorios.')
    .bail()
    .isLength({ max: 500 }).withMessage('Los pasos no pueden superar los 500 caracteres.'),
];

// Los ingredientes viajan como un campo de texto JSON dentro del
// multipart/form-data (junto con la imagen), por lo que se validan
// manualmente en lugar de con cadenas de express-validator.
function parseAndValidateIngredients(raw) {
  let ingredients;
  try {
    ingredients = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    throw new ApiError(400, 'Datos invalidos.', { ingredients: 'El formato de los ingredientes es invalido.' });
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new ApiError(400, 'Datos invalidos.', { ingredients: 'La receta requiere al menos un ingrediente.' });
  }

  const seen = new Set();
  const clean = [];

  for (let i = 0; i < ingredients.length; i += 1) {
    const item = ingredients[i] || {};
    const nameIngredient = typeof item.nameIngredient === 'string' ? item.nameIngredient.trim() : '';
    const quantityIngredient = typeof item.quantityIngredient === 'string' ? item.quantityIngredient.trim() : '';
    const orderIngredient = Number.isInteger(item.orderIngredient) ? item.orderIngredient : i;

    if (!nameIngredient) {
      throw new ApiError(400, 'Datos invalidos.', { ingredients: `El ingrediente #${i + 1} necesita un nombre.` });
    }
    if (nameIngredient.length > 255) {
      throw new ApiError(400, 'Datos invalidos.', { ingredients: `El nombre del ingrediente #${i + 1} es demasiado largo.` });
    }
    if (!quantityIngredient) {
      throw new ApiError(400, 'Datos invalidos.', { ingredients: `El ingrediente #${i + 1} necesita una cantidad.` });
    }
    if (quantityIngredient.length > 100) {
      throw new ApiError(400, 'Datos invalidos.', { ingredients: `La cantidad del ingrediente #${i + 1} es demasiado larga.` });
    }

    const key = nameIngredient.toLowerCase();
    if (seen.has(key)) {
      throw new ApiError(400, 'Datos invalidos.', { ingredients: `El ingrediente "${nameIngredient}" esta repetido.` });
    }
    seen.add(key);

    clean.push({ nameIngredient, quantityIngredient, orderIngredient });
  }

  return clean;
}

const commentValidators = [
  body('bodyComment')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacio.')
    .bail()
    .isLength({ max: 500 }).withMessage('El comentario no puede superar los 500 caracteres.'),
];

module.exports = { recipeFieldValidators, parseAndValidateIngredients, commentValidators };
