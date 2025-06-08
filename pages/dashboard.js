import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic'; // Importamos la función para carga dinámica

// --- CARGA DINÁMICA DEL MAPA ---
// Esto es muy importante. Le decimos a Next.js que cargue el mapa
// solo en el navegador del cliente, no en el servidor.
const Map = dynamic(
  () => import('../components/Map'), // La ruta a nuestro componente
  { ssr: false } // ¡La magia está aquí! Desactiva la renderización en servidor para el mapa.
);

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email);
      } catch (e) {
        localStorage.removeItem('token');
        router.push('/login');
      }
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
          <h2 className="text-xl mb-4">Mapa de Dispositivos</h2>
          {/* ¡Aquí llamamos a nuestro componente de mapa! */}
          <Map />
        </main>
      </div>
    </>
  );
}
