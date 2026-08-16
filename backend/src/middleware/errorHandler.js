const multer = require('multer');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado.' });
}

// Manejador central de errores. Nunca expone stack traces, mensajes de
// MySQL ni rutas del sistema de archivos al cliente.
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'La imagen supera el tamano maximo permitido (2 MB).' });
    }
    return res.status(400).json({ error: 'No se pudo procesar el archivo enviado.' });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Ocurrio un error interno. Intenta de nuevo mas tarde.' });
}

module.exports = { notFoundHandler, errorHandler };
