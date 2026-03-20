// src/Services/emailService.js
async function enviarCorreo(datos) {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/enviar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });

  if (!response.ok) throw new Error('Error al enviar correo');
  return await response.json();
}

// Export con CommonJS
module.exports = { enviarCorreo };
