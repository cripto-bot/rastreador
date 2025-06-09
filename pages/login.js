// pages/login.js

// PASO 1: DEFINIR EL PROBLEMA COMPLETO
/*
 * PROBLEMA: Permitir a los usuarios existentes iniciar sesión en su cuenta y
 * permitir a nuevos usuarios registrarse. La página debe manejar ambos casos
 * de forma clara y segura, utilizando el sistema de autenticación de Supabase.
 * CASOS DE USO ACTUALES:
 *   - Iniciar sesión con email y contraseña.
 *   - Registrar una nueva cuenta con email y contraseña.
 *   - Mostrar mensajes de error claros (ej. "Contraseña incorrecta", "El usuario ya existe").
 *   - Redirigir al dashboard si el inicio de sesión/registro es exitoso.
 *   - Redirigir al dashboard si el usuario ya tiene una sesión activa.
 * CASOS DE USO FUTUROS:
 *   - Inicio de sesión con proveedores OAuth (Google, GitHub, etc.).
 *   - Funcionalidad de "Olvidé mi contraseña".
 */

// PASO 2: DISEÑAR LA ARQUITECTURA
/*
 * COMPONENTES PRINCIPALES:
 * - `LoginPage`: Componente de React que renderiza el formulario.
 * - Estado local (useState) para gestionar email, contraseña, errores y estado de carga.
 * - `supabase`: El cliente de Supabase importado desde `lib/supabaseClient.js`
 *   para manejar las operaciones de autenticación (`signInWithPassword`, `signUp`).
 *
 * FLUJO DE DATOS:
 * 1. El usuario introduce datos en el formulario.
 * 2. Al hacer clic en "Login" o "Register", se llama a la función correspondiente.
 * 3. La función llama al método de Supabase apropiado.
 * 4. Si Supabase devuelve un error, se muestra en la UI.
 * 5. Si Supabase devuelve éxito (sesión), se redirige al usuario al `/dashboard`.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient'; // <-- ¡IMPORTANTE! Importamos nuestro cliente.

export default function LoginPage() {
  const router = useRouter();
  
  // Estado para los campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estado para la gestión de la UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Para alternar entre Login y Registro

  // --- EFECTOS ---
  // Redirigir si el usuario ya está logueado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  // --- MANEJADORES DE EVENTOS ---

  /**
   * Maneja el envío del formulario, decidiendo si es un login o un registro.
   * @param {React.FormEvent<HTMLFormElement>} e - Evento del formulario.
   */
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      let error;

      if (isSignUp) {
        // Lógica de Registro (Sign Up)
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        error = signUpError;
        // Supabase requiere confirmación de email por defecto. Informamos al usuario.
        if (!error) {
            alert('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
            setIsSignUp(false); // Volver a la vista de login
        }
      } else {
        // Lógica de Inicio de Sesión (Sign In)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        error = signInError;
      }

      if (error) {
        // Si Supabase devuelve un error, lo mostramos.
        throw error;
      }

      // Si no hay error en el login, la sesión se establece automáticamente
      // y el listener de Supabase (que pondremos en _app.js luego) nos redirigirá.
      // Forzamos la redirección por si acaso.
      if(!isSignUp){
         router.push('/dashboard');
      }

    } catch (error) {
      // Manejo de errores más amigable
      if (error.message.includes("Invalid login credentials")) {
        setErrorMessage("Email o contraseña incorrectos.");
      } else if (error.message.includes("User already registered")) {
        setErrorMessage("Este email ya está registrado. Intenta iniciar sesión.");
      } else if (error.message.includes("Password should be at least 6 characters")) {
        setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <>
      <Head>
        <title>{isSignUp ? 'Registro' : 'Iniciar Sesión'} - CritoBots</title>
      </Head>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-teal-400 mb-2">
            CritoBots
          </h1>
          <h2 className="text-xl font-bold text-center text-white mb-8">
            {isSignUp ? 'Crear una Cuenta Nueva' : 'Bienvenido de Nuevo'}
          </h2>
          
          <form onSubmit={handleAuth}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-teal-500 focus:outline-none text-white"
                required
                placeholder="tu@email.com"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-teal-500 focus:outline-none text-white"
                required
                placeholder="••••••••"
              />
            </div>

            {errorMessage && (
              <p className="bg-red-800 border border-red-600 text-red-200 p-3 rounded mb-4 text-center">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded transition-colors disabled:bg-gray-500"
            >
              {isLoading ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
              className="text-gray-400 hover:text-teal-400 text-sm"
            >
              {isSignUp
                ? '¿Ya tienes una cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
