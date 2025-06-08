import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const Map = dynamic(
  () => import('../components/Map'),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [pois, setPois] = useState([]);

  const fetchPois = async (token) => {
    const response = await fetch('/api/pois', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setPois(data);
    }
  };

  const handleNewPoi = async (poiData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/pois', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(poiData)
    });
    if (response.ok) {
      fetchPois(token);
    } else {
      alert('Error al guardar el punto.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserEmail(payload.email);
      fetchPois(token);
    } catch (e) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Panel de Control - CritoBots</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300 hidden sm:block">{userEmail}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl mb-1">Mapa de Puntos de Interés</h2>
          <p className="text-sm text-gray-400 mb-4">Haz clic en el mapa para añadir un nuevo punto (cliente, proveedor, etc).</p>
          
          <Map pois={pois} onNewPoi={handleNewPoi} />
          
        </main>
      </div>
    </>
  );
}
