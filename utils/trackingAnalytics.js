// /utils/trackingAnalytics.js

// PASO 1: DEFINIR EL PROBLEMA COMPLETO
/* 
 * PROBLEMA: Realizar cálculos geoespaciales y de rendimiento basados en un historial de puntos de GPS.
 * CASOS DE USO ACTUALES: Calcular distancia total, número de paradas, tiempo detenido y duración total del viaje.
 * CASOS DE USO FUTUROS:
 *   - Cálculo de velocidad promedio y máxima.
 *   - Detección de excesos de velocidad (comparando con límites de la vía).
 *   - Identificación de geocercas (entrada/salida de zonas predefinidas).
 *   - Optimización de rutas.
 * LIMITACIONES CONOCIDAS: Los cálculos de parada son una aproximación basada en radio y tiempo; no consideran el estado del motor del vehículo.
 */

// PASO 2: DISEÑAR LA ARQUITECTURA
/*
 * COMPONENTES PRINCIPALES:
 * - Funciones puras y exportables. Cada función tiene una única responsabilidad.
 * - No dependen de ningún framework de UI (React, Vue, etc.).
 * - Fáciles de testear de forma aislada.
 * PUNTOS DE EXTENSIÓN: Se pueden agregar nuevas funciones de cálculo (ej. `calculateAverageSpeed`) sin modificar las existentes.
 */

/**
 * Calcula la distancia entre dos coordenadas geográficas usando la fórmula de Haversine.
 * @param {number} lat1 - Latitud del punto 1.
 * @param {number} lon1 - Longitud del punto 1.
 * @param {number} lat2 - Latitud del punto 2.
 * @param {number} lon2 - Longitud del punto 2.
 * @returns {number} - La distancia en kilómetros.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  // Validación de entradas
  if ([lat1, lon1, lat2, lon2].some(coord => typeof coord !== 'number')) {
    console.error("Coordenadas inválidas para haversineDistance");
    return 0;
  }

  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

/**
 * Formatea una duración en milisegundos a un string legible "Xh Ym".
 * @param {number} ms - Duración en milisegundos.
 * @returns {string} - La duración formateada.
 */
function formatDuration(ms) {
  if (typeof ms !== 'number' || ms < 0) {
    ms = 0;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Procesa un historial de tracking para calcular estadísticas clave del viaje.
 * @param {Array<Object>} historyData - Array de puntos de historial. Cada punto debe tener {lat, lng, timestamp}.
 * @param {Object} config - Configuración para los cálculos.
 * @param {number} config.stopRadiusKm - Radio en KM para considerar que un punto es parte de una parada.
 * @param {number} config.stopTimeMs - Tiempo mínimo en milisegundos para que un conjunto de puntos se considere una parada.
 * @returns {Object} - Un objeto con las estadísticas calculadas: { distance, stops, stopTime, tripTime }.
 */
export function calculateTripStats(historyData, config = {}) {
  // Configuración por defecto, extensible.
  const defaultConfig = {
    stopRadiusKm: 0.05, // 50 metros
    stopTimeMs: 300000, // 5 minutos
  };
  const finalConfig = { ...defaultConfig, ...config };

  // Validación de entrada
  if (!Array.isArray(historyData) || historyData.length < 2) {
    return { distance: "0.0 km", stops: 0, stopTime: "0h 0m", tripTime: "0h 0m" };
  }

  let totalDistanceKm = 0;
  let totalStopTimeMs = 0;
  let stopCount = 0;
  let potentialStopTimeMs = 0;
  let inPotentialStop = false;

  for (let i = 1; i < historyData.length; i++) {
    const p1 = historyData[i - 1];
    const p2 = historyData[i];

    // Validar que los puntos son correctos
    if (!p1 || !p2 || p1.lat == null || p1.lng == null || p2.lat == null || p2.lng == null) {
      continue; // Saltar iteración si los datos son inválidos
    }

    // 1. Cálculo de distancia
    const distanceSegment = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    totalDistanceKm += distanceSegment;
    
    // 2. Cálculo de paradas
    const timeDiffMs = new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime();

    if (distanceSegment < finalConfig.stopRadiusKm) {
      // El vehículo está casi quieto, acumular tiempo para una posible parada.
      if (!inPotentialStop) {
        inPotentialStop = true;
        potentialStopTimeMs = 0;
      }
      potentialStopTimeMs += timeDiffMs;
    } else {
      // El vehículo se movió, verificar si la parada anterior fue válida.
      if (inPotentialStop && potentialStopTimeMs >= finalConfig.stopTimeMs) {
        stopCount++;
        totalStopTimeMs += potentialStopTimeMs;
      }
      // Resetear el contador de parada.
      inPotentialStop = false;
      potentialStopTimeMs = 0;
    }
  }

  // Verificar si el viaje terminó en medio de una parada
  if (inPotentialStop && potentialStopTimeMs >= finalConfig.stopTimeMs) {
    stopCount++;
    totalStopTimeMs += potentialStopTimeMs;
  }

  // 3. Cálculo de tiempo total del viaje
  const tripTimeMs = new Date(historyData[historyData.length - 1].timestamp).getTime() - new Date(historyData[0].timestamp).getTime();
  
  return {
    distance: `${totalDistanceKm.toFixed(1)} km`,
    stops: stopCount,
    stopTime: formatDuration(totalStopTimeMs),
    tripTime: formatDuration(tripTimeMs)
  };
}
