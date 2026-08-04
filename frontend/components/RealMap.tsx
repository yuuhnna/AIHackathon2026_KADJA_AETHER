"use client";

// Zone map — Leaflet, client-only (it touches window/document, so the
// Dashboard imports it with ssr:false).
//
// Zones are not plotted as pins. Every monitored zone has a real
// footprint polygon (Earth Engine writes it into the feature table), and
// the map renders that footprint directly over satellite imagery, the
// way a habitat map does. Because a single footprint is only ~150 m
// across, it is invisible at province zoom — so the map renders two
// layers and crossfades between them by zoom level:
//
//   zoomed out  -> a density heat field: where zones cluster
//   zoomed in   -> the true polygon footprints
//
// Every zone is drawn as two stacked layers: green for the mangrove
// standing there today, and a red core inside it sized to the area the
// model expects that zone to lose within a year. See ZONE_MANGROVE_FILL
// / ZONE_LOSS_OVERLAY for why the map's palette is not the RISK_COLOR
// one the table text and detail panel use.
//
// The heat field is drawn on a plain canvas rather than pulling in a
// heatmap dependency — it is one radial-gradient pass plus one
// compositing op per colour, and doing it here keeps the palette ours
// instead of a library's own gradient.

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import type { ZoneGeoFeature, ZoneSummary } from "@/lib/types";
import { RISK_COLOR, RISK_LABEL, ZONE_MANGROVE_FILL, ZONE_LOSS_OVERLAY } from "@/lib/colors";
import { fetchZoneGeometries } from "@/lib/api";
import { ILOILO_MAP_BOUNDS, ILOILO_MAP_CENTER, ILOILO_MAP_DEFAULT_ZOOM } from "@/lib/iloilo";

export interface RealMapProps {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string | null) => void;
  height?: number | string;
}

// --- panes -----------------------------------------------------------
// Stacking order, bottom to top: imagery (tilePane, 200) -> heat field
// -> footprint polygons -> place labels -> selection ring. Labels sit
// above the zones so town names stay readable through the fills, and
// the ring sits above everything so the selected zone is never buried.
//
// Footprints get their own pane rather than sharing overlayPane because
// the zoom crossfade dims the whole pane — the selection ring has to
// stay at full opacity while the shapes fade out.
const HEAT_PANE = "aetherHeatPane";
const SHAPE_PANE = "aetherShapePane";
const LABELS_PANE = "aetherLabelsPane";
const SELECTION_PANE = "aetherSelectionPane";

// --- zoom crossfade --------------------------------------------------
// A footprint is ~8 px wide at z13 and ~16 px at z14, so that is where
// the real shapes start carrying the map and the heat field hands over.
const HEAT_FADE_START = 11.5;
const HEAT_FADE_END = 13.5;
const SHAPE_FADE_START = 11.5;
const SHAPE_FADE_END = 13;

// Below this zoom the footprints are too small to click, so a map click
// selects the nearest zone centre within CLICK_TOLERANCE_PX instead.
const NEAREST_CLICK_MAX_ZOOM = SHAPE_FADE_END;
const CLICK_TOLERANCE_PX = 22;

const PANEL_OFFSET_PX = 320;
const MIN_FOCUS_ZOOM = 14;
const FOCUS_FLY_DURATION = 0.4;
const CLOSE_ZOOM_OUT_LEVELS = 2;

// Zoomed out, individual footprints are smaller than a pixel, so the
// same two layers become two accumulated passes painted in this order.
// It is the identical statement at a coarser grain: green is where the
// mangrove is, red is how much of it is predicted to go.
//
// Colour is the pass, never the density. Density only drives opacity, so
// a hundred zones stacked in one bay reads as solid green — accumulating
// everything into a single green-to-red ramp would instead have claimed
// that a crowd of healthy zones is an alert.
const HEAT_PASSES: { color: string; alphaFor: (zone: ZoneSummary) => number }[] = [
  // Cover: every zone counts the same, because every zone is mangrove.
  { color: ZONE_MANGROVE_FILL, alphaFor: () => 0.22 },
  // Loss: each zone contributes in proportion to its own predicted loss,
  // so red depth means how much is at stake here, not how many zones
  // happen to sit here.
  { color: ZONE_LOSS_OVERLAY, alphaFor: (zone) => lossFraction(zone) * 0.9 },
];

// --- predicted-loss geometry -----------------------------------------

