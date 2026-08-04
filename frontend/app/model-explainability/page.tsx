"use client";

import { useEffect, useState } from "react";
import { fetchFeatureImportance, fetchErrorBySeverity, fetchModelMetrics, fetchScatterPlot } from "@/lib/api";
import type { FeatureImportanceItem, ErrorByRangeItem, ModelMetrics, ScatterPlotResponse} from "@/lib/types";
import FeatureImportance from "@/components/FeatureImportance";
import ErrorByRange from "@/components/ErrorByRange";
import ScatterPlot from "@/components/ScatterPlot";
import { ChartBarIcon, InfoIcon, WarningIcon } from "@/components/icons";

export default function ExplainabilityPage() {
  const [importance, setImportance] = useState<FeatureImportanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorBySeverity, setErrorBySeverity] = useState<ErrorByRangeItem[]>([]);
  // Fetched from the backend — never hardcoded
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [scatter, setScatter] = useState<ScatterPlotResponse | null>(null);

  useEffect(() => {
    Promise.all([
      fetchFeatureImportance(),
      fetchErrorBySeverity(),
      fetchModelMetrics(),
      fetchScatterPlot(),
    ])
      .then(([importanceData, severityData, metricsData, scatterData]) => {
        setImportance(importanceData);
        setErrorBySeverity(severityData);
        setMetrics(metricsData);
        setScatter(scatterData)
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load AI artifacts.");
        setLoading(false);
      });
  }, []);

  // Derive display values from live metrics so nothing is hardcoded
  const metaItems = metrics ? [
    {
      label: "Dataset",
      value: metrics.dataset?.year_range ?? "—",
      sub: metrics.dataset?.source ?? "—",
      subClass: "text-accent",
    },
    {
      label: "Observations",
      value: metrics.dataset?.samples
        ? metrics.dataset.samples.toLocaleString()
        : "—",
      sub: "Training Data",
      subClass: "text-muted",
    },
    {
      label: "Model",
      // Strip "Regressor" from the name for brevity e.g. "Random Forest"
      value: metrics.model?.name?.replace(" Regressor", "") ?? "—",
      sub: metrics.model?.type ?? "Regression",
      subClass: "text-muted",
    },
    {
      label: "Features",
      value: metrics.dataset?.features
        ? `${metrics.dataset.features} Variables`
        : "—",
      sub: "Input features",
      subClass: "text-muted",
    },
    {
      label: "Prediction Target",
      value: metrics.dataset?.prediction_target ?? "—",
      sub: metrics.dataset?.prediction_horizon ?? "—",
      subClass: "text-muted",
    },
  ] : [];

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

          {/* Metadata card — data comes from /api/model-metrics, not hardcoded */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden">
              {metrics ? (
                // Grid layout so items reflow cleanly at any zoom level
                // while the card itself stays the same width.
                <div className="grid grid-cols-5 divide-x divide-line">
                  {metaItems.map((item) => (
                    <div key={item.label} className="px-5 py-4 min-w-0">
                      <div className="text-[10.5px] uppercase tracking-[0.18em] text-faint font-semibold mb-1 break-words">
                        {item.label}
                      </div>
                      <div className="text-[15px] font-bold text-ink leading-tight truncate">
                        {item.value}
                      </div>
                      <div className={`text-[11.5px] mt-0.5 truncate ${item.subClass}`}>
                        {item.sub}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Skeleton while metrics are loading
                <div className="grid grid-cols-5 divide-x divide-line animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="h-2.5 w-16 bg-line rounded mb-2" />
                      <div className="h-5 w-20 bg-line rounded mb-1.5" />
                      <div className="h-2 w-12 bg-line rounded" />
                    </div>
                  ))}
                </div>
              )}
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
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            style={{ gridAutoRows: "minmax(340px, auto)" }}
          >
            {/* Feature Importance */}
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-line bg-bg-panel-alt shrink-0">
                <h2 className="font-display text-sm font-semibold flex items-center gap-2">
                  <ChartBarIcon className="text-accent" />
                  <span className="text-ink">Global Feature Importance</span>
                </h2>

                <span className="font-mono text-[11px] text-faint">
                  Random Forest, MDI
                </span>
              </div>

              <div className="px-5 py-4 flex-1 overflow-y-auto">
                <FeatureImportance items={importance} />
              </div>
            </div>

            {/* Prediction Error by Severity */}
            <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden flex flex-col">
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

              <div className="p-5 flex-1">
                <ErrorByRange items={errorBySeverity} />
              </div>
            </div>
          </div>
        )}

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
