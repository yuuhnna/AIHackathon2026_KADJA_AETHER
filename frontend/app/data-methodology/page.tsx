import NavBar from "@/components/NavBar";

export default function MethodologyPage() {
  return (
    <div className="max-w-[1800px] mx-auto px-10 pb-14">
      <header className="pb-5 mb-6 border-b border-line">
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2.5">
          Data &amp; Methodology
        </h1>
        <p className="text-[12.5px] text-muted mt-1.5">
          Where the data comes from, how the model was built, and what it doesn&apos;t cover yet.
        </p>
      </header>

        <div
        id="technical-documentation"
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7"
      >
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <span className="text-ink">Technical Documentation</span>
          </h2>
        </div>

        <div className="p-4.5 space-y-5">

          <div>
            <h3 className="text-[13px] font-semibold text-ink mb-2">
              What AETHER&apos;s model is for, and the unit it reasons about. 
            </h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              AETHER&apos;S AI model addresses the challenge of helping environmental managers prioritize limitedc conservation
              resources by predicting which mangrove management zones are most likely to experience future degration - 
              enabling proactive rather than reactive intervention. 
            </p>
          </div>

          <div>
            <p className="text-[12.5px] text-muted leading-relaxed">
          The model reasons at the level of one <strong className="text-ink">Mangrove Area (MMA)</strong> - an offically recognized 
          mangrove management area within the Province of Iloilo - observed annually. The mirrors how environmental 
          offices actually organize conservation work: field inseptions, restotration projects, and resource allocation are 
          planned at the level of identifiable management areas, not individual pixels or entire municipalities. Annual 
          observations were chosen over finer time steps because mangrove area losss is generally analyzed over longer
          periods, which reduces noise and keeps labels meaningful. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