// vulnerability_score is already a percentage of the zone's area that
// the model expects to be lost within a year, so this is just that
// number as a 0-1 fraction.
function lossFraction(zone: ZoneSummary): number {
  return Math.min(Math.max(zone.vulnerability_score / 100, 0), 1);
}

type Ring = [number, number][];

// Number of halvings used to find the cut line. 40 puts the result well
// inside floating-point noise — measured worst-case area error across all
// 398 zones is 0.005%.
const CUT_SEARCH_STEPS = 40;

function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2);
}

// Outer ring minus its holes.
function polygonArea(rings: Ring[]): number {
  return rings.reduce((total, ring, i) => total + (i === 0 ? ringArea(ring) : -ringArea(ring)), 0);
}

function cutPoint(a: [number, number], b: [number, number], y: number): [number, number] {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + (b[0] - a[0]) * t, y];
}

// Sutherland-Hodgman against the half-plane y <= yCut. The clip region is
// convex, so this is exact even where the footprint itself is concave.
function clipRing(ring: Ring, yCut: number): Ring | null {
  const points = ring.slice(0, -1);
  const out: Ring = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const current = points[i];
    const previous = points[(i + n - 1) % n];
    const currentIn = current[1] <= yCut;
    const previousIn = previous[1] <= yCut;

    if (currentIn) {
      if (!previousIn) out.push(cutPoint(previous, current, yCut));
      out.push(current);
    } else if (previousIn) {
      out.push(cutPoint(previous, current, yCut));
    }
  }

  if (out.length < 3) return null;
  out.push(out[0]);
  return out;
}

function clipPolygon(rings: Ring[], yCut: number): Ring[] | null {
  const outer = clipRing(rings[0], yCut);
  if (!outer) return null;

  const clipped = [outer];
  for (let i = 1; i < rings.length; i++) {
    const hole = clipRing(rings[i], yCut);
    if (hole) clipped.push(hole);
  }
  return clipped;
}

// Returns the part of the zone's footprint that stands for next year's
// predicted loss: the same polygon cut by a horizontal line, positioned
// so the kept part has exactly `fraction` of the zone's area.
//
// Cutting rather than shrinking, because the red has to be a genuine
// subset of the green. Scaling the outline towards its centre gives the
// right area too, but these footprints are unions of 30 m pixels and are
// often concave or nearly split in two — on this dataset that approach
// pushed the red core partly or entirely outside the green cover on 161
// of 398 zones. An intersection cannot leave the shape by construction.
//
// Where the cut falls is schematic: the model predicts how much of a
// zone goes, not which part, so the red is sized honestly and placed
// arbitrarily (it fills from the southern edge).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lossGeometry(geometry: any, fraction: number): any | null {
  if (!geometry || geometry.type !== "Polygon" || fraction <= 0) return null;

  const rings = geometry.coordinates as Ring[];
  if (!rings?.length) return null;

  const target = fraction * polygonArea(rings);
  if (target <= 0) return null;

  let low = Infinity;
  let high = -Infinity;
  for (const [, y] of rings[0]) {
    if (y < low) low = y;
    if (y > high) high = y;
  }

  // Clipped area grows monotonically as the cut line rises, so a plain
  // bisection converges on the line that hits the target area.
  for (let i = 0; i < CUT_SEARCH_STEPS; i++) {
    const mid = (low + high) / 2;
    const clipped = clipPolygon(rings, mid);
    if ((clipped ? polygonArea(clipped) : 0) < target) low = mid;
    else high = mid;
  }

  const coordinates = clipPolygon(rings, high);
  return coordinates ? { type: "Polygon", coordinates } : null;
}

function ramp(value: number, from: number, to: number): number {
  if (value <= from) return 0;
  if (value >= to) return 1;
  return (value - from) / (to - from);
}

function heatRadius(zoom: number): number {
  // Grows with zoom so the field stays a field instead of dissolving
  // into separate dots as you zoom in on a cluster.
  return Math.round(14 + ramp(zoom, 8, 14) * 22);
}

function useMapZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const update = () => setZoom(map.getZoom());
    map.on("zoomend", update);
    return () => {
      map.off("zoomend", update);
    };
  }, [map]);

  return zoom;
}

