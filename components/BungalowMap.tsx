import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

type Location = {
  id: string;
  name: string;
  district: string;
  town: string;
  latitude: number;
  longitude: number;
};

export default function BungalowMap({
  locations,
}: {
  locations: Location[];
}) {
  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[7.8731, 80.7718]}
        zoom={7}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
          >
            <Popup>
              <strong>{item.name}</strong>
              <br />
              {item.town}, {item.district}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
