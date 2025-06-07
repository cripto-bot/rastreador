import { promises as fs } from 'fs';
import path from 'path';

// Esta función nos ayudará a escribir en nuestra base de datos
async function writeToDatabase(data) {
  // Definimos dónde se guardará nuestra base de datos.
  // process.cwd() es la carpeta raíz de nuestro proyecto en Vercel.
  const dbDirectory = path.join(process.cwd(), 'db');
  const filePath = path.join(dbDirectory, 'empresas.json');

  // Nos aseguramos de que la carpeta 'db' exista
  await fs.mkdir(dbDirectory, { recursive: true });

  // Leemos los datos actuales
  let dbData = [];
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    dbData = JSON.parse(fileContents);
  } catch (error) {
    // Si el archivo no existe, no hacemos nada, se creará después.
  }
  
  // Añadimos los nuevos datos
  dbData.push(data);
  
  // Escribimos el archivo completo de nuevo
  await fs.writeFile(filePath, JSON.stringify(dbData, null, 2));
}


// --- Nuestro motor principal ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre_empresa, email, contrasena } = req.body;

  if (!nombre_empresa || !email || !contrasena) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  // ¡Aquí está la magia! Creamos el objeto de la nueva empresa
  const nuevaEmpresa = {
    id: `empresa-${Date.now()}`,
    nombre_empresa: nombre_empresa,
    email: email,
    contrasena: contrasena, // IMPORTANTE: Esto es inseguro, lo arreglaremos después.
    fecha_registro: new Date().toISOString(),
  };

  // Usamos nuestra nueva función para guardar la empresa
  await writeToDatabase(nuevaEmpresa);

  // Enviamos una respuesta de éxito real
  res.status(201).json({ message: '¡Cuenta creada y guardada con éxito!' });
}