function focusZone(map: L.Map, lat: number, lon: number) {
  const targetZoom = Math.max(map.getZoom(), MIN_FOCUS_ZOOM);
  const latlng = L.latLng(lat, lon);
  const targetPoint = map.project(latlng, targetZoom).subtract([-PANEL_OFFSET_PX, 0]);
  const targetLatLng = map.unproject(targetPoint, targetZoom);
  map.flyTo(targetLatLng, targetZoom, { animate: true, duration: FOCUS_FLY_DURATION });
}

// --- heat field ------------------------------------------------------

// A single reusable grey blob. Drawing it once per zone with a per-zone
// globalAlpha is much cheaper than building a gradient per zone, and the
// accumulated alpha is exactly the density signal the colour ramp reads.
function createBlob(radius: number): HTMLCanvasElement {
  const blob = document.createElement("canvas");
  const size = radius * 2;
  blob.width = size;
  blob.height = size;

  const ctx = blob.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.35)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  return blob;
}

function HeatField({ zones, opacity }: { zones: ZoneSummary[]; opacity: number }) {
  const map = useMap();
  const frameRef = useRef<number | null>(null);
  const blobRef = useRef<{ radius: number; canvas: HTMLCanvasElement } | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const zonesRef = useRef(zones);

  useEffect(() => {
    const pane = map.getPane(HEAT_PANE);
    if (!pane) return;

    const canvas = L.DomUtil.create("canvas", "aether-heat-canvas") as HTMLCanvasElement;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.transition = "opacity 120ms linear";
    pane.appendChild(canvas);

    if (!scratchRef.current) scratchRef.current = document.createElement("canvas");
    const scratch = scratchRef.current;

    const draw = () => {
      frameRef.current = null;

      const ctx = canvas.getContext("2d");
      const scratchCtx = scratch.getContext("2d");
      if (!ctx || !scratchCtx) return;

      const size = map.getSize();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(size.x * scale);
      const height = Math.round(size.y * scale);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
        scratch.width = width;
        scratch.height = height;
      }

      // The canvas covers the viewport, so it has to be re-anchored to
      // the map's current top-left every time the map moves.
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const radius = heatRadius(map.getZoom());
      if (blobRef.current?.radius !== radius) {
        blobRef.current = { radius, canvas: createBlob(radius) };
      }
      const blob = blobRef.current.canvas;

      for (const pass of HEAT_PASSES) {
        scratchCtx.setTransform(scale, 0, 0, scale, 0, 0);
        scratchCtx.globalCompositeOperation = "source-over";
        scratchCtx.clearRect(0, 0, size.x, size.y);

        let drew = false;

        for (const zone of zonesRef.current) {
          const alpha = pass.alphaFor(zone);
          if (alpha <= 0) continue;

          const point = map.latLngToContainerPoint([zone.lat, zone.lon]);
          // Skip anything whose blob cannot reach the viewport.
          if (
            point.x < -radius ||
            point.y < -radius ||
            point.x > size.x + radius ||
            point.y > size.y + radius
          ) {
            continue;
          }

          scratchCtx.globalAlpha = alpha;
          scratchCtx.drawImage(blob, point.x - radius, point.y - radius);
          drew = true;
        }

        if (!drew) continue;

        // "source-in" repaints the accumulated grey blobs in the pass's
        // colour while keeping their alpha — the whole recolour happens
        // in one compositing op instead of a per-pixel pass in JS.
        scratchCtx.globalAlpha = 1;
        scratchCtx.globalCompositeOperation = "source-in";
        scratchCtx.fillStyle = pass.color;
        scratchCtx.fillRect(0, 0, size.x, size.y);

        ctx.drawImage(scratch, 0, 0);
      }
    };

    const scheduleDraw = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(draw);
    };
    redrawRef.current = scheduleDraw;

    // Leaflet animates the pane's transform during a zoom, which the
    // canvas cannot follow mid-flight — hide it for the ~250 ms the
    // animation lasts and redraw once it settles.
    const hideForZoom = () => {
      canvas.style.opacity = "0";
    };
    const showAfterZoom = () => {
      scheduleDraw();
      canvas.style.opacity = "";
    };

    map.on("move", scheduleDraw);
    map.on("resize", scheduleDraw);
    map.on("zoomstart", hideForZoom);
    map.on("zoomend", showAfterZoom);

    scheduleDraw();

    return () => {
      map.off("move", scheduleDraw);
      map.off("resize", scheduleDraw);
      map.off("zoomstart", hideForZoom);
      map.off("zoomend", showAfterZoom);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      redrawRef.current = null;
      canvas.remove();
    };
  }, [map]);

  // Redraw when the visible zone set changes (table filters). The draw
  // loop reads zones through a ref so that panning never has to tear
  // down and rebuild the canvas layer.
  useEffect(() => {
    zonesRef.current = zones;
    redrawRef.current?.();
  }, [zones]);

  useEffect(() => {
    const pane = map.getPane(HEAT_PANE);
    if (pane) {
      pane.style.opacity = String(opacity);
      pane.style.display = opacity === 0 ? "none" : "";
    }
  }, [opacity, map]);

  return null;
}

