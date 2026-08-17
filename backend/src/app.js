const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const recipesRoutes = require('./routes/recipes.routes');
const commentsRoutes = require('./routes/comments.routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// FRONTEND_ORIGIN admite una lista separada por comas (ej. para permitir a
// la vez localhost y la IP de red desde donde se accede via VM). Sigue sin
// ser un comodin: solo se aceptan los origenes listados explicitamente.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origen no permitido por CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/comments', commentsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
