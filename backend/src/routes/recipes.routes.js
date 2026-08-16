const express = require('express');
const recipesController = require('../controllers/recipesController');
const commentsController = require('../controllers/commentsController');
const { recipeFieldValidators, commentValidators } = require('../validators/recipeValidators');
const validate = require('../validators/validate');
const { requireAuth, attachUserIfPresent } = require('../middleware/auth');
const { singleImageUpload, persistImage } = require('../middleware/upload');

const router = express.Router();

router.get('/categories', recipesController.listCategories);
router.get('/', attachUserIfPresent, recipesController.listRecipes);
router.get('/:id', attachUserIfPresent, recipesController.getRecipe);

router.post(
  '/',
  requireAuth,
  singleImageUpload('imageRecipe'),
  recipeFieldValidators,
  validate,
  persistImage('recipes'),
  recipesController.createRecipe
);

router.patch(
  '/:id',
  requireAuth,
  singleImageUpload('imageRecipe'),
  recipeFieldValidators,
  validate,
  persistImage('recipes'),
  recipesController.updateRecipe
);

router.delete('/:id', requireAuth, recipesController.deleteRecipe);

router.post(
  '/:id/comments',
  requireAuth,
  commentValidators,
  validate,
  commentsController.createComment
);

module.exports = router;
