/**
 * Supabase-backed activity store.
 *
 * Mirrors the same API surface as activityStore.ts so callers don't need
 * to know which backend is in use.  The localStorage store is kept as a
 * write-through cache / offline fallback: every write goes to Supabase
 * first, then also to localStorage so the page stays reactive immediately
 * without waiting for a refetch.
 *
 * Reading always prefers Supabase data; localStorage is only used during
 * SSR and on first render before the async fetch resolves.
 */

import { supabase } from "./supabase";
import type { Database } from "./database.types";
import type { RehabActivity, RehabStatus, ZoneAssessmentPayload } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Every exported function below needs a live client. Centralising the null
 * check here means "Supabase isn't configured" surfaces as a normal
 * rejected promise — callers (activityStore.ts) already catch that and
 * fall back to localStorage — rather than a crash at import time.
 */
function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase isn't configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return supabase;
}

function toRehabActivity(
  row: {
    id: string;
    zone_id: string;
    date: string;
    status: "Planned" | "Active" | "Under Review" | "Completed";
    action_category: string;
    recommendation_name: string;
    recommendation_text: string | null;
    action_taken: string | null;
    implementing_unit: string | null;
    area_covered_ha: number | null;
    evidence_ref: string | null;
    officer_name: string | null;
    source: "seed" | "logged";
  }
): RehabActivity {
  return {
    id: row.id,
    zone_id: row.zone_id,
    date: row.date,
    status: row.status,
    action_category: row.action_category,
    recommendation_name: row.recommendation_name,
    recommendation_text: row.recommendation_text ?? undefined,
    action_taken: row.action_taken ?? undefined,
    implementing_unit: row.implementing_unit ?? undefined,
    area_covered_ha: row.area_covered_ha ?? undefined,
    evidence_ref: row.evidence_ref ?? undefined,
    officer_name: row.officer_name ?? undefined,
    source: row.source,
  };
}

// ── Reads ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all activities from Supabase, newest first.
 * Throws on network/query error so callers can fall back to localStorage.
 */
export async function fetchActivitiesFromSupabase(): Promise<RehabActivity[]> {
  const { data, error } = await requireSupabase()
    .from("rehab_activities")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toRehabActivity);
}

/**
 * Fetch activities for a single zone from Supabase, newest first.
 */
export async function fetchZoneActivitiesFromSupabase(
  zoneId: string
): Promise<RehabActivity[]> {
  const { data, error } = await requireSupabase()
    .from("rehab_activities")
    .select("*")
    .eq("zone_id", zoneId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(toRehabActivity);
}

// ── Writes ────────────────────────────────────────────────────────────────────

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
 * Insert one activity into Supabase.
 * Returns the full saved record (with the generated id).
 */
export async function logActivityToSupabase(
  input: LogActivityInput
): Promise<RehabActivity> {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const insert = {
    id,
    zone_id: input.zone_id,
    date: input.date,
    status: input.status,
    action_category: input.action_category,
    recommendation_name: input.recommendation_name,
    recommendation_text: input.recommendation_text || null,
    action_taken: input.action_taken.trim() || null,
    implementing_unit: input.implementing_unit || null,
    area_covered_ha: input.area_covered_ha ?? null,
    evidence_ref: input.evidence_ref?.trim() || null,
    officer_name: input.officer_name?.trim() || null,
    source: "logged" as const,
  };

  const { data, error } = await requireSupabase()
    .from("rehab_activities")
    .insert(insert)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toRehabActivity(data);
}

/**
 * Delete one logged activity from Supabase by id.
 * Seed entries live only in the frontend and are never in the DB,
 * so deleting a missing id is a harmless no-op.
 */
export async function unlogActivityFromSupabase(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from("rehab_activities")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ── Zone assessments ──────────────────────────────────────────────────────────

/**
 * Save a field-validation assessment for a zone recommendation.
 *
 * Dual-write:
 *   1. zone_assessments — the full assessment record with checklist etc.
 *   2. rehab_activities — so this zone appears in Rehabilitation Activities
 *      with the correct status, date, and action taken.
 */
export async function submitAssessmentToSupabase(
  zoneId: string,
  recommendationIndex: number,
  payload: ZoneAssessmentPayload & { recommendation_text?: string; recommendation_name?: string; action_category?: string }
): Promise<void> {
  const client = requireSupabase();

  // 1 ── zone_assessments (full audit record)
  const assessmentInsert = {
    zone_id: zoneId,
    recommendation_index: recommendationIndex,
    recommendation_text: payload.recommendation_text ?? null,
    date: payload.date,
    status: payload.status,
    unit: payload.unit,
    officer: payload.officer ?? null,
    action: payload.action,
    area_ha: payload.areaHa ?? null,
    evidence_ref: payload.evidenceRef ?? null,
    notes: payload.notes ?? null,
    validated_items: payload.validatedItems,
  };

  const { error: assessmentError } = await client
    .from("zone_assessments")
    .insert(assessmentInsert);

  if (assessmentError) throw new Error(assessmentError.message);

  // 2 ── rehab_activities (so it shows in Rehabilitation Activities)
  // Map the assessment status to a RehabStatus value.
  const rehabStatus =
    payload.status === "Completed" ? "Completed" :
    payload.status === "Ongoing"   ? "Active"    :
    "Planned";

  const activityId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const activityInsert = {
    id: activityId,
    zone_id: zoneId,
    date: payload.date,
    status: rehabStatus as "Planned" | "Active" | "Under Review" | "Completed",
    action_category: payload.action_category ?? "Restoration",
    recommendation_name: payload.recommendation_name ?? `Recommendation ${recommendationIndex + 1}`,
    recommendation_text: payload.recommendation_text ?? null,
    action_taken: payload.action.trim() || null,
    implementing_unit: payload.unit || null,
    area_covered_ha: payload.areaHa ?? null,
    evidence_ref: payload.evidenceRef?.trim() || null,
    officer_name: payload.officer?.trim() || null,
    source: "logged" as const,
  };

  const { error: activityError } = await client
    .from("rehab_activities")
    .insert(activityInsert);

  if (activityError) throw new Error(activityError.message);

  // 3 ── invalidate the in-memory store so Rehabilitation Activities
  //      updates instantly without a page refresh.
  //      We import dynamically to avoid a circular dependency.
  const { invalidateActivities, resetSupabaseState } = await import("./activityStoreInvalidate");
  resetSupabaseState();
  invalidateActivities();
}

/**
 * Fetch all assessments for a given zone, newest first.
 */
export async function fetchZoneAssessments(zoneId: string) {
  const { data, error } = await requireSupabase()
    .from("zone_assessments")
    .select("*")
    .eq("zone_id", zoneId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
