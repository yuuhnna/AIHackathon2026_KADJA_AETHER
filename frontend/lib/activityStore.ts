"use client";

/**
 * Rehabilitation activity log — the shared store behind the Dashboard's
 * Recommended Actions panel and the Rehabilitation Activities pages.
 *
 * Three sources are merged into one list, in priority order:
 *   1. Supabase        — the persistent database (logged activities only)
 *   2. SEED_ACTIVITIES — pre-existing field records shipped with the app
 *   3. localStorage    — offline fallback / optimistic cache
 *
 * On mount, the store fires a background Supabase fetch and replaces the
 * localStorage snapshot with the real DB data.  All writes go to Supabase
 * first; localStorage is updated optimistically so the UI stays snappy.
 *
 * If Supabase is not configured (env vars missing) or unreachable, the
 * store silently falls back to localStorage-only mode — no crashes.
 */

import { useSyncExternalStore } from "react";
import type { RehabActivity, RehabStatus, ZoneSummary } from "./types";
import { REHAB_STATUSES } from "./types";
import { SEED_ACTIVITIES } from "./mockRehabilitation";
import { byIsoDateDesc } from "./dates";
import {
  fetchActivitiesFromSupabase,
  logActivityToSupabase,
  unlogActivityFromSupabase,
} from "./supabaseActivityStore";
import type { LogActivityInput } from "./supabaseActivityStore";
import { setInvalidateFn, setResetStateFn } from "./activityStoreInvalidate";

export type { LogActivityInput } from "./supabaseActivityStore";

const STORAGE_KEY = "aether.rehab-activities.v1";
const LAST_OFFICER_KEY = "aether.rehab-last-officer.v1";
const LAST_UNIT_KEY = "aether.rehab-last-unit.v1";

function sortByDateDesc(activities: RehabActivity[]): RehabActivity[] {
  return [...activities].sort(
    (a, b) => byIsoDateDesc(a.date, b.date) || a.id.localeCompare(b.id)
  );
}

const SEED_SNAPSHOT: RehabActivity[] = sortByDateDesc(SEED_ACTIVITIES);

// ---------------------------------------------------------------------------
// localStorage persistence (offline cache / fallback)
// ---------------------------------------------------------------------------

function isValidActivity(value: unknown): value is RehabActivity {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Record<string, unknown>;
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
// null  = not yet fetched
// true  = fetch succeeded (use Supabase data only)
// false = fetch failed (fall back to seed + localStorage)
let supabaseState: "pending" | "ok" | "failed" = "pending";

function emit() {
  for (const listener of listeners) listener();
}

function invalidate() {
  cachedSnapshot = null;
  emit();
}

// Register so supabaseActivityStore can trigger a re-render after a write
// without importing the full store (would create a circular dependency).
setInvalidateFn(invalidate);
setResetStateFn(() => { supabaseState = "pending"; });

function getSnapshot(): RehabActivity[] {
  if (cachedSnapshot === null) {
    const logged = readLogged();
    if (supabaseState === "ok") {
      // Supabase is the source of truth — show only what's in the DB
      // (already written to localStorage by syncFromSupabase).
      cachedSnapshot = sortByDateDesc(logged);
    } else {
      // Not yet fetched or offline — merge seed + localStorage
      cachedSnapshot = sortByDateDesc([...SEED_ACTIVITIES, ...logged]);
    }
  }
  return cachedSnapshot;
}

function getServerSnapshot(): RehabActivity[] {
  return SEED_SNAPSHOT;
}

/**
 * Pull logged activities from Supabase and replace the localStorage cache.
 * Called on every new subscription so navigation always gets fresh data.
 */
async function syncFromSupabase(): Promise<void> {
  try {
    const remote = await fetchActivitiesFromSupabase();
    writeLogged(remote);
    supabaseState = "ok";
    invalidate();
  } catch {
    supabaseState = "failed";
    // Keep using seed + localStorage — no crash.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Always re-sync when a new component subscribes so navigating back to
  // Rehabilitation Activities shows fresh Supabase data.
  if (typeof window !== "undefined") {
    syncFromSupabase();
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) invalidate();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** All activities (seed + logged), most recent first. */
export function useActivities(): RehabActivity[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Log one activity.
 * Writes to Supabase first; falls back to localStorage-only if Supabase
 * is unavailable so the user never loses a log entry.
 */
export async function logActivity(input: LogActivityInput): Promise<RehabActivity> {
  let activity: RehabActivity;

  try {
    // Try Supabase first
    activity = await logActivityToSupabase(input);
    // Keep localStorage in sync
    writeLogged([...readLogged(), activity]);
  } catch {
    // Offline fallback — write locally only
    const officer = input.officer_name?.trim() || undefined;
    const evidence = input.evidence_ref?.trim() || undefined;
    activity = {
      ...input,
      action_taken: input.action_taken.trim(),
      officer_name: officer,
      evidence_ref: evidence,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "logged",
    };
    writeLogged([...readLogged(), activity]);
  }

  if (activity.officer_name) rememberOfficerName(activity.officer_name);
  rememberImplementingUnit(activity.implementing_unit ?? "");
  invalidate();
  return activity;
}

/**
 * Remove a logged activity.
 * Deletes from Supabase and localStorage; seed entries are never in the DB
 * so a missing-id delete is a harmless no-op.
 */
export async function unlogActivity(id: string): Promise<void> {
  try {
    await unlogActivityFromSupabase(id);
  } catch {
    // Offline — remove locally only
  }
  const logged = readLogged();
  const next = logged.filter((a) => a.id !== id);
  if (next.length !== logged.length) writeLogged(next);
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