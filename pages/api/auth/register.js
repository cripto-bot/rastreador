import { promises as fs } from 'fs';
import path from 'path';

// Función para obtener la ruta correcta del archivo de la base de datos
// Usa el directorio /tmp en Vercel, que es el único lugar donde se puede escribir.
function getDbPath() {
  // Si estamos en Vercel (entorno de producción), usamos /tmp.
  // Si estamos en local, usamos una carpeta 'db' normal.
  const dir = process.env.VERCEL ? '/tmp' : 'db';
  return path.join(dir, 'empresas.json');
}

// --- Nuestro motor principal (versión corregida) ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { nombre_empresa, email, contrasena } = req.body;

    if (!nombre_empresa || !email || !contrasena) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const dbPath = getDbPath();
    
    // Nos aseguramos de que el directorio exista (para el caso de Vercel)
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    // Leemos los datos actuales
    let dbData = [];
    try {
      const fileContents = await fs.readFile(dbPath, 'utf8');
      dbData = JSON.parse(fileContents);
    } catch (error) {
      // Si el archivo no existe, no pasa nada, se creará ahora.
    }

    // Creamos el objeto de la nueva empresa
    const nuevaEmpresa = {
      id: `empresa-${Date.now()}`,
      nombre_empresa: nombre_empresa,
      email: email,
      contrasena: contrasena, // Aún es inseguro, lo arreglaremos después.
      fecha_registro: new Date().toISOString(),
    };

    // Añadimos la nueva empresa a la lista
    dbData.push(nuevaEmpresa);

    // Escribimos el archivo completo de nuevo en la ruta correcta
    await fs.writeFile(dbPath, JSON.stringify(dbData, null, 2));

    // ¡Ahora sí enviamos la respuesta de éxito!
    return res.status(201).json({ message: '¡Cuenta creada y guardada con éxito!' });

  } catch (error) {
    // Si algo sale mal, lo registramos en los logs de Vercel
    console.error('ERROR EN LA API DE REGISTRO:', error);
    // Y enviamos una respuesta de error al usuario
    return res.status(500).json({ message: 'Hubo un error en el servidor al procesar tu solicitud.' });
  }
}