// --- footprints ------------------------------------------------------

// Layer 1 — the mangrove standing there today.
function footprintStyle(selected: boolean): L.PathOptions {
  return {
    pane: SHAPE_PANE,
    color: selected ? "#FFFFFF" : ZONE_MANGROVE_FILL,
    weight: selected ? 2.5 : 1,
    opacity: selected ? 1 : 0.9,
    fillColor: ZONE_MANGROVE_FILL,
    fillOpacity: selected ? 0.75 : 0.55,
    className: selected ? "aether-zone aether-zone-selected" : "aether-zone",
  };
}

// Layer 2 — the share of that mangrove predicted to be gone in a year,
// drawn inside layer 1. Opaque, because it is a stated quantity rather
// than a shading; and non-interactive, so clicks and the tooltip fall
// through to the cover layer underneath.
function lossStyle(): L.PathOptions {
  return {
    pane: SHAPE_PANE,
    stroke: false,
    fillColor: ZONE_LOSS_OVERLAY,
    fillOpacity: 0.88,
    interactive: false,
    className: "aether-zone-loss",
  };
}

function tooltipHtml(zone: ZoneSummary): string {
  const color = RISK_COLOR[zone.risk_class];
  return `
    <div style="font-family: var(--font-mono, monospace); line-height: 1.5;">
      <div style="font-weight: 700; color: #16241E;">${zone.municipality}</div>
      <div style="color: #5B6B63; font-size: 10px;">${zone.zone_id}</div>
      <div style="margin-top: 4px; display: flex; align-items: center; gap: 5px;">
        <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${color}; display: inline-block;"></span>
        <span style="color: ${color}; font-weight: 700;">${RISK_LABEL[zone.risk_class]}</span>
      </div>
      <div style="color: #5B6B63; font-size: 10px; margin-top: 2px;">
        ${zone.vulnerability_score.toFixed(2)}% predicted loss next year
      </div>
    </div>`;
}

