const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { generateFilename, EXT_BY_MIME } = require('../utils/generateFilename');

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

// Guarda en memoria: el nombre y tipo reales se determinan despues de leer
// los bytes del archivo, nunca a partir de lo que el cliente declare.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
});

function singleImageUpload(fieldName) {
  return memoryUpload.single(fieldName);
}

// Middleware de fabrica: valida los bytes reales del archivo subido y lo
// escribe en disco con un nombre generado por el servidor, dentro de la
// subcarpeta indicada (nunca usando datos provistos por el cliente).
function persistImage(subfolder) {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        req.uploadedImagePath = null;
        return next();
      }

      // file-type es un paquete ESM puro; se importa dinamicamente desde
      // este modulo CommonJS.
      const { fileTypeFromBuffer } = await import('file-type');
      const detected = await fileTypeFromBuffer(req.file.buffer);

      if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
        throw new ApiError(400, 'El archivo debe ser una imagen JPG, PNG o WEBP valida.');
      }

      const filename = generateFilename(detected.mime);
      const targetDir = path.join(uploadsRoot, subfolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const targetPath = path.join(targetDir, filename);

      await fs.promises.writeFile(targetPath, req.file.buffer);

      req.uploadedImagePath = `/uploads/${subfolder}/${filename}`;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { singleImageUpload, persistImage, MAX_SIZE_BYTES, EXT_BY_MIME };
