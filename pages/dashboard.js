import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  
  // --- NUEVO: Estado para controlar el formulario de añadir dispositivo ---
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      fetchDevices(token);
    } catch (e) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  const fetchDevices = async (token) => {
    const res = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        handleDeviceSelect(data[0]);
      }
    }
  };

  // --- NUEVO: Función para guardar un nuevo dispositivo ---
  const handleAddDevice = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceName: newDeviceName, deviceId: newDeviceId })
    });

    if (response.ok) {
        setShowAddDeviceModal(false); // Cierra el formulario
        setNewDeviceName('');
        setNewDeviceId('');
        fetchDevices(token); // Vuelve a cargar la lista de dispositivos para que aparezca el nuevo
    } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setHistory(fakeDeviceHistory);
    calculateStats(fakeDeviceHistory);
  };

  const calculateStats = (historyData) => {
    setStats({ distance: "4.8 km", stops: 1, stopTime: "10 min", tripTime: "2h 40m" });
  };

  const handleDownloadPDF = () => { /* ... como antes ... */ };
  const handleLogout = () => { /* ... como antes ... */ };

  if (!user) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <>
      <Head><title>Panel - CritoBots</title></Head>
      <div className="min-h-screen flex text-white">
        <aside className="w-72 bg-gray-900 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase text-gray-500">Mis Dispositivos</h2>
                {/* --- NUEVO: Botón para abrir el formulario --- */}
                <button onClick={() => setShowAddDeviceModal(true)} className="px-2 py-1 bg-teal-500 text-xs rounded hover:bg-teal-600">+</button>
            </div>
            <nav className="flex-grow">
                <ul>
                    {devices.map(device => (
                        <li key={device.id} className="mb-2">
                            <button onClick={() => handleDeviceSelect(device)} className={`w-full ...`}>📱 {device.name}</button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="mt-auto">
                <p className="text-sm text-gray-400">{user.email}</p>
                <button onClick={handleLogout} className="w-full mt-2 ...">Cerrar Sesión</button>
            </div>
        </aside>
        <main className="flex-1 p-8 bg-gray-800">
            {selectedDevice ? (
                // ... El contenido del mapa y estadísticas se mantiene igual ...
                <div className="lg:col-span-2">...</div>
            ) : (
                <div className="text-center text-gray-400">
                    <p>No tienes dispositivos registrados.</p>
                    <button onClick={() => setShowAddDeviceModal(true)} className="mt-4 px-4 py-2 bg-teal-500 rounded-lg">Añade tu primer dispositivo</button>
                </div>
            )}
        </main>

        {/* --- NUEVO: El formulario (modal) para añadir dispositivos --- */}
        {showAddDeviceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-bold mb-6">Añadir Nuevo Dispositivo</h2>
                    <form onSubmit={handleAddDevice}>
                        <div className="mb-4">
                            <label htmlFor="deviceName" className="block text-gray-400 mb-2">Nombre del Dispositivo</label>
                            <input type="text" id="deviceName" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} className="w-full p-2 bg-gray-700 rounded" required />
                            <p className="text-xs text-gray-500 mt-1">Ej: "Móvil de Juan", "Camioneta 1"</p>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="deviceId" className="block text-gray-400 mb-2">ID Único del Dispositivo</label>
                            <input type="text" id="deviceId" value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} className="w-full p-2 bg-gray-700 rounded" required />
                            <p className="text-xs text-gray-500 mt-1">Este es el ID que genera la App APK en el teléfono.</p>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => setShowAddDeviceModal(false)} className="px-4 py-2 bg-gray-600 rounded">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-teal-500 rounded">Guardar Dispositivo</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </>
  );
}

// El código de handleDownloadPDF, handleLogout, y fakeDeviceHistory debe ser completado
// basándonos en el código del paso anterior para que no falte nada.
