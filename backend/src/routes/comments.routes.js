const express = require('express');
const commentsController = require('../controllers/commentsController');
const { commentValidators } = require('../validators/recipeValidators');
const validate = require('../validators/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.patch('/:id', requireAuth, commentValidators, validate, commentsController.updateComment);
router.delete('/:id', requireAuth, commentsController.deleteComment);

module.exports = router;
