const express = require('express');
const authController = require('../controllers/authController');
const { registerValidators, loginValidators } = require('../validators/authValidators');
const validate = require('../validators/validate');
const { requireAuth } = require('../middleware/auth');
const { singleImageUpload, persistImage } = require('../middleware/upload');
const { loginIpLimiter, loginAccountLimiter } = require('../middleware/loginRateLimit');

const router = express.Router();

router.post(
  '/register',
  singleImageUpload('imageUser'),
  registerValidators,
  validate,
  persistImage('users'),
  authController.register
);

router.post(
  '/login',
  loginIpLimiter,
  loginAccountLimiter,
  loginValidators,
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
