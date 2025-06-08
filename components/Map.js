import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function AddMarkerOnClick({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function Map({ pois, onNewPoi }) {
  const position = [-25.30066, -57.63591];
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [poiName, setPoiName] = useState('');

  const handleMapClick = (latlng) => {
    setNewMarkerPos(latlng);
  };

  const handleSavePoi = () => {
    if (poiName && newMarkerPos) {
      onNewPoi({ nombre: poiName, lat: newMarkerPos.lat, lng: newMarkerPos.lng });
      setNewMarkerPos(null);
      setPoiName('');
    }
  };

  return (
    <div className="relative">
      <MapContainer 
          center={position} 
          zoom={13} 
          style={{ height: '60vh', width: '100%' }}
          className="rounded-lg shadow-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <AddMarkerOnClick onMapClick={handleMapClick} />
        
        {pois.map(poi => (
          <Marker key={poi.id} position={[poi.lat, poi.lng]}>
            <Popup>{poi.nombre}</Popup>
          </Marker>
        ))}

        {newMarkerPos && (
          <Marker position={newMarkerPos}>
            <Popup>Nuevo Punto de Interés</Popup>
          </Marker>
        )}
      </MapContainer>

      {newMarkerPos && (
        <div className="absolute top-2 right-2 bg-white p-4 rounded-lg shadow-xl z-[1000] w-64">
          <h3 className="font-bold text-gray-800 mb-2">Añadir Nuevo Punto</h3>
          <input 
            type="text"
            placeholder="Nombre del cliente o lugar"
            className="w-full p-2 border rounded text-gray-800"
            value={poiName}
            onChange={(e) => setPoiName(e.target.value)}
          />
          <button 
            onClick={handleSavePoi}
            className="w-full mt-2 bg-teal-500 text-white p-2 rounded hover:bg-teal-600"
          >
            Guardar Punto
          </button>
          <button 
            onClick={() => setNewMarkerPos(null)}
            className="w-full mt-1 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
