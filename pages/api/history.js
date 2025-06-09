import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

async function readDb(fileName) {
    const dir = process.env.VERCEL ? '/tmp' : 'db';
    const filePath = path.join(dir, fileName);
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const fileContents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        return [];
    }
}

export default async function handler(req, res) {
    // 1. Proteger la ruta con JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso no autorizado' });
    
    try {
        jwt.verify(token, 'MI_CLAVE_SECRETA_SUPER_SECRETA');
    } catch (e) {
        return res.status(401).json({ message: 'Token inválido' });
    }

    // 2. Obtener el ID del dispositivo que queremos consultar
    const { deviceId } = req.query;
    if (!deviceId) {
        return res.status(400).json({ message: 'Se requiere el ID del dispositivo.' });
    }

    // 3. Leer la base de datos de ubicaciones
    const allLocations = await readDb('ubicaciones.json');
    
    // 4. Filtrar solo las ubicaciones del dispositivo solicitado
    const deviceHistory = allLocations.filter(loc => loc.deviceId === deviceId);

    // Opcional: Aquí se podría añadir un filtro por fecha. Por ahora, devolvemos todo el historial.

    // 5. Devolver el historial encontrado
    return res.status(200).json(deviceHistory);
}
