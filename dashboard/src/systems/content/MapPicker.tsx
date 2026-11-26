"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

// The studio's pin on a map (OpenStreetMap, the same one the website shows). Drag the pin, or press the map, and the two numbers
// under it follow. Typing the numbers moves the pin. The numbers stay, so it also works without a mouse.
const round = (n: number) => Math.round(n * 1e6) / 1e6;

export default function MapPicker({ latitude, longitude, onPick }: { latitude: number; longitude: number; onPick: (latitude: number, longitude: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const pin = useRef<import("leaflet").Marker | null>(null);
  const pick = useRef(onPick);
  const [ready, setReady] = useState(false);
  const good = Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const start = useRef<[number, number]>(good ? [latitude, longitude] : [7.9064, 125.0942]); // Valencia City, until numbers are typed

  useEffect(() => {
    pick.current = onPick;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current) return;
      const m = L.map(box.current, { center: start.current, zoom: 17, scrollWheelZoom: false });
      m.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(m);
      const marker = L.marker(start.current, {
        draggable: true,
        autoPan: true,
        title: "Drag me to the studio",
        icon: L.divIcon({ className: "", html: '<span class="block h-7 w-7 rounded-full border-4 border-card bg-accent shadow-lg"></span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
      }).addTo(m);
      const moved = (at: import("leaflet").LatLng) => pick.current(round(at.lat), round(at.lng));
      marker.on("dragend", () => moved(marker.getLatLng()));
      m.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        moved(e.latlng);
      });
      map.current = m;
      pin.current = marker;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      pin.current = null;
    };
  }, []);

  // Typed numbers move the pin.
  useEffect(() => {
    if (!ready || !good || !map.current || !pin.current) return;
    const now = pin.current.getLatLng();
    if (round(now.lat) === round(latitude) && round(now.lng) === round(longitude)) return;
    pin.current.setLatLng([latitude, longitude]);
    map.current.setView([latitude, longitude]);
  }, [ready, good, latitude, longitude]);

  return (
    <div className="grid gap-2">
      <div ref={box} role="application" aria-label="Map: drag the pin to the studio, or press the map" className="isolate h-80 w-full overflow-hidden rounded-xl border border-border bg-surface" />
      <p className="text-sm text-text-soft">Drag the pin onto your studio, or press the map where it is. Then Save.</p>
    </div>
  );
}
