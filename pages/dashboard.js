import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');

  // --- EL GUARDIA DE SEGURIDAD ---
  // Este código se ejecuta en cuanto la página intenta cargar.
  useEffect(() => {
    // Buscamos la "llave" (token) en el bolsillo del navegador.
    const token = localStorage.getItem('token');
    
    // SI NO HAY LLAVE: ¡Fuera de aquí! Te mandamos a la página de login.
    if (!token) {
      router.push('/login');
    } else {
      // Si hay llave, la "decodificamos" para saludar al usuario.
      // Nota: Esto es una decodificación simple, no una verificación de seguridad.
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.email);
      } catch (e) {
        // Si la llave está corrupta, también lo echamos.
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, []); // El array vacío [] significa que esto se ejecuta solo una vez.

  const handleLogout = () => {
    // Para cerrar sesión, simplemente tiramos la "llave" a la basura.
    localStorage.removeItem('token');
    router.push('/login'); // Y lo mandamos de vuelta al login.
  };

  return (
    <>
      <Head>
        <title>Panel de Control - CritoBots</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">{userEmail}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 font-semibold"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main>
          <h2 className="text-xl">Bienvenido a tu panel.</h2>
          <p className="mt-2 text-gray-400">Aquí verás tus dispositivos y el mapa.</p>
          {/* Próximamente: El mapa y la lista de dispositivos irán aquí. */}
        </main>
      </div>
    </>
  );
}
