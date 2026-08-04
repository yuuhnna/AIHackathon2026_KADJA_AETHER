"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { RehabActivity, RehabStatus, ZoneSummary } from "@/lib/types";
import { IMPLEMENTING_UNITS, REHAB_STATUSES } from "@/lib/types";
import {
  ActivityStorageError,
  getLastImplementingUnit,
  logActivity,
  unlogActivity,
} from "@/lib/activityStore";
import { ACTION_CATEGORY_PILL_CLASS, classifyRecommendation, describeDriver } from "@/lib/recommendations";
import { REHAB_STATUS_PILL_CLASS } from "@/lib/colors";
import { formatIsoDateShort, todayIso } from "@/lib/dates";
import { ChevronDownIcon, CloseIcon } from "@/components/icons";

// "Active" and "Completed" mean work already happened, so future dates
// don't make sense for them — only "Planned" is forward-looking.
const RETROSPECTIVE_STATUSES: readonly RehabStatus[] = ["Active", "Completed"];

// Shared style constants so all labels and fields look consistent.
const LABEL_CLASS =
  "block text-[10px] uppercase tracking-wider text-faint font-medium mb-1";
const FIELD_CLASS =
  "w-full border border-line bg-bg-panel text-ink font-mono text-[11.5px] px-2.5 py-[7px] rounded-sm placeholder:text-faint outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent transition-colors";

// Small red asterisk to mark required fields visually.
// aria-hidden so screen readers don't read it out loud twice.
function Req() {
  return <span className="text-risk-high ml-0.5" aria-hidden="true">*</span>;
}

