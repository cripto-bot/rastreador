// Este es nuestro componente de mapa reutilizable.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Importamos los estilos del mapa

export default function Map() {
  // Coordenadas para centrar el mapa (Asunción, Paraguay)
  const position = [-25.30066, -57.63591];

  return (
    <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '60vh', width: '100%' }} // Le damos altura y anchura
        className="rounded-lg shadow-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Marcador de ejemplo */}
      <Marker position={position}>
        <Popup>
          Un dispositivo aparecerá aquí.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
