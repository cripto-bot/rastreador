// lib/supabaseClient.js

// PASO 1: DEFINIR EL PROBLEMA COMPLETO
/* 
 * PROBLEMA: Necesitamos una forma centralizada y reutilizable para interactuar con
 * la API de Supabase desde nuestra aplicación Next.js, tanto en el lado del cliente
 * (navegador) como en el lado del servidor (API routes).
 * CASOS DE USO ACTUALES:
 *   - Cliente: Autenticación de usuarios (login, signup, logout), lectura de datos (dispositivos, historial).
 *   - Servidor: Operaciones privilegiadas que requieren la clave de servicio (ej. verificar la api_key de un dispositivo).
 * CASOS DE USO FUTUROS: Suscripciones en tiempo real a cambios en la base de datos.
 * LIMITACIONES CONOCIDAS: Este cliente no maneja la expiración de tokens por sí solo,
 * la librería de Supabase lo hace internamente.
 */

// PASO 2: DISEÑAR LA ARQUITECTURA
/*
 * COMPONENTES PRINCIPALES:
 * - `supabase`: Una instancia del cliente de Supabase para ser usada en el NAVEGADOR.
 *   Utiliza la clave pública anónima (`anon key`) y está expuesto de forma segura.
 *   Respeta las políticas de Row Level Security (RLS).
 * - `getSupabaseAdmin()`: Una función para ser usada en el SERVIDOR (API Routes).
 *   Crea una instancia del cliente de Supabase usando la clave secreta de servicio (`service role key`).
 *   Esta instancia tiene permisos de administrador y puede saltarse las políticas de RLS.
 *   Se implementa como una función para asegurar que solo se instancie cuando se necesita en el backend.
 *
 * FLUJO DE DATOS:
 *   - Las páginas de React (ej. Dashboard) importarán `supabase` para las operaciones del usuario.
 *   - Las API Routes (ej. /api/track) importarán `getSupabaseAdmin` para operaciones del sistema.
 * PUNTOS DE EXTENSIÓN: Se pueden añadir funciones de ayuda adicionales en este archivo
 * para interactuar con Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// --- Cliente para el Lado del Navegador (Client-Side) ---

// Obtenemos la URL y la clave anónima de las variables de entorno públicas.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación de que las variables de entorno están presentes.
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key is missing from .env.local or Vercel environment variables. Please check your configuration.");
}

// Exportamos el cliente para que pueda ser importado en cualquier componente del frontend.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Por defecto, Supabase guarda la sesión en localStorage. Esto es correcto para nuestra app.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});


// --- Cliente para el Lado del Servidor (Server-Side / Admin) ---

// No creamos la instancia directamente para evitar que se importe accidentalmente en el cliente.
// La envolvemos en una función que solo debe ser llamada desde API Routes o getStatic/ServerSideProps.
let supabaseAdminInstance = null;

/**
 * Obtiene una instancia del cliente de Supabase con permisos de administrador.
 * Utiliza la clave de servicio secreta.
 * ¡NUNCA usar esta función en el código del lado del cliente!
 * @returns {SupabaseClient} Instancia del cliente de Supabase con rol de servicio.
 */
export const getSupabaseAdmin = () => {
  // Usamos un patrón Singleton para no crear múltiples clientes si se llama varias veces en el mismo request de servidor.
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is missing from Vercel environment variables. This function should only be called on the server.");
  }

  // Creamos la instancia del cliente con la clave de servicio.
  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
  return supabaseAdminInstance;
};
