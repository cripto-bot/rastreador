import Head from 'next/head';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Rastreador GPS - CritoBots</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold">
            Bienvenido a <span className="text-teal-400">CritoBots</span>
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            La solución para el monitoreo de tus dispositivos.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-teal-500 text-white font-bold rounded-lg shadow-lg hover:bg-teal-600 transition-transform transform hover:scale-105 w-full sm:w-auto"
            >
              Crear Cuenta Nueva
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-700 text-white font-bold rounded-lg shadow-lg hover:bg-gray-600 transition-transform transform hover:scale-105 w-full sm:w-auto"
            >
              Iniciar Sesión
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
