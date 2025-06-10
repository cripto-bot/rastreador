import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken'; // Importamos la herramienta para crear la "llave"

// Función para obtener la ruta correcta de la base de datos
function getDbPath() {
  // En Vercel, el único lugar donde se puede escribir es /tmp
  const dir = process.env.VERCEL ? '/tmp' : 'db';
  return path.join(dir, 'empresas.json');
}

export default async function handler(req, res) {
  // Nos aseguramos de que la petición sea por el método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Obtenemos el email y la contraseña que envió el formulario
    const { email, contrasena } = req.body;
    const dbPath = getDbPath();

    let dbData = [];
    try {
      // Intentamos leer la base de datos de empresas
      const fileContents = await fs.readFile(dbPath, 'utf8');
      dbData = JSON.parse(fileContents);
    } catch (error) {
      // Si el archivo no existe, significa que no hay usuarios, por lo tanto, las credenciales son inválidas.
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Buscamos en la base de datos si existe un usuario con ese email
    const user = dbData.find(u => u.email === email);

    // Verificamos si encontramos al usuario Y si la contraseña coincide
    // En un proyecto real, la contraseña estaría "hasheada" (encriptada) con bcrypt.
    if (!user || user.contrasena !== contrasena) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    // ¡ÉXITO! Si las credenciales son correctas, creamos la "llave" (token).
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Guardamos información útil dentro del token
      'MI_CLAVE_SECRETA_SUPER_SECRETA', // Esta es la clave para firmar el token. Debe ser secreta.
      { expiresIn: '8h' } // El token será válido por 8 horas
    );

    // Enviamos una respuesta exitosa junto con el token.
    return res.status(200).json({ message: 'Inicio de sesión exitoso.', token: token });

  } catch (error) {
    // Si ocurre cualquier otro error, lo registramos y enviamos una respuesta genérica.
    console.error('ERROR EN API DE LOGIN:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
