import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para un bug de Next.js con los íconos por defecto de Leaflet
// Esto asegura que los íconos se carguen correctamente.
if (typeof window !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
        iconUrl: require('leaflet/dist/images/marker-icon.png').default,
        shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
    });
}

export default function Map({ history }) {
  // --- Si no hay historial, muestra un mapa centrado y vacío ---
  if (!history || history.length === 0) {
    return (
      <MapContainer center={[-25.30066, -57.63591]} zoom={13} maxZoom={20} style={{ height: '100%', width: '100%' }} className="rounded-lg">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
        />
         <Marker position={[-25.30066, -57.63591]}>
            <Popup>No hay datos de recorrido para este dispositivo hoy.</Popup>
        </Marker>
      </MapContainer>
    );
  }

  // --- Si SÍ hay historial, dibuja el recorrido ---
  const positions = history.map(p => [p.lat, p.lng]);
  const center = positions[Math.floor(positions.length / 2)];

  return (
    <MapContainer center={center} zoom={15} maxZoom={20} style={{ height: '100%', width: '100%' }} className="rounded-lg">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <Polyline pathOptions={{ color: 'blue', weight: 3 }} positions={positions} />

      <Marker position={positions[0]}>
        <Popup>Inicio del Recorrido - {new Date(history[0].timestamp).toLocaleTimeString('es-PY', { timeZone: 'America/Asuncion' })}</Popup>
      </Marker>

      <Marker position={positions[positions.length - 1]}>
        <Popup>Última Ubicación - {new Date(history[history.length - 1].timestamp).toLocaleTimeString('es-PY', { timeZone: 'America/Asuncion' })}</Popup>
      </Marker>
    </MapContainer>
  );
}
