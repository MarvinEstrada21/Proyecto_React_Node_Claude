require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API escuchando en http://${HOST}:${PORT}`);
});
