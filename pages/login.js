import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router'; // Importamos el enrutador

export default function LoginPage() {
  const [status, setStatus] = useState('');
  const router = useRouter(); // Inicializamos el enrutador

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('Verificando credenciales...');

    const formData = {
      email: event.target.email.value,
      contrasena: event.target.contrasena.value,
    };

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      // --- ¡CAMBIOS IMPORTANTES AQUÍ! ---
      // 1. Guardamos la "llave" (token) en el bolsillo del navegador.
      localStorage.setItem('token', result.token);
      
      setStatus('¡Inicio de sesión exitoso! Redirigiendo...');
      
      // 2. Redirigimos al usuario al nuevo panel de control.
      router.push('/dashboard');
    } else {
      setStatus('Error: ' + result.message);
    }
  };
  
  // El resto del código del formulario es el mismo...
  return (
    // ... (todo el JSX del formulario se mantiene igual que antes)
    <>
      <Head>
        <title>Iniciar Sesión - CritoBots</title>
      </Head>
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="email">Email</label>
              <input className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500" type="email" id="email" name="email" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2" htmlFor="contrasena">Contraseña</label>
              <input className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500" type="password" id="contrasena" name="contrasena" required />
            </div>
            <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">
              Entrar
            </button>
            {status && <p className="text-center text-gray-300 mt-4">{status}</p>}
          </form>
          <div className="text-center mt-6">
             <Link href="/register" className="text-teal-400 hover:underline">
                ¿No tienes una cuenta? Regístrate
             </Link>
          </div>
        </div>
      </div>
    </>
  );
}