function FootprintLayer({
  features,
  zones,
  selectedZoneId,
  onSelect,
  opacity,
}: {
  features: ZoneGeoFeature[];
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string | null) => void;
  opacity: number;
}) {
  const map = useMap();
  const layersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const selectedZoneIdRef = useRef(selectedZoneId);

  useEffect(() => {
    selectedZoneIdRef.current = selectedZoneId;
  }, [selectedZoneId]);

  // Only the zones currently passed in (the table's filtered set) get a
  // shape — a filtered-out zone should not be clickable on the map.
  //
  // Sorted so Top 10% shapes are added last: SVG paints and hit-tests in
  // document order, so where two footprints overlap the priority zone is
  // the one that takes the click.
  const visibleFeatures = useMemo(() => {
    const zoneById = new Map(zones.map((z) => [z.zone_id, z]));
    return features
      .filter((f) => zoneById.has(f.properties.zone_id))
      .map((f) => ({ feature: f, zone: zoneById.get(f.properties.zone_id)! }))
      .sort((a, b) => Number(a.zone.risk_class === "high") - Number(b.zone.risk_class === "high"));
  }, [features, zones]);

  useEffect(() => {
    if (visibleFeatures.length === 0) return;

    const group = L.layerGroup([], { pane: SHAPE_PANE });

    // Collected while building and added last, so every loss core sits
    // above every cover layer — otherwise a neighbouring zone's green
    // could paint over a red core built before it.
    const lossLayers: L.GeoJSON[] = [];

    for (const { feature, zone } of visibleFeatures) {
      const shape = L.geoJSON(feature.geometry, {
        pane: SHAPE_PANE,
        style: () => footprintStyle(zone.zone_id === selectedZoneIdRef.current),
      });

      const loss = lossGeometry(feature.geometry, lossFraction(zone));
      if (loss) {
        lossLayers.push(L.geoJSON(loss, { pane: SHAPE_PANE, style: lossStyle }));
      }

      shape.bindTooltip(tooltipHtml(zone), {
        sticky: true,
        direction: "top",
        className: "aether-zone-tooltip",
        opacity: 1,
      });

      shape.on("click", (event) => {
        // Without this the click also reaches the map, which would
        // immediately re-run nearest-zone selection on the same click.
        L.DomEvent.stopPropagation(event);
        // Recentring is left to FocusSelectedZone, which reacts to the
        // selection itself — so clicking a shape and picking the same
        // zone in the table behave identically.
        onSelect(selectedZoneIdRef.current === zone.zone_id ? null : zone.zone_id);
      });

      group.addLayer(shape);
      layersRef.current.set(zone.zone_id, shape);
    }

    for (const lossLayer of lossLayers) {
      group.addLayer(lossLayer);
    }

    map.addLayer(group);

    const layers = layersRef.current;
    return () => {
      map.removeLayer(group);
      layers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, map]);

  // Restyle only what changed, rather than rebuilding 398 polygons every
  // time the selection moves.
  useEffect(() => {
    for (const { zone } of visibleFeatures) {
      const shape = layersRef.current.get(zone.zone_id);
      if (!shape) continue;
      shape.setStyle(footprintStyle(zone.zone_id === selectedZoneId));
    }
  }, [selectedZoneId, visibleFeatures]);

  useEffect(() => {
    const pane = map.getPane(SHAPE_PANE);
    if (!pane) return;
    pane.style.opacity = String(opacity);
    // Faded shapes must not swallow clicks meant for the heat field's
    // nearest-zone selection.
    pane.style.pointerEvents = opacity < 0.35 ? "none" : "auto";
  }, [opacity, map]);

  return null;
}

// A pulsing ring on the selected zone. Unlike the footprint it stays
// legible at any zoom, so selecting a row in the table still shows you
// where that zone is even from the province-wide view.
function SelectionRing({
  zones,
  selectedZoneId,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const zone = zones.find((z) => z.zone_id === selectedZoneId);
    if (!zone) return;

    // White rather than the zone's colour: now that most of the map is
    // green, a green ring on a green field would be the one thing you
    // cannot find. White also matches the selected footprint's stroke, so
    // "selected" looks the same at every zoom.
    const ring = L.circleMarker([zone.lat, zone.lon], {
      pane: SELECTION_PANE,
      radius: 13,
      color: "#FFFFFF",
      weight: 2,
      opacity: 0.95,
      fill: false,
      interactive: false,
      className: "aether-selection-ring",
    });

    ring.addTo(map);

    return () => {
      ring.remove();
    };
  }, [zones, selectedZoneId, map]);

  return null;
}

// At province zoom a footprint is a couple of pixels wide, so instead of
// asking the user to hit it, a click picks the nearest zone centre
// within a forgiving radius. Clicking away from every zone clears the
// selection, which is how the old pin map behaved too.
function NearestZoneSelect({
  zones,
  selectedZoneId,
  onSelect,
  enabled,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string | null) => void;
  enabled: boolean;
}) {
  const map = useMap();
  const zonesRef = useRef(zones);
  const selectedZoneIdRef = useRef(selectedZoneId);
  const enabledRef = useRef(enabled);

  // The click handler is bound once and reads the current props through
  // refs — rebinding it on every prop change would churn a map listener
  // on every zoom and filter.
  useEffect(() => {
    zonesRef.current = zones;
    selectedZoneIdRef.current = selectedZoneId;
    enabledRef.current = enabled;
  }, [zones, selectedZoneId, enabled]);

  useEffect(() => {
    const handleClick = (event: L.LeafletMouseEvent) => {
      if (!enabledRef.current) return;

      const clicked = event.containerPoint;

      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const zone of zonesRef.current) {
        const point = map.latLngToContainerPoint([zone.lat, zone.lon]);
        const distance = clicked.distanceTo(point);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = zone.zone_id;
        }
      }

      if (nearestId === null || nearestDistance > CLICK_TOLERANCE_PX) {
        onSelect(null);
        return;
      }

      onSelect(nearestId === selectedZoneIdRef.current ? null : nearestId);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onSelect]);

  return null;
}

function FocusSelectedZone({
  zones,
  selectedZoneId,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
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

    focusZone(map, selected.lat, selected.lon);
  }, [selectedZoneId, zones, map]);

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

