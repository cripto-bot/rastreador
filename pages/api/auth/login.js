import { promises as fs } from 'fs';
import path from 'path';

// Reutilizamos la misma lógica para encontrar nuestra base de datos
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
      // Si no existe la base de datos, nadie puede iniciar sesión
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Buscamos al usuario por su email
    const user = dbData.find(u => u.email === email);

    // Verificamos si el usuario existe Y si la contraseña coincide
    if (!user || user.contrasena !== contrasena) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    // ¡Éxito! El usuario y la contraseña son correctos.
    // Más adelante, aquí generaremos un "token" de sesión.
    return res.status(200).json({ message: 'Inicio de sesión exitoso.' });

  } catch (error) {
    console.error('ERROR EN API DE LOGIN:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
