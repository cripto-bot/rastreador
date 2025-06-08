import { promises as fs } from 'fs';
import path from 'path';

// (Aquí irían las funciones readDb y writeDb)
async function readDb(fileName) { /* ... */ }
async function writeDb(fileName, data) { /* ... */ }

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }
    
    // ¡IMPORTANTE! Esta API NO usa JWT. El teléfono no está "logueado".
    // La seguridad se basa en que el deviceId es único y está registrado a una empresa.
    // En un producto final, se añadiría una API Key secreta.
    
    const { deviceId, lat, lng } = req.body;
    if (!deviceId || !lat || !lng) {
        return res.status(400).json({ message: 'Faltan datos de ubicación.' });
    }
    
    // Verificamos si el dispositivo existe en nuestra base de datos
    const allDevices = await readDb('dispositivos.json');
    const deviceExists = allDevices.some(d => d.deviceId === deviceId);
    
    if (!deviceExists) {
        return res.status(403).json({ message: 'Dispositivo no registrado.' });
    }
    
    // Creamos el registro de ubicación con zona horaria de Paraguay
    const now = new Date();
    const timestampPYT = new Date(now.toLocaleString('en-US', { timeZone: 'America/Asuncion' }));

    const newLocation = {
        id: `loc-${Date.now()}`,
        deviceId,
        lat,
        lng,
        timestamp: timestampPYT.toISOString() // Guardamos en formato estándar ISO
    };
    
    const ubicaciones = await readDb('ubicaciones.json');
    ubicaciones.push(newLocation);
    await writeDb('ubicaciones.json', ubicaciones);
    
    res.status(200).json({ message: 'Ubicación recibida.' });
}