function MapStyles() {
  useEffect(() => {
    const styleId = "aether-map-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .aether-zone {
        transition: fill-opacity 150ms ease-out;
      }
      .aether-zone:hover {
        fill-opacity: 0.9;
      }
      .aether-zone-selected {
        filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.85));
      }
      .aether-selection-ring {
        animation: aether-ring-pulse 1.8s ease-in-out infinite;
      }
      @keyframes aether-ring-pulse {
        0%, 100% { stroke-opacity: 0.95; stroke-width: 2; }
        50% { stroke-opacity: 0.3; stroke-width: 5; }
      }
      .aether-zone-tooltip {
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(22, 36, 30, 0.12);
        border-radius: 8px;
        box-shadow: 0 4px 14px -4px rgba(22, 36, 30, 0.35);
        padding: 7px 9px;
      }
      .aether-zone-tooltip::before {
        border-top-color: rgba(255, 255, 255, 0.96);
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}

function MapChrome() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl.setPrefix(false);
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Everything inside <MapContainer> lives here so the panes can be
// created before the layers that render into them.
function MapLayers({
  zones,
  features,
  selectedZoneId,
  onSelect,
}: {
  zones: ZoneSummary[];
  features: ZoneGeoFeature[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string | null) => void;
}) {
  const map = useMap();
  const zoom = useMapZoom();

  // Created during render, not in an effect: every layer below renders
  // into one of these panes, and a child's effect runs before its
  // parent's — so an effect here would hand those layers a pane that
  // does not exist yet. ensurePane is idempotent, so re-running it on a
  // repeated render is harmless.
  useMemo(() => {
    const ensurePane = (name: string, zIndex: number, interactive: boolean) => {
      const pane = map.getPane(name) ?? map.createPane(name);
      pane.style.zIndex = String(zIndex);
      pane.style.pointerEvents = interactive ? "auto" : "none";
    };

    ensurePane(HEAT_PANE, 350, false);
    ensurePane(SHAPE_PANE, 400, true);
    ensurePane(LABELS_PANE, 450, false);
    ensurePane(SELECTION_PANE, 460, false);
  }, [map]);

  const heatOpacity = 1 - ramp(zoom, HEAT_FADE_START, HEAT_FADE_END);
  const shapeOpacity = features.length === 0 ? 0 : ramp(zoom, SHAPE_FADE_START, SHAPE_FADE_END);

  return (
    <>
      <TileLayer
        attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxNativeZoom={18}
        maxZoom={19}
      />

      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
        pane={LABELS_PANE}
        maxNativeZoom={19}
        maxZoom={19}
      />

      <MapStyles />
      <MapChrome />
      <FitBounds zones={zones} />

      <HeatField zones={zones} opacity={heatOpacity} />

      <FootprintLayer
        features={features}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelect={onSelect}
        opacity={shapeOpacity}
      />

      <SelectionRing zones={zones} selectedZoneId={selectedZoneId} />

      <NearestZoneSelect
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelect={onSelect}
        enabled={zoom < NEAREST_CLICK_MAX_ZOOM}
      />

      <FocusSelectedZone zones={zones} selectedZoneId={selectedZoneId} />
    </>
  );
}

export default function RealMap({
  zones,
  selectedZoneId,
  onSelect,
  height = "100%",
}: RealMapProps) {
  const [features, setFeatures] = useState<ZoneGeoFeature[]>([]);

  // Footprints come from their own endpoint rather than riding along
  // with /zones — the geometry is roughly half a megabyte and only the
  // map needs it. If it fails the map still works: the heat field and
  // nearest-zone selection do not depend on the shapes.
  useEffect(() => {
    let cancelled = false;

    fetchZoneGeometries()
      .then((collection) => {
        if (!cancelled) setFeatures(collection.features);
      })
      .catch(() => {
        if (!cancelled) setFeatures([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (zones.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-line w-full h-full min-h-[380px]" style={{ height }}>
      <MapContainer
        center={ILOILO_MAP_CENTER}
        zoom={ILOILO_MAP_DEFAULT_ZOOM}
        minZoom={8}
        maxZoom={19}
        maxBounds={ILOILO_MAP_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapLayers
          zones={zones}
          features={features}
          selectedZoneId={selectedZoneId}
          onSelect={onSelect}
        />
      </MapContainer>
    </div>
  );
}
