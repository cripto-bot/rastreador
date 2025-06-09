import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

// --- FUNCIONES DE CÁLCULO REALES ---

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ distance: "0.0 km", stops: 0, stopTime: "0h 0m", tripTime: "0h 0m" });
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      if (data.length > 0) {
        handleDeviceSelect(data[0]);
      }
    }
  };

  const handleDeviceSelect = async (device) => {
    setSelectedDevice(device);
    setIsLoadingHistory(true);
    setHistory([]);
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/history?deviceId=${device.deviceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const historyData = await res.json();
      setHistory(historyData);
      calculateStats(historyData);
    }
    setIsLoadingHistory(false);
    setIsSidebarOpen(false); // Cierra el menú al seleccionar un dispositivo
  };

  const handleAddDevice = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ deviceName: newDeviceName, deviceId: newDeviceId })
    });
    if (response.ok) {
        setShowAddDeviceModal(false);
        setNewDeviceName('');
        setNewDeviceId('');
        fetchDevices(token);
    } else {
        const result = await response.json();
        alert(`Error: ${result.message}`);
    }
  };

  const calculateStats = (historyData) => {
    if (historyData.length < 2) {
      setStats({ distance: "0.0 km", stops: 0, stopTime: "0h 0m", tripTime: "0h 0m" });
      return;
    }

    let totalDistance = 0, totalStopTimeMs = 0, stopCount = 0;
    const STOP_RADIUS_KM = 0.05, STOP_TIME_MS = 300000;
    let potentialStopTime = 0;

    for (let i = 1; i < historyData.length; i++) {
      const p1 = historyData[i - 1], p2 = historyData[i];
      const distance = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      totalDistance += distance;
      const timeDiff = new Date(p2.timestamp) - new Date(p1.timestamp);
      if (distance < STOP_RADIUS_KM) potentialStopTime += timeDiff;
      else {
        if (potentialStopTime >= STOP_TIME_MS) {
          stopCount++;
          totalStopTimeMs += potentialStopTime;
        }
        potentialStopTime = 0;
      }
    }
    if (potentialStopTime >= STOP_TIME_MS) {
        stopCount++;
        totalStopTimeMs += potentialStopTime;
    }
    const tripTimeMs = new Date(historyData[historyData.length - 1].timestamp) - new Date(historyData[0].timestamp);
    setStats({
        distance: `${totalDistance.toFixed(1)} km`,
        stops: stopCount,
        stopTime: formatDuration(totalStopTimeMs),
        tripTime: formatDuration(tripTimeMs)
    });
  };

  const handleDownloadPDF = () => {
    if (!selectedDevice) return;
    const doc = new jsPDF();
    const fechaParaguay = new Date().toLocaleDateString('es-PY', { timeZone: 'America/Asuncion' });
    doc.setFontSize(18); doc.text("Reporte de Actividad - CritoBots", 14, 22);
    doc.setFontSize(11); doc.text(`Dispositivo: ${selectedDevice.name}`, 14, 32);
    doc.text(`Fecha: ${fechaParaguay}`, 14, 38);
    doc.setFontSize(12); doc.text("Resumen del Día:", 14, 50);
    doc.text(`- Distancia Total: ${stats.distance}`, 16, 58);
    doc.text(`- Total de Paradas: ${stats.stops}`, 16, 64);
    doc.text(`- Tiempo Detenido: ${stats.stopTime}`, 16, 70);
    doc.text(`- Duración del Recorrido: ${stats.tripTime}`, 16, 76);
    doc.save(`reporte-${selectedDevice.name}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <>
      <Head>
        <title>Panel - CritoBots</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="flex h-screen overflow-hidden bg-gray-800 text-white">
        
        {/* --- BARRA LATERAL (SIDEBAR) --- */}
        <aside className={`absolute md:relative inset-y-0 left-0 bg-gray-900 w-72 p-6 flex-col flex-shrink-0
          transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          
            <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase text-gray-500">Mis Dispositivos</h2>
                <button onClick={() => setShowAddDeviceModal(true)} className="px-2 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600">+</button>
            </div>
            <nav className="flex-grow overflow-y-auto">
                <ul>
                    {devices.map(device => (
                        <li key={device.id} className="mb-2">
                            <button 
                                onClick={() => handleDeviceSelect(device)}
                                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${selectedDevice?.id === device.id ? 'bg-teal-500' : 'hover:bg-gray-700'}`}
                            >
                                <span className="mr-3 text-lg">📱</span>{device.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
                <button onClick={handleLogout} className="w-full mt-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold">Cerrar Sesión</button>
            </div>
        </aside>
        
        {/* --- CONTENEDOR PRINCIPAL que incluye la barra superior y el contenido --- */}
        <div className="flex flex-col flex-1 w-full overflow-hidden">
            <header className="bg-gray-800 text-white flex justify-end md:hidden">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 focus:outline-none focus:bg-gray-700">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {selectedDevice ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-bold mb-4">Recorrido de "{selectedDevice.name}"</h2>
                            <div className="h-[65vh] w-full bg-gray-700 rounded-lg flex items-center justify-center">
                                {isLoadingHistory ? <p>Cargando historial...</p> : <Map history={history} />}
                            </div>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-lg">
                           <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold">Resumen del Día</h3>
                                <button onClick={handleDownloadPDF} className="text-teal-400 text-sm hover:underline">Descargar PDF</button>
                            </div>
                            <div className="space-y-4 text-gray-300">
                                <div><p className="text-sm text-gray-400">Distancia</p><p className="font-semibold text-xl text-teal-400">{stats.distance}</p></div>
                                <div><p className="text-sm text-gray-400">Paradas</p><p className="font-semibold text-xl">{stats.stops}</p></div>
                                <div><p className="text-sm text-gray-400">Tiempo Detenido</p><p className="font-semibold text-xl">{stats.stopTime}</p></div>
                                <div><p className="text-sm text-gray-400">Duración Recorrido</p><p className="font-semibold text-xl">{stats.tripTime}</p></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-400">
                        <div>
                            <p>No tienes dispositivos registrados.</p>
                            <button onClick={() => setShowAddDeviceModal(true)} className="mt-4 px-4 py-2 bg-teal-500 rounded-lg">Añade tu primer dispositivo</button>
                        </div>
                    </div>
                )}
            </main>
        </div>

        {showAddDeviceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 9999 }}>
               <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-xl font-bold mb-6">Añadir Nuevo Dispositivo</h2>
                    <form onSubmit={handleAddDevice}>
                        <div className="mb-4">
                            <label htmlFor="deviceName" className="block text-gray-400 mb-2">Nombre del Dispositivo</label>
                            <input type="text" id="deviceName" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} className="w-full p-2 bg-gray-700 rounded" required />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="deviceId" className="block text-gray-400 mb-2">ID Único del Dispositivo</label>
                            <input type="text" id="deviceId" value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} className="w-full p-2 bg-gray-700 rounded" required />
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
