import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function DashboardPage() {
  // --- ESTADOS DE LA PÁGINA ---
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // --- EFECTO INICIAL PARA VERIFICAR SESIÓN Y CARGAR DATOS ---
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

  // --- FUNCIONES PARA COMUNICARSE CON LA API ---
  const fetchDevices = async (token) => {
    const res = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setDevices(data);
      if (data.length > 0) {
        handleDeviceSelect(data[0]); // Selecciona el primer dispositivo por defecto
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
  
  // --- FUNCIONES AUXILIARES ---
  const calculateStats = (historyData) => {
    if (historyData.length < 2) {
      setStats({ distance: "0 km", stops: 0, stopTime: "0 min", tripTime: "0 min" });
      return;
    }
    // En el futuro, aquí irá la lógica de cálculo real
    setStats({
        distance: "Calculando...",
        stops: "Calculando...",
        stopTime: "Calculando...",
        tripTime: "Calculando...",
    });
  };

  const handleDownloadPDF = () => {
    if (!selectedDevice) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Actividad - CritoBots", 14, 22);
    doc.setFontSize(11);
    doc.text(`Dispositivo: ${selectedDevice.name}`, 14, 32);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PY')}`, 14, 38);
    doc.setFontSize(12);
    doc.text("Resumen del Día:", 14, 50);
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

  // --- RENDERIZADO DE LA PÁGINA (JSX) ---
  return (
    <>
      <Head><title>Panel - CritoBots</title></Head>
      <div className="min-h-screen flex text-white">
        <aside className="w-72 bg-gray-900 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase text-gray-500">Mis Dispositivos</h2>
                <button onClick={() => setShowAddDeviceModal(true)} className="px-2 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600">+</button>
            </div>
            <nav className="flex-grow">
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
            <div className="mt-auto">
                <p className="text-sm text-gray-400">{user.email}</p>
                <button onClick={handleLogout} className="w-full mt-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold">
                  Cerrar Sesión
                </button>
            </div>
        </aside>
        <main className="flex-1 p-8 bg-gray-800">
            {selectedDevice ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Recorrido de "{selectedDevice.name}"</h2>
                        <div className="h-[65vh] w-full bg-gray-700 rounded-lg flex items-center justify-center">
                            {isLoadingHistory ? (
                                <p className="p-4">Cargando historial...</p>
                            ) : (
                                <Map history={history} />
                            )}
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
