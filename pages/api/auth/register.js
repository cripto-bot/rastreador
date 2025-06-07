// Este es nuestro primer "motor" o API.
// Su única misión es recibir los datos del formulario de registro.

export default function handler(req, res) {
  // Primero, nos aseguramos de que los datos vengan por el método correcto (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // Obtenemos los datos que nos envió el formulario
  const { nombre_empresa, email, contrasena } = req.body;

  // Verificamos que los datos no estén vacíos (una validación muy básica)
  if (!nombre_empresa || !email || !contrasena) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  // ¡ÉXITO! Por ahora, no guardaremos los datos en un archivo.
  // Solo confirmaremos que los hemos recibido correctamente.
  console.log('Datos recibidos:', req.body);

  // Enviamos una respuesta positiva de vuelta a la página del formulario
  res.status(201).json({ message: 'Tu cuenta ha sido creada (simulación).' });
}
