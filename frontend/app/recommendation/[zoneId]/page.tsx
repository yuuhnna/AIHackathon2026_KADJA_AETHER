"use client";

// Recommendation validation — a zone's rule-based recommendations, each
// gated behind a field-validation checklist before an assessment can be
// logged against it.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchZoneDetail, submitZoneAssessment } from "@/lib/api";
import type { ZoneSummary } from "@/lib/types";
import { resolveRecommendation, type RecommendationRule } from "@/lib/recommendationRules";
import { ChartBarIcon } from "@/components/icons";

const STATUS_OPTIONS = ["Planned", "Ongoing", "Completed"] as const;
const UNIT_OPTIONS = ["DENR", "MENRO", "LGU", "Community / People's Org", "Other"];

type AssessmentForm = {
  date: string;
  status: (typeof STATUS_OPTIONS)[number];
  unit: string;
  officer: string;
  action: string;
  areaHa: string;
  evidenceRef: string;
  notes: string;
  checks: boolean[];
};

function emptyForm(validationPoints: string[]): AssessmentForm {
  return {
    date: "",
    status: "Ongoing",
    unit: UNIT_OPTIONS[0],
    officer: "",
    action: "",
    areaHa: "",
    evidenceRef: "",
    notes: "",
    checks: validationPoints.map(() => false),
  };
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SavedAssessment = {
  date: string;
  status: string;
  unit: string;
};

function RecommendationCard({
  zoneId,
  index,
  rec,
}: {
  zoneId: string;
  index: number;
  rec: RecommendationRule;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AssessmentForm>(() => emptyForm(rec.validationPoints));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedAssessment | null>(null);

  const checkedCount = form.checks.filter(Boolean).length;
  const allChecked = checkedCount === rec.validationPoints.length;

  function openForm() {
    setForm(emptyForm(rec.validationPoints));
    setError(null);
    setFormOpen(true);
  }

  function toggleCheck(i: number) {
    setForm((f) => {
      const checks = [...f.checks];
      checks[i] = !checks[i];
      return { ...f, checks };
    });
  }

  function updateField<K extends keyof AssessmentForm>(key: K, value: AssessmentForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!allChecked) {
      setError("Complete the field validation checklist before logging this action.");
      return;
    }
    if (!form.date || !form.unit || !form.action.trim()) {
      setError("Date, implementing unit, and action taken are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitZoneAssessment(zoneId, index, {
        date: form.date,
        status: form.status,
        unit: form.unit,
        officer: form.officer || undefined,
        action: form.action,
        areaHa: form.areaHa ? Number(form.areaHa) : undefined,
        evidenceRef: form.evidenceRef || undefined,
        notes: form.notes || undefined,
        validatedItems: rec.validationPoints,
        // Pass these so rehab_activities gets meaningful labels
        recommendation_text: rec.text,
        recommendation_name: `Recommendation ${index + 1}: ${rec.text.slice(0, 60)}`,
        action_category: rec.category,
      });
      setSaved({ date: form.date, status: form.status, unit: form.unit });
      setFormOpen(false);
    } catch {
      setError("Could not save this entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-block text-[10px] uppercase tracking-wide text-accent bg-bg-panel-alt rounded-full px-2 py-0.5 mb-2">
            {rec.category}
          </span>
          <h3 className="font-semibold">Recommendation {index + 1}</h3>
          <p className="text-[11px] font-mono text-faint mt-1">Driver: {rec.driver}</p>
        </div>
      </div>

      <p className="mt-2">{rec.text}</p>

      <div className="mt-4 rounded-md bg-bg-panel-alt p-3">
        <p className="font-medium">Field Validation Checklist</p>
        <ul className="mt-2 space-y-1.5">
          {rec.validationPoints.map((point, i) => (
            <li key={i} className="text-sm text-muted flex gap-2">
              <span className="text-faint">—</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {saved ? (
          <span className="flex items-center gap-2 text-sm text-risk-low font-medium">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 10.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logged — {saved.status} · {saved.date} · {saved.unit}
          </span>
        ) : (
          <span className="text-sm text-muted">No activity recorded yet</span>
        )}
        <button
          onClick={() => (formOpen ? setFormOpen(false) : openForm())}
          className="text-sm font-medium border border-line rounded-md px-3 py-1.5 hover:bg-bg-panel-alt transition-colors"
        >
          {formOpen ? "Cancel" : saved ? "Log another" : "Log zone assessment"}
        </button>
      </div>

      {formOpen && (
        <div className="mt-4 rounded-md border border-line p-4">
          <div className="rounded-md bg-bg-panel-alt p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-faint font-medium">
                Confirm before logging
              </p>
              <p className="text-xs font-mono text-faint">
                {checkedCount}/{rec.validationPoints.length}
              </p>
            </div>
            <div className="space-y-1.5">
              {rec.validationPoints.map((point, i) => {
                const checked = form.checks[i];
                return (
                  <label
                    key={i}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                    onClick={() => toggleCheck(i)}
                  >
                    <span
                      className={`mt-0.5 flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                        checked ? "bg-accent border-accent" : "border-line bg-bg-panel"
                      }`}
                    >
                      {checked && <CheckIcon />}
                    </span>
                    <span>{point}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-risk-high mb-3">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Date implemented</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as AssessmentForm["status"])}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Implementing unit</label>
              <select
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Office in Charge (optional)</label>
              <input
                type="text"
                value={form.officer}
                onChange={(e) => updateField("officer", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Action taken</label>
              <textarea
                value={form.action}
                onChange={(e) => updateField("action", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm min-h-[64px]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Area covered, ha (optional)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.areaHa}
                onChange={(e) => updateField("areaHa", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Evidence reference (optional)</label>
              <input
                type="text"
                value={form.evidenceRef}
                onChange={(e) => updateField("evidenceRef", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-faint mb-1">Field notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="w-full rounded-md border border-line bg-bg-panel px-2.5 py-1.5 text-sm min-h-[56px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setFormOpen(false)}
              className="text-sm font-medium border border-line rounded-md px-3 py-1.5 hover:bg-bg-panel-alt transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !allChecked}
              className="text-sm font-medium rounded-md px-3 py-1.5 bg-ink text-bg-panel disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? "Saving…" : "Save validated entry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();

  const [zone, setZone] = useState<ZoneSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zoneId) return;

    fetchZoneDetail(zoneId)
      .then((data) => {
        setZone(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [zoneId]);

  if (loading) {
    return (
      <main className="p-8">
        <p>Loading recommendation...</p>
      </main>
    );
  }

  if (!zone) {
    return (
      <main className="p-8">
        <p>Zone not found.</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-8 py-8">

      <header className="pb-6 mb-6 border-b border-line">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-ink flex items-center gap-2.5">
            <ChartBarIcon className="text-accent" />
            Recommendation Validation
          </h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium border border-line rounded-md px-3 py-1.5 hover:bg-bg-panel-alt transition-colors"
          >
            <BackIcon />
            Back
          </button>
        </div>

        <p className="text-[12.5px] text-muted mt-1.5">
          Recommendations derived from environmental drivers identified for this zone. Each action requires field
          validation before it can be logged as implemented.
        </p>

        <div className="mt-5 flex flex-wrap items-stretch gap-y-4">
          <div className="px-5 first:pl-0 border-r border-line">
            <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">Zone ID</div>
            <div className="mt-1 text-[15px] font-semibold text-ink">{zone.zone_id}</div>
          </div>
          <div className="px-5 border-r border-line">
            <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">Recommendations</div>
            <div className="mt-1 text-[15px] font-semibold text-ink">{zone.recommendations.length}</div>
          </div>
          <div className="px-5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">Status</div>
            <div className="mt-1 text-[15px] font-semibold text-ink">Pending field validation</div>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-line p-6">
        <h2 className="text-xl font-semibold">Proposed Recommendation</h2>

        <p className="text-sm text-faint mt-2">
          The following recommendations were derived from environmental experts based on the contributing
          degradation factors identified for this zone. These recommendations should first undergo field
          validation before implementation.
        </p>

        <div className="mt-6 space-y-4">
          {zone.recommendations.map((recText, index) => (
            <RecommendationCard
              key={index}
              zoneId={zone.zone_id}
              index={index}
              rec={resolveRecommendation(recText)}
            />
          ))}
        </div>
      </div>

    </main>
  );
}