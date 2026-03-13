import dotenv from 'dotenv';
dotenv.config();

import app from './server.js';
import connection from './database.js';

const startServer = async () => {
  try {
    await connection();
    app.listen(app.get('port'), '0.0.0.0', () => {
      console.log(`✅ Servidor corriendo en http://localhost:${app.get('port')}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor por error de base de datos.');
    process.exit(1);
  }
};

startServer();
