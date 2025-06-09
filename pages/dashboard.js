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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- EFECTO INICIAL ---
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

  // --- FUNCIONES DE API ---
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
    setIsSidebarOpen(false);
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
    setStats({
        distance: "Calculando...", stops: "Calculando...",
        stopTime: "Calculando...", tripTime: "Calculando...",
    });
  };

  const handleDownloadPDF = () => { /* ... como antes ... */ };
  const handleLogout = () => { /* ... como antes ... */ };

  if (!user) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;

  // --- RENDERIZADO (JSX) CON LA ESTRUCTURA CORREGIDA ---
  return (
    <>
      <Head>
        <title>Panel - CritoBots</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="flex h-screen bg-gray-800 text-white">
        
        {/* --- BARRA LATERAL (SIDEBAR) con lógica Z-INDEX para móviles --- */}
        <aside className={`bg-gray-900 w-72 flex-shrink-0 p-6 flex-col
          fixed h-full md:relative md:flex
          transition-transform duration-300 ease-in-out z-40  
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          
            <h1 className="text-2xl font-bold text-teal-400 mb-8 hidden md:block">CritoBots</h1>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase text-gray-500">Mis Dispositivos</h2>
                <button onClick={() => setShowAddDeviceModal(true)} className="px-2 py-1 bg-teal-500 text-white text-xs rounded hover:bg-teal-600">+</button>
            </div>
            <nav className="flex-grow overflow-y-auto">
                <ul>
                    {devices.map(device => (
                        <li key={device.id} className="mb-2">
                            <button onClick={() => handleDeviceSelect(device)} className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${selectedDevice?.id === device.id ? 'bg-teal-500' : 'hover:bg-gray-700'}`}>
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
        
        <div className="flex flex-col flex-1">
            {/* --- BARRA SUPERIOR (HEADER) con el botón de hamburguesa --- */}
            <header className="bg-gray-800 text-white flex justify-between md:hidden sticky top-0 z-10">
                <a href="#" className="block p-4 font-bold text-teal-400">CritoBots</a>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-4 focus:outline-none focus:bg-gray-700">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </header>

            {/* --- CONTENIDO PRINCIPAL --- */}
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
                            {/* ... Panel de estadísticas como antes ... */}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-gray-400">
                        {/* ... Mensaje de añadir dispositivo como antes ... */}
                    </div>
                )}
            </main>
        </div>

        {/* FORMULARIO MODAL (sin cambios, pero con el z-index correcto) */}
        {showAddDeviceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center" style={{ zIndex: 9999 }}>
                {/* ... El formulario modal es igual */}
            </div>
        )}
      </div>
    </>
  );
}
