import dotenv from 'dotenv';
import dns from 'node:dns';
dotenv.config();

import app from './server.js';
import connection from './database.js';

// Evita fallos SRV de DNS local con MongoDB Atlas (mongodb+srv).
dns.setServers(['8.8.8.8', '1.1.1.1']);

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
