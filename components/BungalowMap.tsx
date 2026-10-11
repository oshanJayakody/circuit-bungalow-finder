import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import Link from "next/link";

import "leaflet/dist/leaflet.css";

type Location = {
  id: string;
  name: string;
  district: string;
  town: string;
  latitude: number;
  longitude: number;
};

function FitLocations({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 1) {
      map.flyTo([locations[0].latitude, locations[0].longitude], 11, { duration: 0.7 });
    } else if (locations.length > 1) {
      map.fitBounds(locations.map((location): [number, number] => [location.latitude, location.longitude]), { padding: [36, 36], maxZoom: 10, animate: true });
    } else {
      map.flyTo([7.8731, 80.7718], 7, { duration: 0.7 });
    }
  }, [locations, map]);

  return null;
}

export default function BungalowMap({
  locations,
}: {
  locations: Location[];
}) {
  return (
    <div className="h-[62vh] min-h-[430px] w-full overflow-hidden rounded-[26px] border border-[#e5e8df] dark:border-[#223028] shadow-[0_14px_44px_rgba(35,55,47,.09)] sm:h-[68vh] sm:min-h-[560px]">
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

        <FitLocations locations={locations} />

        {locations.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
          >
            <Popup>
              <div className="min-w-40 text-[#23372f] dark:text-[#e9f1ea]"><strong className="text-sm">{item.name}</strong><p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">{item.town}, {item.district}</p><Link className="mt-2 inline-block text-xs font-semibold text-[#315c46] dark:text-[#7fb894] underline" href={`/bungalows/${item.id}`}>View details</Link></div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
