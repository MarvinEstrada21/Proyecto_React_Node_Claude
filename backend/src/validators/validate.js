const { validationResult } = require('express-validator');

// Ejecuta las reglas de express-validator y, si hay errores, responde 400
// con un objeto { campo: mensaje } para que el frontend pueda mostrarlos
// junto a cada input.
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = {};
  for (const err of result.array()) {
    if (!details[err.path]) {
      details[err.path] = err.msg;
    }
  }

  res.status(400).json({ error: 'Datos invalidos.', details });
}

module.exports = validate;
