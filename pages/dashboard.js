import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const Map = dynamic(
  () => import('../components/Map'), // La ruta a nuestro componente de mapa
  { ssr: false }
);

// --- DATOS DE SIMULACIÓN ---
// Como aún no tenemos un dispositivo real, simularemos el historial de un día.
const fakeDeviceHistory = [
    { lat: -25.2825, lng: -57.633, timestamp: '2023-11-01T08:05:00-03:00' }, // Inicio 8:05 AM PYT
    { lat: -25.278, lng: -57.62, timestamp: '2023-11-01T08:30:00-03:00' },
    { lat: -25.292, lng: -57.61, timestamp: '2023-11-01T09:15:00-03:00' }, // Parada
    { lat: -25.292, lng: -57.61, timestamp: '2023-11-01T09:25:00-03:00' }, // Fin de parada
    { lat: -25.31, lng: -57.59, timestamp: '2023-11-01T10:00:00-03:00' },
    { lat: -25.325, lng: -57.575, timestamp: '2023-11-01T10:45:00-03:00' }, // Fin del día
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (e) {
      localStorage.removeItem('token');
      router.push('/login');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;
  }

  // --- CÁLCULOS DE ESTADÍSTICAS (SIMULACIÓN) ---
  const totalDistance = "4.8 km"; // Simulado
  const totalStops = 1; // Simulado
  const totalStopTime = "10 min"; // Simulado
  const totalTripTime = "2h 40m"; // Simulado

  return (
    <>
      <Head>
        <title>Panel de Control - CritoBots</title>
      </Head>
      <div className="min-h-screen flex text-white">
        {/* ===== BARRA LATERAL (SIDEBAR) ===== */}
        <aside className="w-64 bg-gray-900 p-6 flex flex-col">
          <h1 className="text-2xl font-bold text-teal-400 mb-8">CritoBots</h1>
          <nav className="flex-grow">
            <ul>
              <li className="mb-4">
                <a href="#" className="flex items-center p-2 bg-gray-700 rounded-lg">
                  <span className="mr-3">📍</span>Dispositivos
                </a>
              </li>
              <li className="mb-4">
                <a href="#" className="flex items-center p-2 hover:bg-gray-700 rounded-lg">
                  <span className="mr-3">📈</span>Reportes
                </a>
              </li>
               <li className="mb-4">
                <a href="#" className="flex items-center p-2 hover:bg-gray-700 rounded-lg">
                  <span className="mr-3">🎯</span>Puntos de Interés
                </a>
              </li>
            </ul>
          </nav>
          <div className="mt-auto">
            <p className="text-sm text-gray-400">{user.email}</p>
            <button 
              onClick={handleLogout}
              className="w-full mt-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold"
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <main className="flex-1 p-8 bg-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- Columna Izquierda: Mapa --- */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Recorrido del Dispositivo "Móvil 1" (Hoy)</h2>
              <div className="h-[65vh] w-full">
                {/* El mapa ahora recibirá el historial para dibujarlo */}
                <Map history={fakeDeviceHistory} />
              </div>
            </div>

            {/* --- Columna Derecha: Estadísticas --- */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-6">Resumen del Día</h3>
              <div className="space-y-4 text-gray-300">
                <div>
                  <p className="text-sm text-gray-400">Distancia Total</p>
                  <p className="text-2xl font-semibold text-teal-400">{totalDistance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Paradas</p>
                  <p className="text-2xl font-semibold">{totalStops}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tiempo Total Detenido</p>
                  <p className="text-2xl font-semibold">{totalStopTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Duración del Recorrido</p>
                  <p className="text-2xl font-semibold">{totalTripTime}</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
