"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { RehabActivity, RehabStatus, ZoneSummary } from "@/lib/types";
import { IMPLEMENTING_UNITS, REHAB_STATUSES, ZONE_AREA_HA } from "@/lib/types";
import {
  ActivityStorageError,
  getLastImplementingUnit,
  getLastOfficerName,
  logActivity,
  sumAreaCovered,
  unlogActivity,
} from "@/lib/activityStore";
import { ACTION_CATEGORY_PILL_CLASS, classifyRecommendation, describeDriver } from "@/lib/recommendations";
import { REHAB_STATUS_PILL_CLASS } from "@/lib/colors";
import { formatIsoDateShort, todayIso } from "@/lib/dates";
import { ChevronDownIcon, CloseIcon } from "@/components/icons";

/**
 * Statuses that assert work has already happened. Logging one against a
 * future date would be a contradiction, so the form rejects it — "Planned"
 * is the status for future-dated work.
 */
const RETROSPECTIVE_STATUSES: readonly RehabStatus[] = ["Active", "Completed"];

const LABEL_CLASS =
  "block text-[10px] uppercase tracking-wider text-faint font-medium mb-1";
const FIELD_CLASS =
  "w-full border border-line bg-bg-panel text-ink font-mono text-[11.5px] px-2.5 py-[7px] rounded-sm placeholder:text-faint outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent transition-colors";

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
  const { title, category, fieldContext } = useMemo(
    () => classifyRecommendation(recommendation),
    [recommendation]
  );
  const driver = useMemo(() => describeDriver(recommendation, zone), [recommendation, zone]);

  const [isLogging, setIsLogging] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => fieldContext.map(() => false));
  const [status, setStatus] = useState<RehabStatus>("Active");
  const [date, setDate] = useState(todayIso());
  const [unit, setUnit] = useState<string>(IMPLEMENTING_UNITS[0]);
  const [officer, setOfficer] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [areaCovered, setAreaCovered] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  // Land keyboard focus on the first thing the officer must act on.
  useEffect(() => {
    if (isLogging) firstCheckboxRef.current?.focus();
  }, [isLogging]);

  const confirmedCount = checked.filter(Boolean).length;
  const allConfirmed = confirmedCount === fieldContext.length;
  const latest = history[0];
  const totalArea = sumAreaCovered(history);

  function openForm() {
    setChecked(fieldContext.map(() => false));
    setStatus("Active");
    setDate(todayIso());
    setUnit(getLastImplementingUnit() || IMPLEMENTING_UNITS[0]);
    setOfficer(getLastOfficerName());
    setActionTaken("");
    setAreaCovered("");
    setEvidenceRef("");
    setError(null);
    setIsLogging(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!allConfirmed) {
      setError("Confirm every field-context check before saving this entry.");
      return;
    }
    if (!date) {
      setError("Enter the date this action was implemented.");
      return;
    }
    if (RETROSPECTIVE_STATUSES.includes(status) && date > todayIso()) {
      setError(`"${status}" can't be dated in the future — use "Planned" for upcoming work.`);
      return;
    }
    if (!actionTaken.trim()) {
      setError("Describe the action taken so the record is auditable.");
      return;
    }

    // Optional, but if given it has to be a real area within the zone.
    let area: number | undefined;
    if (areaCovered.trim() !== "") {
      area = Number(areaCovered);
      if (!Number.isFinite(area) || area <= 0) {
        setError("Area covered must be a positive number of hectares.");
        return;
      }
      if (area > ZONE_AREA_HA) {
        setError(`Area covered can't exceed the zone's ${ZONE_AREA_HA.toFixed(1)} ha extent.`);
        return;
      }
    }

    setSubmitting(true);
    try {
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
        area_covered_ha: area,
        evidence_ref: evidenceRef,
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
              <span
                className={`inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] uppercase tracking-wide ${ACTION_CATEGORY_PILL_CLASS[category]}`}
              >
                {category}
              </span>
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
          <span className={`shrink-0 mt-1 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
            <ChevronDownIcon />
          </span>
        </button>
      </h3>

      {isOpen && (
        <div id={panelId} className="px-4 pb-4 border-t border-line-soft">
          <p className="text-[12px] text-muted leading-relaxed pt-3 mb-3">{recommendation}</p>

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

          <div className="border-t border-dashed border-line pt-3 flex items-center justify-between gap-3 flex-wrap">
            <span className="font-mono text-[11px] text-muted">
              {latest ? (
                <>
                  Last recorded: {formatIsoDateShort(latest.date)} — {latest.status}
                  {totalArea > 0 && ` · ${totalArea.toFixed(1)} ha covered`}
                </>
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

          {/* noValidate below: the browser's native bubbles would fire first
              and pre-empt handleSubmit's checks, so the officer would see a
              terse tooltip for some errors and this form's own message for
              others. */}
          {isLogging && (
            <form onSubmit={handleSubmit} noValidate className="mt-3">
              <fieldset className="border-l-2 border-accent bg-bg-panel-alt/50 rounded-r-sm px-3.5 py-3 mb-3.5">
                <legend className="sr-only">Confirm before logging</legend>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-faint font-medium">
                    Confirm before logging
                  </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-3 mb-3">
                <div>
                  <label htmlFor={`${fieldId}-date`} className={LABEL_CLASS}>
                    Date implemented
                  </label>
                  <input
                    id={`${fieldId}-date`}
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setError(null);
                    }}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor={`${fieldId}-status`} className={LABEL_CLASS}>
                    Status
                  </label>
                  <select
                    id={`${fieldId}-status`}
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as RehabStatus);
                      setError(null);
                    }}
                    className={`${FIELD_CLASS} cursor-pointer`}
                  >
                    {REHAB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${fieldId}-unit`} className={LABEL_CLASS}>
                    Implementing unit
                  </label>
                  <select
                    id={`${fieldId}-unit`}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`${FIELD_CLASS} cursor-pointer`}
                  >
                    {IMPLEMENTING_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${fieldId}-officer`} className={LABEL_CLASS}>
                    Officer <span className="normal-case tracking-normal">(optional)</span>
                  </label>
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

              <div className="mb-3">
                <label htmlFor={`${fieldId}-action`} className={LABEL_CLASS}>
                  Action taken
                </label>
                <textarea
                  id={`${fieldId}-action`}
                  required
                  rows={3}
                  value={actionTaken}
                  onChange={(e) => {
                    setActionTaken(e.target.value);
                    setError(null);
                  }}
                  placeholder="What was actually done on site?"
                  className={`${FIELD_CLASS} resize-y leading-relaxed`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-3 mb-3">
                <div>
                  <label htmlFor={`${fieldId}-area`} className={LABEL_CLASS}>
                    Area covered, ha <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    id={`${fieldId}-area`}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    max={ZONE_AREA_HA}
                    value={areaCovered}
                    onChange={(e) => {
                      setAreaCovered(e.target.value);
                      setError(null);
                    }}
                    placeholder={`0 – ${ZONE_AREA_HA.toFixed(1)}`}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label htmlFor={`${fieldId}-evidence`} className={LABEL_CLASS}>
                    Evidence ref <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <input
                    id={`${fieldId}-evidence`}
                    type="text"
                    value={evidenceRef}
                    onChange={(e) => setEvidenceRef(e.target.value)}
                    placeholder="Report or photo-set reference"
                    className={FIELD_CLASS}
                  />
                </div>
              </div>

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
                <button
                  type="submit"
                  disabled={!allConfirmed || submitting}
                  aria-describedby={!allConfirmed ? `${fieldId}-gate` : undefined}
                  className="font-mono text-[11.5px] font-semibold text-white bg-accent border border-accent px-3 py-[7px] rounded-sm transition-opacity cursor-pointer hover:opacity-90 disabled:bg-faint disabled:border-faint disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                  {submitting ? "Saving…" : "Save validated entry"}
                </button>
              </div>
              {!allConfirmed && (
                <p id={`${fieldId}-gate`} className="text-[10.5px] text-faint text-right mt-1.5">
                  Confirm all {fieldContext.length} field-context checks to enable saving.
                </p>
              )}
            </form>
          )}

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
                      {typeof entry.area_covered_ha === "number" && (
                        <span className="font-mono text-[10.5px] text-faint">
                          {entry.area_covered_ha.toFixed(1)} ha
                        </span>
                      )}
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
                    <div className="flex gap-3 flex-wrap mt-1">
                      {entry.officer_name && (
                        <span className="text-[10.5px] text-faint italic">{entry.officer_name}</span>
                      )}
                      {entry.evidence_ref && (
                        <span className="font-mono text-[10.5px] text-faint">
                          Ref: {entry.evidence_ref}
                        </span>
                      )}
                    </div>
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
