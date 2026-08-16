const express = require('express');
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');
const { singleImageUpload, persistImage } = require('../middleware/upload');

const router = express.Router();

router.get('/:username', usersController.getPublicProfile);

router.patch(
  '/me',
  requireAuth,
  singleImageUpload('imageUser'),
  persistImage('users'),
  usersController.updateMe
);

module.exports = router;
