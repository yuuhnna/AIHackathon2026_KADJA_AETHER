"use client";

/**
 * Rehabilitation activity log — the shared store behind the Dashboard's
 * Recommended Actions panel and the Rehabilitation Activities pages.
 *
 * Two sources are merged into one list:
 *   - SEED_ACTIVITIES — pre-existing field records shipped with the app.
 *   - localStorage    — everything logged from Recommended Actions.
 *
 * Reads go through useSyncExternalStore so every mounted view (the panel,
 * the repository table, a zone timeline) updates the moment an action is
 * logged, in this tab and in any other tab open on the same origin.
 *
 * The log lives in the browser: it is per-device and is lost if site data is
 * cleared. Swapping in a real backend means replacing readLogged/writeLogged
 * with API calls — the snapshot/subscribe surface below stays the same.
 */

import { useSyncExternalStore } from "react";
import type { RehabActivity, RehabStatus, ZoneSummary } from "./types";
import { REHAB_STATUSES } from "./types";
import { SEED_ACTIVITIES } from "./mockRehabilitation";
import { byIsoDateDesc } from "./dates";

const STORAGE_KEY = "aether.rehab-activities.v1";
const LAST_OFFICER_KEY = "aether.rehab-last-officer.v1";
const LAST_UNIT_KEY = "aether.rehab-last-unit.v1";

function sortByDateDesc(activities: RehabActivity[]): RehabActivity[] {
  // Ties broken by id so the order is stable across renders rather than
  // depending on the sort implementation.
  return [...activities].sort(
    (a, b) => byIsoDateDesc(a.date, b.date) || a.id.localeCompare(b.id)
  );
}

// Stable reference for the server/hydration snapshot. useSyncExternalStore
// compares snapshots by identity, so this must never be rebuilt.
const SEED_SNAPSHOT: RehabActivity[] = sortByDateDesc(SEED_ACTIVITIES);

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Rejects anything that isn't a well-formed activity. localStorage is user-
 * writable and survives across app versions, so a malformed or stale entry
 * would otherwise crash every consumer that renders it.
 */
function isValidActivity(value: unknown): value is RehabActivity {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;

  // Optional fields are absent, not null, once JSON.stringify has dropped
  // their undefined values — so check them only when present. Requiring one
  // outright would silently discard every entry saved without it.
  const optionalString = (v: unknown) => v === undefined || typeof v === "string";

  return (
    typeof a.id === "string" &&
    typeof a.zone_id === "string" &&
    typeof a.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(a.date) &&
    typeof a.status === "string" &&
    (REHAB_STATUSES as readonly string[]).includes(a.status) &&
    typeof a.action_category === "string" &&
    typeof a.recommendation_name === "string" &&
    optionalString(a.recommendation_text) &&
    optionalString(a.action_taken) &&
    optionalString(a.implementing_unit) &&
    optionalString(a.evidence_ref) &&
    optionalString(a.officer_name) &&
    (a.area_covered_ha === undefined || typeof a.area_covered_ha === "number")
  );
}

function readLogged(): RehabActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidActivity).map((a) => ({ ...a, source: "logged" as const }));
  } catch {
    // Corrupt JSON or localStorage blocked (private mode, disabled storage) —
    // fall back to seed-only rather than taking the whole page down.
    return [];
  }
}

export class ActivityStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityStorageError";
  }
}

