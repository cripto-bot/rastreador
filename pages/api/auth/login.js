import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken'; // Importamos la nueva herramienta

// La función para encontrar la DB sigue igual
function getDbPath() {
  const dir = process.env.VERCEL ? '/tmp' : 'db';
  return path.join(dir, 'empresas.json');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { email, contrasena } = req.body;
    const dbPath = getDbPath();
    let dbData = [];

    try {
      const fileContents = await fs.readFile(dbPath, 'utf8');
      dbData = JSON.parse(fileContents);
    } catch (error) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = dbData.find(u => u.email === email);

    if (!user || user.contrasena !== contrasena) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    // --- ¡LA MAGIA OCURRE AQUÍ! ---
    // Si el login es exitoso, creamos la "llave" (token).
    // Guardamos el ID y el email del usuario dentro del token.
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'MI_CLAVE_SECRETA_SUPER_SECRETA', // Esta es una clave secreta, en un proyecto real iría en un lugar seguro.
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // Enviamos la "llave" de vuelta al navegador.
    return res.status(200).json({ message: 'Inicio de sesión exitoso.', token: token });

  } catch (error) {
    console.error('ERROR EN API DE LOGIN:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
