"use client";

import { useEffect, useState } from "react";
import { fetchFeatureImportance, fetchErrorBySeverity } from "@/lib/api";
import type { FeatureImportanceItem, ErrorByRangeItem } from "@/lib/types";
import FeatureImportance from "@/components/FeatureImportance";
import ErrorByRange from "@/components/ErrorByRange";
import { ChartBarIcon, InfoIcon, WarningIcon } from "@/components/icons";

export default function ExplainabilityPage() {
  const [importance, setImportance] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorBySeverity, setErrorBySeverity] = useState<ErrorByRangeItem[]>([]);

  useEffect(() => {
    Promise.all([fetchFeatureImportance(), fetchErrorBySeverity()])
      .then(([importanceData, severityData]) => {
        setImportance(importanceData);
        setErrorBySeverity(severityData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load AI artifacts.");
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex flex-1 flex-col px-6 pb-14 pt-0">
      <div className="w-full max-w-[1800px] mx-auto flex flex-col flex-1">

        <header className="pb-6 mb-6 border-b border-line">
          <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2.5">
            <ChartBarIcon className="text-accent" />
            AI Model Explainability
          </h1>
          <p className="text-[12.5px] text-muted mt-1.5">
            How the model weighs each factor and how well its predictions hold up
            against known outcomes.
          </p>

          {/* Wrap in the same grid as the panels below so widths match exactly */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden">
              <div className="flex flex-wrap items-stretch divide-x divide-line">
                <div className="px-6 py-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1">Dataset</div>
                  <div className="text-[17px] font-bold text-ink leading-tight">2018–2022</div>
                  <div className="text-[12px] text-accent mt-0.5">CGMD</div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1">Observations</div>
                  <div className="text-[17px] font-bold text-ink leading-tight">2,559</div>
                  <div className="text-[12px] text-muted mt-0.5">Training Data</div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1">Model</div>
                  <div className="text-[17px] font-bold text-ink leading-tight">Random Forest</div>
                  <div className="text-[12px] text-muted mt-0.5">Regression</div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1">Features</div>
                  <div className="text-[17px] font-bold text-ink leading-tight">9 Variables</div>
                  <div className="text-[12px] text-muted mt-0.5">Input features</div>
                </div>
                <div className="px-6 py-4">
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1">Prediction Target</div>
                  <div className="text-[17px] font-bold text-ink leading-tight">Area Loss %</div>
                  <div className="text-[12px] text-muted mt-0.5">Next-Year</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <div
            className="py-16 flex flex-col items-center justify-center gap-3 text-muted"
            role="status"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-full border-2 border-line border-t-accent animate-spin"
            />
            <span className="font-mono text-sm">Loading model explainability data…</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="font-mono text-sm text-white bg-risk-high/90 rounded-sm p-4 flex items-start gap-3"
          >
            <WarningIcon className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ gridAutoRows: "minmax(340px, auto)" }}>
            {/* Feature importance */}
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-line bg-bg-panel-alt shrink-0">
                <h2 className="font-display text-sm font-semibold flex items-center gap-2">
                  <ChartBarIcon className="text-accent" />
                  <span className="text-ink">Global feature importance</span>
                </h2>
                <span className="font-mono text-[11px] text-faint">Random Forest, MDI</span>
              </div>
              <div className="px-5 py-4 flex-1 overflow-y-auto">
                <FeatureImportance items={importance} />
              </div>
            </div>

            {/* How to read this */}
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-line bg-bg-panel-alt shrink-0">
                <h2 className="font-display text-sm font-semibold flex items-center gap-2">
                  <InfoIcon className="text-accent" />
                  <span className="text-ink">How to read this</span>
                </h2>
              </div>
              <div className="px-5 py-4 flex-1 text-[12.5px] text-muted leading-relaxed space-y-3.5">
                <p>
                  This chart shows what the Random Forest model relies on most across{" "}
                  <strong className="text-ink">every</strong>{" "}
                  monitored zone — not any single prediction. It&apos;s computed from Mean
                  Decrease in Impurity (MDI): how much each feature reduces prediction error,
                  summed across every split in every tree.
                </p>
                <p>
                  For a single zone&apos;s specific reasoning — which factors pushed{" "}
                  <em>that zone&apos;s</em>{" "}
                  score up or down — see the &quot;Zone Assessment Details&quot; panel on the
                  Dashboard, which uses SHAP instead of MDI.
                </p>
                <div className="pt-3 mt-3 border-t border-line-soft">
                  <div className="text-[10.5px] uppercase tracking-wider text-faint font-medium mb-2">
                    About this model
                  </div>
                  <ul className="space-y-1.5 text-muted">
                    <li>
                      <span className="font-mono text-ink">MDI</span> — Mean Decrease in Impurity,
                      a model-wide measure of how much each feature reduces prediction error.
                    </li>
                    <li>
                      <span className="font-mono text-ink">SHAP</span> — per-prediction explanation
                      used in the Zone Assessment Details panel on the Dashboard.
                    </li>
                  </ul>
                </div>
                <p className="text-faint">
                  MDI = a model-wide summary. SHAP = a per-prediction explanation. Both come from
                  the same trained model.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Error by Severity */}
        <section className="mt-6">
          <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-bg-panel-alt">
              <div>
                <h2 className="font-display text-sm font-semibold text-ink">
                  Prediction Error by Severity
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Error distribution grouped by the observed mangrove area loss.
                </p>
              </div>
              <span className="font-mono text-[11px] text-faint">Test Dataset</span>
            </div>
            <div className="p-5">
              <ErrorByRange items={errorBySeverity} />
            </div>
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t border-line text-[11px] text-faint font-mono flex justify-between flex-wrap gap-2">
          <span>
            AETHER — Autonomous Eco-Sentinel for Threat Evaluation, Habitat Intelligence, and
            Ecosystem Resilience
          </span>
          <span>Team KADJA · AI Fest</span>
        </footer>

      </div>
    </main>
  );
}
