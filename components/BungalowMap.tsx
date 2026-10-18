import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
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

// Custom pin: the stock Leaflet marker images don't resolve through the
// Next.js bundler, which left every destination as a blank square.
// A self-contained SVG pin sidesteps that entirely.
const pinIcon = L.divIcon({
  className: "cbf-map-pin",
  html: `<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17 2C8.7 2 2 8.7 2 17c0 11.3 15 27 15 27s15-15.7 15-27C32 8.7 25.3 2 17 2z" fill="#244f3d" stroke="#ffffff" stroke-width="2.5"/><circle cx="17" cy="17" r="6" fill="#ffffff"/></svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -42],
});

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];

function fitMapToLocations(map: L.Map, locations: Location[]) {
  if (locations.length === 1) {
    map.flyTo([locations[0].latitude, locations[0].longitude], 11, { duration: 0.7 });
  } else if (locations.length > 1) {
    map.fitBounds(locations.map((location): [number, number] => [location.latitude, location.longitude]), { padding: [36, 36], maxZoom: 10, animate: true });
  } else {
    map.flyTo(SRI_LANKA_CENTER, 7, { duration: 0.7 });
  }
}

function FitLocations({ locations, onReady }: { locations: Location[]; onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  useEffect(() => {
    fitMapToLocations(map, locations);
  }, [locations, map]);

  return null;
}

function useDarkTiles() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function BungalowMap({
  locations,
}: {
  locations: Location[];
}) {
  const dark = useDarkTiles();
  const [map, setMap] = useState<L.Map | null>(null);

  return (
    <div className="relative h-[62vh] min-h-[430px] w-full overflow-hidden rounded-[26px] border border-[#e5e8df] dark:border-[#223028] shadow-[0_14px_44px_rgba(35,55,47,.09)] sm:h-[68vh] sm:min-h-[560px]">
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={7}
        minZoom={3}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          key={dark ? "esri-dark" : "esri-light"}
          attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
          url={
            dark
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          }
        />

        <FitLocations locations={locations} onReady={setMap} />

        {locations.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
            icon={pinIcon}
          >
            <Popup>
              <div className="min-w-40 text-[#23372f] dark:text-[#e9f1ea]"><strong className="text-sm">{item.name}</strong><p className="mt-1 text-xs text-[#718077] dark:text-[#9db0a2]">{item.town}, {item.district}</p><Link className="mt-2 inline-block text-xs font-semibold text-[#315c46] dark:text-[#7fb894] underline" href={`/bungalows/${item.id}`}>View details</Link></div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <button
        type="button"
        onClick={() => map && fitMapToLocations(map, locations)}
        className="absolute bottom-4 right-4 z-[500] rounded-full border border-[#dce3dc] dark:border-[#243830] bg-white/95 dark:bg-[#121a15]/95 px-4 py-2.5 text-xs font-bold text-[#244f3d] dark:text-[#7fb894] shadow-lg backdrop-blur transition hover:bg-white dark:hover:bg-[#182219]"
      >
        ⌂ Reset view
      </button>
    </div>
  );
}
