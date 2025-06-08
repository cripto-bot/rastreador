import { promises as fs } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Funciones para leer/escribir en las bases de datos
// (Estas funciones deberían estar en un archivo de utilidad, pero las mantenemos aquí por simplicidad)
async function readDb(fileName) {
    const dir = process.env.VERCEL ? '/tmp' : 'db';
    const filePath = path.join(dir, fileName);
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const fileContents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        return []; // Si no existe, devuelve un array vacío
    }
}
async function writeDb(fileName, data) {
    const dir = process.env.VERCEL ? '/tmp' : 'db';
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
    // Proteger la ruta con JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso no autorizado' });
    
    let decoded;
    try {
        decoded = jwt.verify(token, 'MI_CLAVE_SECRETA_SUPER_SECRETA');
    } catch (e) {
        return res.status(401).json({ message: 'Token inválido' });
    }
    
    const { userId } = decoded;

    // --- Método GET: Devolver la lista de dispositivos de ESTA empresa ---
    if (req.method === 'GET') {
        const allDevices = await readDb('dispositivos.json');
        const userDevices = allDevices.filter(d => d.userId === userId);
        return res.status(200).json(userDevices);
    }
    
    // --- Método POST: Añadir un nuevo dispositivo ---
    if (req.method === 'POST') {
        const { deviceId, deviceName } = req.body;
        if (!deviceId || !deviceName) return res.status(400).json({ message: 'Faltan datos del dispositivo.' });
        
        // Lógica de negocio: Verificar el límite del plan del usuario
        const empresas = await readDb('empresas.json');
        const empresa = empresas.find(e => e.id === userId);
        const allDevices = await readDb('dispositivos.json');
        const userDevicesCount = allDevices.filter(d => d.userId === userId).length;

        if (userDevicesCount >= empresa.limite_dispositivos) {
            return res.status(403).json({ message: 'Límite de dispositivos alcanzado. Contacte a soporte para ampliar su plan.' });
        }
        
        const newDevice = {
            id: `dev-${Date.now()}`,
            userId,
            deviceId, // El ID único del hardware del teléfono
            name: deviceName
        };
        
        allDevices.push(newDevice);
        await writeDb('dispositivos.json', allDevices);
        
        return res.status(201).json(newDevice);
    }

    return res.status(405).json({ message: 'Método no permitido' });
}
