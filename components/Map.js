import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo para el bug del ícono
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// --- ¡NUEVO! Componente para la pantalla completa ---
function FullscreenOnDoubleClick() {
    const map = useMap();
    useMapEvents({
        dblclick() {
            // Pone el contenedor del mapa en pantalla completa
            map.getContainer().requestFullscreen().catch(err => {
                console.log(`Error al intentar pantalla completa: ${err.message} (${err.name})`);
            });
        }
    });
    return null;
}

export default function Map({ history }) {
  if (!history || history.length === 0) {
    return (
      <MapContainer center={[-25.30066, -57.63591]} zoom={13} maxZoom={19} style={{ height: '100%', width: '100%' }} className="rounded-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
    );
  }

  const positions = history.map(p => [p.lat, p.lng]);
  const center = positions[Math.floor(positions.length / 2)];

  return (
    <MapContainer center={center} zoom={14} maxZoom={19} style={{ height: '100%', width: '100%' }} className="rounded-lg">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      <Polyline pathOptions={{ color: 'blue' }} positions={positions} />

      <Marker position={positions[0]}>
        <Popup>Inicio del Recorrido - {new Date(history[0].timestamp).toLocaleTimeString('es-PY')}</Popup>
      </Marker>

      <Marker position={positions[positions.length - 1]}>
        <Popup>Última Ubicación - {new Date(history[history.length - 1].timestamp).toLocaleTimeString('es-PY')}</Popup>
      </Marker>

      {/* --- ¡AÑADIMOS LA NUEVA FUNCIONALIDAD! --- */}
      <FullscreenOnDoubleClick />
    </MapContainer>
  );
}
