const { body } = require('express-validator');

const USERNAME_RE = /^[a-zA-Z0-9_.-]+$/;

const registerValidators = [
  body('username')
    .trim()
    .notEmpty().withMessage('El username es obligatorio.')
    .bail()
    .isLength({ min: 3, max: 100 }).withMessage('El username debe tener entre 3 y 100 caracteres.')
    .bail()
    .matches(USERNAME_RE).withMessage('El username solo puede contener letras, numeros, punto, guion y guion bajo.'),
  body('nameUser')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .bail()
    .isLength({ max: 100 }).withMessage('El nombre no puede superar los 100 caracteres.'),
  body('lastnameUser')
    .trim()
    .notEmpty().withMessage('El apellido es obligatorio.')
    .bail()
    .isLength({ max: 100 }).withMessage('El apellido no puede superar los 100 caracteres.'),
  body('password')
    .notEmpty().withMessage('La contrasena es obligatoria.')
    .bail()
    .isLength({ min: 8, max: 72 }).withMessage('La contrasena debe tener entre 8 y 72 caracteres.'),
];

const loginValidators = [
  body('username').trim().notEmpty().withMessage('El username es obligatorio.'),
  body('password').notEmpty().withMessage('La contrasena es obligatoria.'),
];

module.exports = { registerValidators, loginValidators };
