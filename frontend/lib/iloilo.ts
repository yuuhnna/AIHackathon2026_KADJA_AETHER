import type { LatLngBoundsExpression } from "leaflet";

// Iloilo Province — 42 municipalities + 2 cities. Used to filter out
// zones that fall outside the province (e.g. Guimaras, which sits
// geographically close enough to overlap a naive lat/lon bounding box).
export const ILOILO_LGUS = [
  "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate",
  "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan",
  "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas",
  "Estancia", "Guimbal", "Igbaras", "Janiuay", "Lambunao", "Leganes",
  "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena",
  "Oton", "Pavia", "Pototan", "San Dionisio", "San Enrique",
  "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara",
  "Sara", "Tigbauan", "Tubungan", "Zarraga",
  "Iloilo City", "Passi City",
] as const;

export function isInIloiloProvince(municipality: string | null | undefined): boolean {
  if (!municipality) return false;
  return (ILOILO_LGUS as readonly string[]).includes(municipality);
}

// Approximate bounding box around Iloilo Province's mainland extent,
// with a small buffer so coastal zones aren't clipped at the edge.
// [south-west corner, north-east corner]
export const ILOILO_MAP_BOUNDS: LatLngBoundsExpression = [
  [10.15, 121.85], // SW
  [11.75, 123.45], // NE
];

// A tighter starting view centered on the province, used as the map's
// initial center/zoom before any zone data determines a tighter fit.
export const ILOILO_MAP_CENTER: [number, number] = [10.85, 122.55];
export const ILOILO_MAP_DEFAULT_ZOOM = 9;