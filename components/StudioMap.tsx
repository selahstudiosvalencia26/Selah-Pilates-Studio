"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
  label: string;
  pinLabel: string;
  className?: string;
};

// OpenStreetMap through Leaflet, shown as a still picture: no dragging, no zooming, no controls.
// The map colours are set in globals.css (.leaflet-*, .map-pin).
export function StudioMap({
  latitude,
  longitude,
  label,
  pinLabel,
  className = "",
}: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      const center: [number, number] = [latitude, longitude];

      map = L.map(el.current, {
        center,
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Only the required OpenStreetMap credit; no Leaflet name or flag.
      L.control.attribution({ prefix: false }).addTo(map);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker(center, {
        keyboard: false,
        interactive: false,
        icon: L.divIcon({
          className: "map-pin",
          html: `<b class="map-pin-label"></b><span></span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);

      // Set the text safely (not as HTML).
      const tag = el.current.querySelector(".map-pin-label");
      if (tag) tag.textContent = pinLabel;
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude, pinLabel]);

  return (
    <div
      ref={el}
      role="img"
      aria-label={label}
      className={`isolate bg-sand ${className}`}
    />
  );
}
