import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

function getDbPath() {
  const dir = process.env.VERCEL ? '/tmp' : 'db';
  return path.join(dir, 'pois.json');
}

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, 'MI_CLAVE_SECRETA_SUPER_SECRETA');
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  const dbPath = getDbPath();
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  if (req.method === 'GET') {
    try {
      const fileContents = await fs.readFile(dbPath, 'utf8');
      const allPois = JSON.parse(fileContents);
      const userPois = allPois.filter(poi => poi.userId === decoded.userId);
      return res.status(200).json(userPois);
    } catch (error) {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { nombre, lat, lng } = req.body;
    if (!nombre || !lat || !lng) {
      return res.status(400).json({ message: 'Faltan datos.' });
    }

    const newPoi = {
      id: `poi-${Date.now()}`,
      userId: decoded.userId,
      nombre,
      lat,
      lng
    };

    let dbData = [];
    try {
      const fileContents = await fs.readFile(dbPath, 'utf8');
      dbData = JSON.parse(fileContents);
    } catch (error) {}

    dbData.push(newPoi);
    await fs.writeFile(dbPath, JSON.stringify(dbData, null, 2));

    return res.status(201).json(newPoi);
  }

  return res.status(405).json({ message: 'Método no permitido' });
}
