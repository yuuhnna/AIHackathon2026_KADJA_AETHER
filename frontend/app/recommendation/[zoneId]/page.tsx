"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchZoneDetail } from "@/lib/api";
import type { ZoneSummary } from "@/lib/types";

export default function RecommendationPage() {
  const { zoneId } = useParams<{ zoneId: string }>();

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

      <h1 className="text-3xl font-bold">
        Recommendation Validation
      </h1>

      <p className="text-muted mt-2">
        Zone ID: {zone.zone_id}
      </p>

      <div className="mt-8 rounded-xl border border-line p-6">

        <h2 className="text-xl font-semibold">
          Proposed Recommendation
        </h2>

        <p className="text-sm text-faint mt-2">
          The following recommendations were derived from environmental
          experts based on the contributing degradation factors identified
          for this zone. These recommendations should first undergo field
          validation before implementation.
        </p>

        <div className="mt-6 space-y-4">
          {zone.recommendations.map((rec, index) => (
            <div
              key={index}
              className="rounded-lg border border-line p-4"
            >
              <h3 className="font-semibold">
                Recommendation {index + 1}
              </h3>

              <p className="mt-2">
                {rec}
              </p>

              <div className="mt-4 rounded-md bg-bg-panel-alt p-3">

                <p className="font-medium">
                  Field Validation Checklist
                </p>

                <p className="text-sm text-faint mt-2">
                  (Template placeholder)
                </p>

              </div>
            </div>
          ))}
        </div>

      </div>

    </main>
  );
}