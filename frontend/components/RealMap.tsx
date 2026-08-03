"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import type { ZoneSummary } from "@/lib/types";
import { RISK_COLOR } from "@/lib/colors";
import { ILOILO_MAP_BOUNDS, ILOILO_MAP_CENTER, ILOILO_MAP_DEFAULT_ZOOM } from "@/lib/iloilo";

export interface RealMapProps {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string | null) => void;
  height?: number | string;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function FitBounds({ zones }: { zones: ZoneSummary[] }) {
  const map = useMap();
  const hasFitOnce = useRef(false);

  useEffect(() => {
    if (hasFitOnce.current) return;
    if (zones.length > 0) {
      const bounds = L.latLngBounds(zones.map((z) => [z.lat, z.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.fitBounds(ILOILO_MAP_BOUNDS, { padding: [20, 20] });
    }
    hasFitOnce.current = true;
  }, [zones, map]);

  return null;
}

const PANEL_OFFSET_PX = 320;
const MIN_FOCUS_ZOOM = 13;
const FOCUS_FLY_DURATION = 0.3;
const CLOSE_ZOOM_OUT_LEVELS = 2;

function focusZone(map: L.Map, lat: number, lon: number) {
  const targetZoom = Math.max(map.getZoom(), MIN_FOCUS_ZOOM);
  const latlng = L.latLng(lat, lon);
  const targetPoint = map.project(latlng, targetZoom).subtract([-PANEL_OFFSET_PX, 0]);
  const targetLatLng = map.unproject(targetPoint, targetZoom);
  map.flyTo(targetLatLng, targetZoom, { animate: true, duration: FOCUS_FLY_DURATION });
}

function FocusSelectedZone({
  zones,
  selectedZoneId,
  markersRef,
  clusterGroupRef,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markersRef: React.MutableRefObject<Map<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clusterGroupRef: React.MutableRefObject<any>;
}) {
  const map = useMap();
  const wasSelectedRef = useRef(false);

  useEffect(() => {
    if (!selectedZoneId) {
      if (wasSelectedRef.current) {
        const targetZoom = Math.max(map.getZoom() - CLOSE_ZOOM_OUT_LEVELS, map.getMinZoom());
        map.flyTo(map.getCenter(), targetZoom, { animate: true, duration: FOCUS_FLY_DURATION });
      }
      wasSelectedRef.current = false;
      return;
    }
    wasSelectedRef.current = true;

    const selected = zones.find((z) => z.zone_id === selectedZoneId);
    if (!selected) return;

    const marker = markersRef.current.get(selectedZoneId);
    const clusterGroup = clusterGroupRef.current;

    if (marker && map.hasLayer(marker)) {
      focusZone(map, selected.lat, selected.lon);
      return;
    }

    try {
      if (marker && clusterGroup && typeof clusterGroup.zoomToShowLayer === "function") {
        clusterGroup.zoomToShowLayer(marker, () => {
          focusZone(map, selected.lat, selected.lon);
        });
        return;
      }
    } catch {
      // fall through to plain focus below
    }

    focusZone(map, selected.lat, selected.lon);
  }, [selectedZoneId, zones, map, markersRef, clusterGroupRef]);

  return null;
}

function AttributionStyle() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);
  return null;
}

function GlowStyles() {
  useEffect(() => {
    const styleId = "aether-pin-glow-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .aether-pin-glow {
        opacity: 0.8;
      }
      .aether-pin-glow-selected {
        animation: aether-pulse 1.8s ease-in-out infinite;
      }
      @keyframes aether-pulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.35); opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}

function clusterIcon(cluster: {
  getChildCount: () => number;
  getAllChildMarkers: () => L.Marker[];
}): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 50 ? 42 : count < 150 ? 50 : 58;
  const innerSize = Math.round(size * 0.78);

  const childMarkers = cluster.getAllChildMarkers();
  let highCount = 0;
  let hasModerate = false;
  for (const marker of childMarkers) {
    const risk = (marker.options as L.MarkerOptions & { zoneRisk?: string }).zoneRisk;
    if (risk === "high") highCount++;
    else if (risk === "moderate") hasModerate = true;
  }
  const dominantRisk: "high" | "moderate" | "low" =
    highCount > 0 ? "high" : hasModerate ? "moderate" : "low";
  const color = RISK_COLOR[dominantRisk];

  const badgeSize = Math.max(16, Math.round(size * 0.42));
  const badgeHtml =
    highCount > 0
      ? `<div style="
          position: absolute; top: -4px; right: -4px;
          min-width: ${badgeSize}px; height: ${badgeSize}px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9999px;
          background: #ffffff;
          border: 1.5px solid ${color};
          color: ${color};
          font-family: monospace;
          font-weight: 700;
          font-size: 10px;
          box-shadow: 0 1px 3px rgba(22, 36, 30, 0.25);
        ">${highCount}</div>`
      : "";

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      <div style="
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 9999px;
        background: ${color}40;
        border: 2px solid ${color}90;
        box-shadow: 0 2px 6px rgba(22, 36, 30, 0.15);
      ">
        <div style="
          width: ${innerSize}px; height: ${innerSize}px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9999px;
          background: ${color};
          color: #ffffff;
          font-family: monospace;
          font-weight: 600;
          font-size: 12px;
        ">${count}</div>
      </div>
      ${badgeHtml}
    </div>`;

  return L.divIcon({
    html,
    className: "aether-cluster-wrapper",
    iconSize: [size, size],
  });
}

function pinIcon(color: string, selected: boolean): L.DivIcon {
  const r = 6;
  const size = r * 2 + 6;
  const glowSize = size * 1.25;
  const stroke = selected ? "#ffffff" : "#16241E";
  const strokeWidth = selected ? 3 : 1;
  const opacity = selected ? 1 : 0.85;

  const svg = `
    <div style="position: relative; width: ${glowSize}px; height: ${glowSize}px; display: flex; align-items: center; justify-content: center;">
      <div class="${selected ? "aether-pin-glow aether-pin-glow-selected" : "aether-pin-glow"}"
           style="position: absolute; width: ${glowSize}px; height: ${glowSize}px;
                  background: radial-gradient(circle, ${color}30 0%, ${color}0d 35%, transparent 60%);
                  border-radius: 50%; pointer-events: none;"></div>
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"
           style="position: relative; filter: drop-shadow(0 0 3px ${color}bb);">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />
      </svg>
    </div>`;

  return L.divIcon({
    html: svg,
    className: "aether-pin",
    iconSize: [glowSize, glowSize],
    iconAnchor: [glowSize / 2, glowSize / 2],
    popupAnchor: [0, -glowSize / 2],
  });
}

function ZoneMarker({
  z,
  isSelected,
  onSelect,
  markersRef,
}: {
  z: ZoneSummary;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markersRef: React.MutableRefObject<Map<string, any>>;
}) {
  const map = useMap();

  function handleClick() {
    if (isSelected) {
      onSelect(null);
      return;
    }
    onSelect(z.zone_id);
    focusZone(map, z.lat, z.lon);
  }

  return (
    <Marker
      ref={(instance) => {
        if (instance) {
          (instance.options as L.MarkerOptions & { zoneRisk?: string }).zoneRisk = z.risk_class;
          markersRef.current.set(z.zone_id, instance);
        } else {
          markersRef.current.delete(z.zone_id);
        }
      }}
      position={[z.lat, z.lon]}
      icon={pinIcon(RISK_COLOR[z.risk_class], isSelected)}
      eventHandlers={{ click: handleClick }}
    />
  );
}

export default function RealMap({
  zones,
  selectedZoneId,
  onSelect,
  height = "100%",
}: RealMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterGroupRef = useRef<any>(null);

  if (zones.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-line w-full h-full min-h-[380px]" style={{ height }}>
      <MapContainer
        center={ILOILO_MAP_CENTER}
        zoom={ILOILO_MAP_DEFAULT_ZOOM}
        minZoom={8}
        maxBounds={ILOILO_MAP_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <GlowStyles />
        <AttributionStyle />
        <InvalidateSize />
        <FitBounds zones={zones} />
        <FocusSelectedZone
          zones={zones}
          selectedZoneId={selectedZoneId}
          markersRef={markersRef}
          clusterGroupRef={clusterGroupRef}
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MarkerClusterGroup
          ref={(instance: any) => {
            clusterGroupRef.current = instance;
          }}
          iconCreateFunction={clusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={false}
          showCoverageOnHover={false}
          disableClusteringAtZoom={15}
        >
          {zones.map((z) => (
            <ZoneMarker
              key={z.zone_id}
              z={z}
              isSelected={z.zone_id === selectedZoneId}
              onSelect={onSelect}
              markersRef={markersRef}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}