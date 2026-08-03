import type { LatLngBoundsExpression } from "leaflet";

// Rough bounding box covering Iloilo province and surrounding coastal
// waters, used to constrain map panning/zooming to the region AETHER
// monitors.
export const ILOILO_MAP_BOUNDS: LatLngBoundsExpression = [
  [10.35, 122.15], // southwest
  [11.25, 123.05], // northeast
];