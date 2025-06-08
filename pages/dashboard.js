import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf'; // Importamos la librería para PDF

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});

  // --- Carga inicial de datos ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      fetchDevices(token); // Al cargar, pedimos la lista de dispositivos
    } catch (e) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  // --- Funciones de API ---
  const fetchDevices = async (token) => {
    const res = await fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setDevices(data);
      if (data.length > 0) {
        // Selecciona el primer dispositivo por defecto
        handleDeviceSelect(data[0]);
      }
    }
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    // Aquí llamaríamos a una API para obtener el historial real del dispositivo
    // Por ahora, seguimos usando los datos simulados para ese dispositivo.
    setHistory(fakeDeviceHistory); // `fakeDeviceHistory` debe estar definido como antes
    calculateStats(fakeDeviceHistory);
  };
  
  const calculateStats = (historyData) => {
    // Lógica real para calcular estadísticas iría aquí...
    setStats({
      distance: "4.8 km",
      stops: 1,
      stopTime: "10 min",
      tripTime: "2h 40m"
    });
  };

  const handleDownloadPDF = () => {
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

  const handleLogout = () => { /* ... como antes ... */ };

  if (!user) return <div>Cargando...</div>;

  // --- El JSX del nuevo panel ---
  return (
    <>
      <Head><title>Panel - CritoBots</title></Head>
      <div className="min-h-screen flex text-white">
        <aside className="w-72 bg-gray-900 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
            <h2 className="text-xs uppercase text-gray-500 mb-4">Mis Dispositivos</h2>
            <nav className="flex-grow">
                <ul>
                    {devices.map(device => (
                        <li key={device.id} className="mb-2">
                            <button 
                                onClick={() => handleDeviceSelect(device)}
                                className={`w-full flex items-center p-3 rounded-lg text-left ${selectedDevice?.id === device.id ? 'bg-teal-500' : 'hover:bg-gray-700'}`}
                            >
                                <span className="mr-3">📱</span>{device.name}
                            </button>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Recorrido de "{selectedDevice.name}"</h2>
                        <div className="h-[65vh] w-full"><Map history={history} /></div>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Resumen del Día</h3>
                            <button onClick={handleDownloadPDF} className="text-teal-400 text-sm hover:underline">Descargar PDF</button>
                        </div>
                        <div className="space-y-4 text-gray-300">
                            <p>Distancia: <span className="font-semibold text-xl">{stats.distance}</span></p>
                            <p>Paradas: <span className="font-semibold text-xl">{stats.stops}</span></p>
                            {/* ... más estadísticas ... */}
                        </div>
                    </div>
                </div>
            ) : (
                <div>Selecciona un dispositivo para ver su información.</div>
            )}
        </main>
      </div>
    </>
  );
}

// No olvides definir fakeDeviceHistory aquí si lo usas para pruebas
const fakeDeviceHistory = [ /* ... los mismos datos de antes ... */ ];