export default function RecommendationCard({
  zone,
  recommendation,
  index,
  history,
  isOpen,
  onToggle,
}: {
  zone: ZoneSummary;
  recommendation: string;
  index: number;
  history: RehabActivity[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fieldId = useId();
  const panelId = `${fieldId}-panel`;

  // Derive the human-readable title, action category, and field checklist
  // from the raw recommendation string coming from the backend rule engine.
  const { title, category, fieldContext } = useMemo(
    () => classifyRecommendation(recommendation),
    [recommendation]
  );
  const driver = useMemo(() => describeDriver(recommendation, zone), [recommendation, zone]);

  // Form state — officer starts empty on every open so nothing is
  // pre-filled from a previous session (removed getLastOfficerName).
  const [isLogging, setIsLogging] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => fieldContext.map(() => false));
  const [status, setStatus] = useState<RehabStatus>("Active");
  const [date, setDate] = useState(todayIso());
  const [unit, setUnit] = useState<string>(IMPLEMENTING_UNITS[0]);
  const [officer, setOfficer] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  // Move focus to the first checklist item when the form opens so the
  // officer can tab through everything without touching the mouse.
  useEffect(() => {
    if (isLogging) firstCheckboxRef.current?.focus();
  }, [isLogging]);

  const confirmedCount = checked.filter(Boolean).length;
  const allConfirmed = confirmedCount === fieldContext.length;

  // Save button is enabled only when every required field is filled
  // AND all checklist items are confirmed.
  const formComplete = allConfirmed && !!date && !!officer.trim() && !!actionTaken.trim();

  const latest = history[0];

  // Reset all form fields to their defaults when the officer clicks
  // "Log an entry". Officer is intentionally blank on every open.
  function openForm() {
    setChecked(fieldContext.map(() => false));
    setStatus("Active");
    setDate(todayIso());
    setUnit(getLastImplementingUnit() || IMPLEMENTING_UNITS[0]);
    setOfficer("");
    setActionTaken("");
    setError(null);
    setIsLogging(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Run validation in the order fields appear in the form.
    if (!allConfirmed) {
      setError("Confirm every field-context check before saving this entry.");
      return;
    }
    if (!date) {
      setError("Enter the date this action was implemented.");
      return;
    }
    // Reject future dates for statuses that imply work already happened.
    if (RETROSPECTIVE_STATUSES.includes(status) && date > todayIso()) {
      setError(`"${status}" can't be dated in the future — use "Planned" for upcoming work.`);
      return;
    }
    if (!actionTaken.trim()) {
      setError("Describe the action taken so the record is auditable.");
      return;
    }
    if (!officer.trim()) {
      setError("Enter the officer in charge.");
      return;
    }

    setSubmitting(true);
    try {
      // Write to Supabase (with localStorage fallback if offline).
      await logActivity({
        zone_id: zone.zone_id,
        status,
        date,
        action_category: category,
        recommendation_name: title,
        recommendation_text: recommendation,
        action_taken: actionTaken,
        implementing_unit: unit,
        officer_name: officer,
      });
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof ActivityStorageError ? err.message : "Couldn't save this entry. Try again."
      );
      return;
    }

    setSubmitting(false);
    setIsLogging(false);
    setError(null);
  }

  return (
    <li className="border border-line rounded-lg bg-bg-panel overflow-hidden">
      {/* Accordion header — clicking toggles the detail panel open/closed */}
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-bg-panel-alt/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-2 mb-1">
              {/* Category pill e.g. RESTORATION, MONITORING */}
              <span
                className={`inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] uppercase tracking-wide ${ACTION_CATEGORY_PILL_CLASS[category]}`}
              >
                {category}
              </span>
              {/* Show how many entries have been logged for this recommendation */}
              {history.length > 0 && (
                <span className="inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] bg-accent/15 text-accent">
                  {history.length} logged
                </span>
              )}
            </span>
            <span className="block text-[13.5px] font-semibold text-ink leading-snug">
              {index + 1}. {title}
            </span>
            <span className="block font-mono text-[10.5px] text-muted mt-1">
              Driver: <span className="text-accent">{driver}</span>
            </span>
          </span>
          {/* Chevron rotates 180° when the panel is open */}
          <span className={`shrink-0 mt-1 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
            <ChevronDownIcon />
          </span>
        </button>
      </h3>

      {/* Detail panel — only rendered when this card is open */}
      {isOpen && (
        <div id={panelId} className="px-4 pb-4 border-t border-line-soft">
          {/* Full recommendation text from the rule engine */}
          <p className="text-[12px] text-muted leading-relaxed pt-3 mb-3">{recommendation}</p>

          {/* Read-only field context checklist (bullets, not checkboxes) */}
          <div className="text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
            Field context
          </div>
          <ul className="list-none mb-3">
            {fieldContext.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-ink py-0.5">
                <span aria-hidden="true" className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* Status bar — shows last recorded entry or a "nothing yet" message */}
          <div className="border-t border-dashed border-line pt-3 flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-muted">
              {latest ? (
                <>Last recorded: {formatIsoDateShort(latest.date)} — {latest.status}</>
              ) : (
                "No entry recorded for this recommendation yet"
              )}
            </span>

            {isLogging ? (
              <button
                type="button"
                onClick={() => setIsLogging(false)}
                className="font-mono text-[11px] text-muted hover:text-ink border border-line hover:border-faint px-3 py-1.5 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={openForm}
                className="font-mono text-[11px] font-semibold text-white bg-accent hover:opacity-90 border border-accent px-3 py-1.5 rounded-sm transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              >
                Log an entry
              </button>
            )}
          </div>

          {/* Logging form — shown after "Log an entry" is clicked */}
          {isLogging && (
            <form onSubmit={handleSubmit} noValidate className="mt-3">
              {/* Checklist fieldset — officer must tick all items before saving */}
              <fieldset className="border-l-2 border-accent bg-bg-panel-alt/50 rounded-r-sm px-3.5 py-3 mb-3.5">
                <legend className="sr-only">Confirm before logging</legend>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-faint font-medium">
                    Confirm before logging<Req />
                  </span>
                  {/* Running count so the officer knows how far along they are */}
                  <span
                    className={`font-mono text-[10.5px] ${allConfirmed ? "text-accent font-semibold" : "text-faint"}`}
                  >
                    {confirmedCount}/{fieldContext.length}
                  </span>
                </div>

                {fieldContext.map((item, i) => (
                  <label
                    key={item}
                    className="flex items-start gap-2.5 py-1 text-[12px] text-ink cursor-pointer"
                  >
                    <input
                      ref={i === 0 ? firstCheckboxRef : undefined}
                      type="checkbox"
                      checked={checked[i] ?? false}
                      onChange={(e) => {
                        setChecked((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)));
                        setError(null);
                      }}
                      className="mt-0.5 shrink-0 w-3.5 h-3.5 accent-[var(--color-accent,#22B573)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    {item}
                  </label>
                ))}
              </fieldset>

              {/* Two-column grid for the main form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-3 mb-3">
                <div>
                  <label htmlFor={`${fieldId}-date`} className={LABEL_CLASS}>
                    Date implemented<Req />
                  </label>
                  <input
                    id={`${fieldId}-date`}
                    type="date"
                    required
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setError(null); }}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor={`${fieldId}-status`} className={LABEL_CLASS}>
                    Status<Req />
                  </label>
                  <select
                    id={`${fieldId}-status`}
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as RehabStatus); setError(null); }}
                    className={`${FIELD_CLASS} cursor-pointer`}
                  >
                    {REHAB_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${fieldId}-unit`} className={LABEL_CLASS}>
                    Implementing unit<Req />
                  </label>
                  <select
                    id={`${fieldId}-unit`}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`${FIELD_CLASS} cursor-pointer`}
                  >
                    {IMPLEMENTING_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${fieldId}-officer`} className={LABEL_CLASS}>
                    Officer in Charge<Req />
                  </label>
                  {/* Starts blank on every open — no pre-fill from previous sessions */}
                  <input
                    id={`${fieldId}-officer`}
                    type="text"
                    value={officer}
                    onChange={(e) => setOfficer(e.target.value)}
                    placeholder="e.g. Officer J. Villanueva"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

              {/* Full-width textarea for what the officer actually did on site */}
              <div className="mb-3">
                <label htmlFor={`${fieldId}-action`} className={LABEL_CLASS}>
                  Action taken<Req />
                </label>
                <textarea
                  id={`${fieldId}-action`}
                  required
                  rows={3}
                  value={actionTaken}
                  onChange={(e) => { setActionTaken(e.target.value); setError(null); }}
                  placeholder="What was actually done on site?"
                  className={`${FIELD_CLASS} resize-y leading-relaxed`}
                />
              </div>

              {/* Inline validation error shown above the action buttons */}
              {error && (
                <p role="alert" className="text-[11.5px] text-risk-high mb-2.5 leading-relaxed">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogging(false)}
                  className="font-mono text-[11.5px] text-muted hover:text-ink border border-line hover:border-faint px-3 py-[7px] rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Cancel
                </button>
                {/* Disabled until all required fields are filled and all checks confirmed */}
                <button
                  type="submit"
                  disabled={!formComplete || submitting}
                  aria-describedby={!formComplete ? `${fieldId}-gate` : undefined}
                  className="font-mono text-[11.5px] font-semibold text-white bg-accent border border-accent px-3 py-[7px] rounded-sm transition-opacity cursor-pointer hover:opacity-90 disabled:bg-faint disabled:border-faint disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  {submitting ? "Saving…" : "Save validated entry"}
                </button>
              </div>
              {/* Helper text explaining why the save button is still disabled */}
              {!formComplete && (
                <p id={`${fieldId}-gate`} className="text-[10.5px] text-faint text-right mt-1.5">
                  Complete all fields and confirm all {fieldContext.length} checks to enable saving.
                </p>
              )}
            </form>
          )}

          {/* History — all previously logged entries for this recommendation */}
          {history.length > 0 && (
            <div className="mt-4 pt-3 border-t border-line">
              <div className="text-[10px] uppercase tracking-wider text-faint font-medium mb-2">
                Recorded entries
              </div>
              <ul className="list-none">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="py-2.5 border-b border-dashed border-line-soft last:border-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-[10.5px] text-muted">
                        {formatIsoDateShort(entry.date)}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] ${REHAB_STATUS_PILL_CLASS[entry.status]}`}
                      >
                        {entry.status}
                      </span>
                      {entry.implementing_unit && (
                        <span className="font-mono text-[10.5px] text-accent">
                          {entry.implementing_unit}
                        </span>
                      )}
                      {/* Only logged entries (not seed data) can be removed */}
                      {entry.source === "logged" && (
                        <button
                          type="button"
                          onClick={() => void unlogActivity(entry.id)}
                          aria-label={`Remove entry from ${formatIsoDateShort(entry.date)}`}
                          className="ml-auto inline-flex items-center gap-1 font-mono text-[10.5px] text-muted hover:text-risk-high transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1"
                        >
                          <CloseIcon />
                          Remove
                        </button>
                      )}
                    </div>
                    {entry.action_taken && (
                      <p className="text-[12px] text-ink leading-relaxed">{entry.action_taken}</p>
                    )}
                    {entry.officer_name && (
                      <span className="text-[10.5px] text-faint italic mt-1 block">
                        {entry.officer_name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
