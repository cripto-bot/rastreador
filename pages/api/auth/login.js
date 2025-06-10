import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

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

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'MI_CLAVE_SECRETA_SUPER_SECRETA',
      { expiresIn: '8h' }
    );

    return res.status(200).json({ message: 'Inicio de sesión exitoso.', token: token });

  } catch (error) {
    console.error('ERROR EN API DE LOGIN:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
