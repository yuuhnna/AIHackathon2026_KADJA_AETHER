"use client";

import { useEffect, useState } from "react";
import { fetchFeatureImportance, fetchModelMetrics, fetchErrorBySeverity } from "@/lib/api";
import type { FeatureImportanceItem, ModelMetrics, ErrorByRangeItem } from "@/lib/types";
import FeatureImportance from "@/components/FeatureImportance";
import ErrorByRange from "@/components/ErrorByRange";
import { ChartBarIcon, InfoIcon, TargetIcon, CheckCircleIcon, WarningIcon } from "@/components/icons";

const PLACEHOLDER_METRICS: ModelMetrics = {
  mae: null,
  rmse: null,
  r2: null,
  confidence_score: null,
};

function ModelMetricsRow({ metrics }: { metrics: ModelMetrics }) {
  const cards = [
    {
      label: "Mean Absolute Error (MAE)",
      value: metrics.mae,
      format: (v: number) => v.toFixed(4),
      colorClass: "text-ink",
      accentClass: "bg-faint",
      icon: <TargetIcon className="text-faint" />,
    },
    {
      label: "Root Mean Squared Error (RMSE)",
      value: metrics.rmse,
      format: (v: number) => v.toFixed(4),
      colorClass: "text-accent",
      accentClass: "bg-accent",
      icon: <ChartBarIcon className="text-accent" />,
    },
    {
      label: "R² Score",
      value: metrics.r2,
      format: (v: number) => v.toFixed(3),
      colorClass: "text-risk-low",
      accentClass: "bg-risk-low",
      icon: <CheckCircleIcon className="text-risk-low" />,
    },
    {
      label: "Model Confidence Score",
      value: metrics.confidence_score,
      format: (v: number) => `${(v * 100).toFixed(1)}%`,
      colorClass: "text-risk-moderate",
      accentClass: "bg-risk-moderate",
      icon: <WarningIcon className="text-risk-moderate" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pl-1.5">
      {cards.map((card) => (
        <div key={card.label} className="relative">
          <span
            className={`absolute -left-1.5 inset-y-0 right-0 rounded-2xl -z-10 ${card.accentClass}`}
            aria-hidden="true"
          />
          <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] p-4 pl-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10.5px] uppercase tracking-wider text-muted font-medium">
                {card.label}
              </div>
              {card.icon}
            </div>
            <div className={`font-display text-[26px] xl:text-[28px] font-semibold ${card.colorClass}`}>
              {card.value !== null ? (
                card.format(card.value)
              ) : (
                <span className="text-faint text-[15px] font-mono font-normal">— pending eval</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExplainabilityPage() {
  const [importance, setImportance] = useState<FeatureImportanceItem[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorBySeverity, setErrorBySeverity] = useState<ErrorByRangeItem[]>([]);

  useEffect(() => {
    Promise.all([fetchFeatureImportance(), fetchModelMetrics(), fetchErrorBySeverity(),], )
      .then(([importanceData, metricsData, severityData]) => {
        setImportance(importanceData);
        setMetrics(metricsData);
        setErrorBySeverity(severityData);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load AI artifacts."
        );
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex flex-1 flex-col px-10 pb-14 pt-0">
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

          <div className="mt-5 flex flex-wrap items-stretch gap-y-4">

            <div className="px-5 first:pl-0 border-r border-line">
              <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">
                Dataset
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">
                2018–2022
              </div>
              <div className="text-[11px] text-muted">
                CGMD
              </div>
            </div>

            <div className="px-5 border-r border-line">
              <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">
                Observations
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">
                2559
              </div>
              <div className="text-[11px] text-muted">
                Training Data
              </div>
            </div>

            <div className="px-5 border-r border-line">
              <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">
                Model
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">
                Random Forest
              </div>
              <div className="text-[11px] text-muted">
                Regression
              </div>
            </div>

            <div className="px-5 border-r border-line">
              <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">
                Features
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">
                9 Variables
              </div>
            </div>

            <div className="px-5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-faint font-medium">
                Prediction Target
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ink">
                Area Loss %
              </div>
              <div className="text-[11px] text-muted">
                Next-Year
              </div>
            </div>

          </div>
        </header>

        

        <ModelMetricsRow metrics={metrics ?? PLACEHOLDER_METRICS} />

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ gridAutoRows: "340px" }}>
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
              <div className="px-5 py-4 flex-1 overflow-y-auto text-[12.5px] text-muted leading-relaxed space-y-3.5">
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
                    Model performance metrics above
                  </div>
                  <ul className="space-y-1.5 text-muted">
                    <li>
                      <span className="font-mono text-ink">MAE / RMSE</span> — average prediction
                      error, in the same units as the vulnerability score; lower is better.
                    </li>
                    <li>
                      <span className="font-mono text-ink">R²</span> — how much of the variation in
                      outcomes the model explains; closer to 1.0 is better.
                    </li>
                    <li>
                      <span className="font-mono text-ink">Confidence Score</span> — the share of
                      zones with reliable, non-placeholder input data.
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

              <span className="font-mono text-[11px] text-faint">
                Test Dataset
              </span>
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
