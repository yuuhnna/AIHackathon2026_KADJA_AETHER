import NavBar from "@/components/NavBar";
import KpiRow from "@/components/KpiRow";
import type { SummaryStats } from "@/lib/types";

const placeholderSummary: SummaryStats = {
  total_zones: 128,
  total_area_ha: 1152,
  max_area_loss_percent: 4.7,
  active_rehabilitation_count: 12,
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1410]">
      <NavBar />
      <main className="flex flex-1 flex-col px-6 py-6">
        <KpiRow summary={placeholderSummary} />
      </main>
    </div>
  );
}