function writeLogged(activities: RehabActivity[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch {
    throw new ActivityStorageError(
      "Couldn't save this activity — browser storage is full or unavailable."
    );
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const listeners = new Set<() => void>();
let cachedSnapshot: RehabActivity[] | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function invalidate() {
  cachedSnapshot = null;
  emit();
}

/**
 * Must return an identical reference until the data actually changes —
 * returning a fresh array each call makes useSyncExternalStore re-render
 * forever.
 */
function getSnapshot(): RehabActivity[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = sortByDateDesc([...SEED_ACTIVITIES, ...readLogged()]);
  }
  return cachedSnapshot;
}

function getServerSnapshot(): RehabActivity[] {
  // localStorage doesn't exist during SSR or the hydration render. Returning
  // seed-only here keeps server and client markup identical; React re-renders
  // with the full snapshot immediately after hydration.
  return SEED_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab writing to the same key invalidates our cache too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) invalidate();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** All activities, seed and logged, most recent first. */
export function useActivities(): RehabActivity[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface LogActivityInput {
  zone_id: string;
  status: RehabStatus;
  date: string;
  action_category: string;
  recommendation_name: string;
  recommendation_text: string;
  action_taken: string;
  implementing_unit: string;
  officer_name?: string;
  area_covered_ha?: number;
  evidence_ref?: string;
}

/**
 * Appends one activity to the log. Throws ActivityStorageError if the write
 * fails, so callers can surface it rather than silently dropping the entry.
 */
export function logActivity(input: LogActivityInput): RehabActivity {
  const officer = input.officer_name?.trim() || undefined;
  const evidence = input.evidence_ref?.trim() || undefined;

  const activity: RehabActivity = {
    ...input,
    action_taken: input.action_taken.trim(),
    officer_name: officer,
    evidence_ref: evidence,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "logged",
  };

  writeLogged([...readLogged(), activity]);
  if (officer) rememberOfficerName(officer);
  rememberImplementingUnit(activity.implementing_unit ?? "");
  invalidate();
  return activity;
}

/**
 * Removes a logged activity. Seed entries are part of the shipped repository
 * and aren't removable, so ids that aren't in localStorage are a no-op.
 */
export function unlogActivity(id: string): void {
  const logged = readLogged();
  const next = logged.filter((a) => a.id !== id);
  if (next.length === logged.length) return;

  writeLogged(next);
  invalidate();
}

/**
 * The last officer name used, so repeat logging doesn't retype it. Returns ""
 * when unavailable — the field is still required, just not prefilled.
 */
export function getLastOfficerName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LAST_OFFICER_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberOfficerName(name: string): void {
  try {
    window.localStorage.setItem(LAST_OFFICER_KEY, name);
  } catch {
    // Non-essential convenience — a failure here shouldn't fail the log.
  }
}

/** The last implementing unit used, prefilled on the next entry. */
export function getLastImplementingUnit(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LAST_UNIT_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberImplementingUnit(unit: string): void {
  if (!unit) return;
  try {
    window.localStorage.setItem(LAST_UNIT_KEY, unit);
  } catch {
    // Same as above — convenience only.
  }
}

// ---------------------------------------------------------------------------
// Selectors — pure, so they can be memoised by the caller
// ---------------------------------------------------------------------------

/** One zone's activities, most recent first. */
export function selectZoneActivities(
  activities: RehabActivity[],
  zoneId: string
): RehabActivity[] {
  return activities.filter((a) => a.zone_id === zoneId);
}

/**
 * Groups a zone's entries by the recommendation they were logged against,
 * most recent first within each. Keyed by the verbatim engine text — the
 * only stable identifier the backend gives a recommendation.
 *
 * A recommendation can be actioned repeatedly (a survey, then the work, then
 * a follow-up), so each key holds the full history rather than one entry.
 */
export function selectRecommendationHistory(
  activities: RehabActivity[],
  zoneId: string
): Map<string, RehabActivity[]> {
  const byText = new Map<string, RehabActivity[]>();
  for (const activity of activities) {
    if (activity.zone_id !== zoneId || !activity.recommendation_text) continue;
    // activities arrives date-descending, so each list stays in that order.
    const list = byText.get(activity.recommendation_text);
    if (list) list.push(activity);
    else byText.set(activity.recommendation_text, [activity]);
  }
  return byText;
}

/** Total hectares reported across entries — summed as reported, never derived. */
export function sumAreaCovered(activities: RehabActivity[]): number {
  return activities.reduce((total, a) => total + (a.area_covered_ha ?? 0), 0);
}

export interface RehabAreaSummary {
  zone_id: string;
  activity_count: number;
  latest_status: RehabStatus;
  latest_date: string;
  /** Sum of reported area covered. 0 when no entry reported one. */
  area_covered_ha: number;
}

/** One row per zone with at least one activity, most recently active first. */
export function selectAreaSummaries(activities: RehabActivity[]): RehabAreaSummary[] {
  const byZone = new Map<string, RehabActivity[]>();
  for (const activity of activities) {
    const list = byZone.get(activity.zone_id);
    if (list) list.push(activity);
    else byZone.set(activity.zone_id, [activity]);
  }

  return Array.from(byZone.entries())
    .map(([zone_id, zoneActivities]) => {
      // activities arrives date-descending, so [0] is the latest.
      const latest = zoneActivities[0];
      return {
        zone_id,
        activity_count: zoneActivities.length,
        latest_status: latest.status,
        latest_date: latest.date,
        area_covered_ha: sumAreaCovered(zoneActivities),
      };
    })
    .sort((a, b) => byIsoDateDesc(a.latest_date, b.latest_date));
}

/** Zone id -> status of that zone's most recent activity. */
export function selectLatestStatusByZone(
  activities: RehabActivity[]
): Map<string, RehabStatus> {
  const byZone = new Map<string, RehabStatus>();
  for (const activity of activities) {
    // activities is date-descending, so the first entry per zone wins.
    if (!byZone.has(activity.zone_id)) byZone.set(activity.zone_id, activity.status);
  }
  return byZone;
}

/**
 * A zone's rehabilitation status as the app should display it: the status of
 * its most recent logged activity, falling back to the value in the feature
 * table when nothing has been logged. Without this, a zone would still read
 * "None" on the Dashboard right after an officer logged work against it.
 */
export function selectEffectiveStatus(
  latestStatusByZone: Map<string, RehabStatus>,
  zone: Pick<ZoneSummary, "zone_id" | "rehabilitation_status">
): string {
  return latestStatusByZone.get(zone.zone_id) ?? zone.rehabilitation_status ?? "None";
}