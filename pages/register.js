import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function RegisterPage() {
  const [status, setStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault(); // Evita que la página se recargue
    setStatus('Registrando, por favor espera...');

    // Obtenemos los datos del formulario
    const formData = {
      nombre_empresa: event.target.nombre_empresa.value,
      email: event.target.email.value,
      contrasena: event.target.contrasena.value,
    };

    // Enviamos los datos a nuestro "motor" (la API)
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      setStatus('¡Registro exitoso! ' + result.message);
    } else {
      setStatus('Error: ' + result.message);
    }
  };

  return (
    <>
      <Head>
        <title>Registro - CritoBots</title>
      </Head>
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Crear Cuenta de Empresa</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="nombre_empresa">Nombre de la Empresa</label>
              <input className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500" type="text" id="nombre_empresa" name="nombre_empresa" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="email">Email de Contacto</label>
              <input className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500" type="email" id="email" name="email" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2" htmlFor="contrasena">Crear una Contraseña</label>
              <input className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-teal-500" type="password" id="contrasena" name="contrasena" minLength="6" required />
            </div>
            <button type="submit" className="w-full bg-teal-500 text-white py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors">
              Crear Cuenta y Comenzar Prueba
            </button>
            {status && <p className="text-center text-gray-300 mt-4">{status}</p>}
          </form>
          <div className="text-center mt-6">
             <Link href="/" className="text-teal-400 hover:underline">
                Volver al inicio
             </Link>
          </div>
        </div>
      </div>
    </>
  );
}
