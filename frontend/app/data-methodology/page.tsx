import { FEATURE_LABELS } from "@/lib/colors";
import MethodologySidebar from "@/components/MethodologySidebar";
import ValidationTable, { EXPERT_VALIDATION_ROWS } from "@/components/ValidationTable";
import {
  InfoIcon,
  TargetIcon,
  CheckCircleIcon,
  GridIcon,
  DatabaseIcon,
  CpuIcon,
  WarningIcon,
} from "@/components/icons";

const DATA_SOURCES = [
  {
    name: "Sentinel-2 (via Google Earth Engine)",
    use: "NDVI and MVI vegetation indices, cloud-masked median composite",
  },
  {
    name: "SRTM Digital Elevation Model",
    use: "Elevation and terrain slope",
  },
  {
    name: "Global Mangrove Watch (GMW)",
    use: "Historical mangrove extent — used as the training label (loss fraction between two time points), not as a live input feature",
  },
  {
    name: "ERA5 (Copernicus Climate Data Store)",
    use: "Mean temperature, precipitation, wind exposure",
  },
  {
    name: "OpenStreetMap",
    use: "Distance to nearest road, aquaculture site, and river",
  },
];

type FeatureDoc = {
  key: string;
  description: string;
  source: string;
};

const INPUT_FEATURES: FeatureDoc[] = [
  {
    key: "mean_ndvi",
    description:
      "General canopy greenness and vigor, derived from Sentinel-2 reflectance. Sensitive to vegetation stress before it becomes visible on the ground.",
    source: "Sentinel-2",
  },
  {
    key: "mean_mvi",
    description:
      "A mangrove-specific vegetation index — distinguishes mangrove stand condition from general greenness, which NDVI alone can't do.",
    source: "Sentinel-2",
  },
  {
    key: "mean_temperature",
    description: "Mean air temperature for the zone. Sustained heat stress is linked to canopy dieback.",
    source: "ERA5",
  },
  {
    key: "annual_precipitation",
    description:
      "Total annual rainfall. Both prolonged deficit and abnormal excess are associated with mangrove stress.",
    source: "ERA5",
  },
  {
    key: "mean_wind_speed",
    description: "Average wind speed. Higher exposure raises physical storm-damage risk to mangrove stands.",
    source: "ERA5",
  },
  {
    key: "mean_elevation",
    description: "Height above sea level. Low-elevation zones face greater tidal inundation and flood exposure.",
    source: "SRTM",
  },
  {
    key: "mean_slope",
    description: "Steepness of terrain. Steeper slopes are more prone to erosion and sediment loss.",
    source: "SRTM",
  },
  {
    key: "nearest_aquaculture_distance_m",
    description:
      "Distance to the nearest aquaculture site. Closer proximity indicates higher land-conversion pressure.",
    source: "OpenStreetMap",
  },
  {
    key: "nearest_river_distance_m",
    description:
      "Distance to the nearest river. Affects freshwater and sediment connectivity important for recovery.",
    source: "OpenStreetMap",
  },
];

const RULE_COVERED_FEATURES = new Set([
  "mean_ndvi",
  "mean_mvi",
  "mean_elevation",
  "nearest_aquaculture_distance_m",
  "nearest_river_distance_m",
]);


export default function MethodologyPage() {
  return (
    <div className="max-w-[1800px] mx-auto px-6 pb-14">
      <header className="pb-5 mb-6 border-b border-line">
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2.5">
          Data &amp; Methodology
        </h1>
        <p className="text-[12.5px] text-muted mt-1.5">
          Where the data comes from, how the model was built, and what it doesn&apos;t cover yet.
        </p>
      </header>

      <div className="flex gap-6 items-start">
        <MethodologySidebar />
        <div className="flex-1 min-w-0">

        <div // technical documentation
        id="technical-documentation" 
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7">
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <InfoIcon />
            <span className="text-ink">Technical Documentation</span>
          </h2>
        </div>

        <div className="p-4.5 space-y-5">

          <div>
            <h3 className="text-[13px] font-semibold text-ink mb-2">
              What AETHER&apos;s model is for, and the unit it reasons about. 
            </h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              AETHER&apos;S AI model addresses the challenge of helping environmental managers prioritize limited conservation
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
    
    <div // target limitation 
        id="target-limitation"
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7"
      >
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <TargetIcon />
            <span className="text-ink">Target Limitation</span>
          </h2>
        </div>

        <div className="p-4.5 space-y-5">

          <div>
            <p className="text-[12.5px] text-muted leading-relaxed">
              A proxy target is only trustworthy if its blind spots are documented alongside it. 
            </p>
          </div>

          <div>
            <p className="text-[12.5px] text-muted leading-relaxed">
          The current target does <strong className="text-ink">not</strong> directly measure:
            </p>
          </div>

          <ul className="list-disc list-inside text-[12.5px] text-muted leading-relaxed">
            <li> Habitat fragmentation </li>
            <li> Canopy condition</li>
            <li> Biodiversity decline</li>
            <li> Regeneration capacity</li>
            <li> Ecosystem resilience</li>
            <li> Species composition</li>
            <li> Hydrological changes</li>
          </ul>

           <div className="flex items-start gap-2 text-[12px] text-risk-moderate bg-risk-moderate/10 border border-risk-moderate/40 rounded-sm px-3 py-2 mb-4">
            <span>
              <strong>WHY THIS IS STATED PLAINLY</strong> 
              <p>Area loss is real and useful signal, but it is one dimension of degration, not the whole picture. Predictions
                should be read as &quot;risk of measurable area loss,&quot; not as a general degration score. 
              </p>
            </span>
          </div>
        </div>
      </div>

      <div // feature justification 
        id="feature-justification"
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7">
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <CheckCircleIcon />
            <span className="text-ink">Feature Justification</span>
          </h2>
        </div>

        <div className="p-4.5 space-y-5">

          <div>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Features are selected by intuition or convenience. Every candidate feature must satisfy a structured, 
              predefined framework before inclusion - so the final feature set is evidence-based, reproducible, 
              interpretable, and feasible to deploy. 
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-ink mb-2">
              Selection Criteria Framework
            </h3>

            <p className="text-[12.5px] text-muted leading-relaxed">
          A feature is included only if it satisfies all eight criteria below, in order: 
          </p> 
          </div>

            <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full table-fixed border-collapse text-[12.5px]">
            <thead className="bg-bg-panel-alt border-b border-line">
              <tr>
                <th className="w-12 px-4 py-3 align-top text-left font-semibold text-ink">
                  #
                </th>
                <th className="w-56 px-4 py-3 align-top text-left font-semibold text-ink">
                  Criterion
                </th>
                <th className="w-[34%] px-4 py-3 align-top text-left font-semibold text-ink">
                  Question Answered
                </th>
                <th className="w-[34%] px-4 py-3 align-top text-left font-semibold text-ink">
                  Purpose
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line-soft">
              <tr>
                <td className="px-4 py-3 align-top">1</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Scientific Validity
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Is the feature supported by peer-reviewed literature or established
                  mangrove monitoring studies?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensure selection is evidence-based and scientifically justified.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">2</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Prediction Relevance
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Does the feature have a plausible relationship with future mangrove
                  area loss?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensure the feature contributes meaningful predictive information.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">3</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Measurability &amp; Computability
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Can the feature be objectively measured or consistently computed for
                  every MMA?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensure standardized, reproducible feature extraction.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">4</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Data Availability
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Is the required data publicly available and free to access?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Enables reproducibility and long-term sustainability without
                  licensing barriers.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">5</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Spatial Compatibility
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Can the feature be aggregated to the MMA?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensures consistency with the prediction unit.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">6</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Temporal Compatibility
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Is historical annual data available?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensures alignment with the annual prediction target.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">7</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Interpretability
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Can the ecological significance of the feature be clearly explained?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Supports explainable AI and stakeholder trust.
                </td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top">8</td>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Technical Feasibility
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Can the feature be processed with available tools and project
                  constraints?
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Ensures practical implementation for the hackathon MVP and future
                  deployment.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

           <div>
            <h3 className="text-[13px] font-semibold text-ink mb-2">
              Why mangrove Area Loss, not "Degration" directly?
            </h3>

            <p className="text-[12.5px] text-muted leading-relaxed">
            Mangrove degration is a multidimentional ecological process - structural fragmentation, reduced vegetation,
            health, biodiversity loss, hydrological alteration, changes in ecosystem function. No single publicly availabe
            dataset comprehensively captures all od these dimensions across space and time. For MVP, AETHER uses annual mangrove 
            area loss as a measurable proxy for one impoortant manifestation of degration, because it provides objective, historically
            observable labels suitable for suoervised learning. 
          </p> 
          </div>

          <div>
             <h3 className="text-[13px] font-semibold text-ink mb-2">
              MVI Formula % Citation
            </h3>
          </div>
          <div className="flex items-start gap-3 bg-white border border-line border-l-4 border-l-accent rounded-sm px-4 py-3 mb-4">
        <span>
          <strong className="text-[13px]">
            Formula
          </strong>
          <p className="text-[12px] text-muted leading-relaxed">
           MVI + ( NIR - GREEN) / (SWIR1 - GREEN)
          </p>
        </span>
        </div>
        <div>
          <p className="text-[12.5px] text-muted leading-relaxed">
              Computed from Sentinel-2 Band 8 (NIR), Band 3 (Green), and Band 11 (SWIR1). The numerator (NIR - Green)
              captures the difference in greeness between mangrove and terrestrial vegetation; the denominator (SWIR1 - Green)
              captures the distinct moisture signature of mangroves, without requiring a seperate water index. Higher MVI 
              values indicate a higher probablity that a pixel is mangrove. 
            </p>
        </div>
        <div>
          <p className="text-[12.5px] text-muted leading-relaxed">
              Source: Baloloy A.B., Blanco, A.C., Sta Ana., R.R.C., & Nadaoka, K. (2020). Development and application of a
              new mangrove vegetation index (MVI) for rapid and accurate mangrove mapping, <em>ISPRS Journal of Photogrammetry and Remote Sensing, 166, 95-117.</em>
            </p>
        </div>
         <div className="flex items-start gap-3 bg-white border border-line border-l-4 border-l-yellow-400 rounded-sm px-4 py-3 mb-4">
        <span>
          <strong className="text-[13px]">
            WHY THIS SATISFIES CRITERION 1 (SCIENTIFIC VALIDITY)
          </strong>
          <p className="text-[12px] text-muted leading-relaxed">
           The original study reports 92% overall classfication accuracy against field inventory and drone orthopoto
           data across eleven Philippine mangrove sites, and defines an optimal minumum of treshold of 4.5 for Sentinel-2 
           imagery (4.6 for Landsat) - giving AETHER a peer-reviewed, field-validated basis for the MVI feature rather than an internally assumed formula.
          </p>
        </span>
        </div>
        </div>
      </div>

<div id="input-features" className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7">
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <span className="text-ink">Input Features</span>
          </h2>
          <span className="font-mono text-[11px] text-faint">{INPUT_FEATURES.length} features</span>
        </div>
        <div className="p-4.5">
          <div className="divide-y divide-line-soft">
            {INPUT_FEATURES.map((f) => (
              <div key={f.key} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex justify-between items-baseline gap-2">
                  <div className="text-[12.5px] font-semibold text-ink">{FEATURE_LABELS[f.key]}</div>
                  <span className="font-mono text-[10px] text-faint shrink-0">{f.source}</span>
                </div>
                <div className="text-[12px] text-muted mt-0.5">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="data-sources"
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7"
      >
            <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
              <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
                <span className="text-ink">Data Sources</span>
              </h2>
              <span className="font-mono text-[11px] text-faint">{DATA_SOURCES.length} sources</span>
            </div>
            <div className="p-4.5">
              <div className="divide-y divide-line-soft">
                {DATA_SOURCES.map((source) => (
                  <div key={source.name} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-[12.5px] font-semibold text-ink">{source.name}</div>
                    <div className="text-[12px] text-muted mt-0.5">{source.use}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

<div
            id="recommendation-engine"
            className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7"
          >
            <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
              <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
                <span className="text-ink">Recommendation Engine &amp; Expert Validation</span>
              </h2>
              <span className="font-mono text-[11px] text-faint">PENRO Guimaras (DENR)</span>
            </div>
            <div className="p-4.5">
              <div className="text-[12.5px] text-muted leading-relaxed space-y-3 mb-4">
                <p>
                  <strong className="text-ink">Model:</strong> Random Forest Regressor (scikit-learn),
                  trained on the 10 input features above. <strong className="text-ink">Explainability:</strong>{" "}
                  SHAP (TreeExplainer) attributes each prediction to its top contributing factors.
                </p>
                <p>
                  <strong className="text-ink">Recommendations:</strong> conservation actions come from a
                  fixed, rule-based engine (
                  <code className="text-[11px] bg-bg-panel-alt px-1 rounded-sm">app/recommend.py</code>) —
                  not the model itself — so they stay transparent and auditable rather than model-generated.
                  The full rule base below was submitted to{" "}
                  <strong className="text-ink">PENRO Guimaras (DENR)</strong> for expert review.
                </p>
              </div>

              <div className="flex items-start gap-2 text-[12px] text-risk-moderate bg-risk-moderate/10 border border-risk-moderate/40 rounded-sm px-3 py-2.5 mb-4">
                <span>
                  <strong>Coverage gap:</strong> the rule base spans all 10 features across{" "}
                  {EXPERT_VALIDATION_ROWS.length} scenarios (single and combined drivers), but the
                  currently deployed engine only implements rule branches for{" "}
                  {RULE_COVERED_FEATURES.size} of them — NDVI, MVI, elevation, and distance to
                  road/aquaculture/river. Temperature-, precipitation-, wind-, and slope-triggered
                  recommendations are part of the validated rule base but not yet wired into the live
                  API.
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="text-[10.5px] uppercase tracking-wider text-faint">
                  Expert validation table — click a row for field-validation detail
                </div>
                <span className="font-mono text-[10px] text-faint">
                  0 / {EXPERT_VALIDATION_ROWS.length} signed off
                </span>
              </div>
              <ValidationTable rows={EXPERT_VALIDATION_ROWS} />
            </div>
          </div>

          <div
            id="scope-limitations"
            className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden scroll-mt-7"
          >
            <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
              <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
                <span className="text-ink">Scope, Bias &amp; Limitations</span>
              </h2>
            </div>
            <div className="p-4.5"> 
              <ul className="space-y-3.5">
                <li className="flex gap-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint mt-0.5 shrink-0 w-20">
                    Geography
                  </span>
                  <span className="text-[12.5px] text-muted leading-relaxed">
                    Monitored zones are in <strong className="text-ink">Iloilo Province</strong>. The
                    recommendation rule base above was reviewed by{" "}
                    <strong className="text-ink">PENRO Guimaras</strong> — a neighboring province, not
                    the modeled area&apos;s own jurisdiction. Treat that review as a reasonable
                    regional-expertise proxy, not a substitute for Iloilo-based DENR/CENRO sign-off.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint mt-0.5 shrink-0 w-20">
                    Data
                  </span>
                  <span className="text-[12.5px] text-muted leading-relaxed">
                    <code className="text-[11px] bg-bg-panel-alt px-1 rounded-sm">nearest_aquaculture_distance_m</code>{" "}
                    and <code className="text-[11px] bg-bg-panel-alt px-1 rounded-sm">nearest_river_distance_m</code>{" "}
                    are currently null for every monitored zone — those layers haven&apos;t been
                    integrated yet, which is why every zone is flagged with a low-confidence
                    placeholder. The model still returns a score for all of them; predictions are{" "}
                    <strong className="text-ink">not</strong> currently restricted to zones with a
                    complete feature set.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint mt-0.5 shrink-0 w-20">
                    Validation
                  </span>
                  <span className="text-[12.5px] text-muted leading-relaxed">
                    As of this submission, 0 of the {EXPERT_VALIDATION_ROWS.length} rule-base scenarios
                    have completed expert sign-off. Recommendations should be treated as{" "}
                    <strong className="text-ink">provisional</strong> pending PENRO/DENR field
                    validation — not confirmed conservation guidance.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint mt-0.5 shrink-0 w-20">
                    Model
                  </span>
                  <span className="text-[12.5px] text-muted leading-relaxed">
                    Trained on placeholder values for the incomplete columns noted above. Retraining
                    against real proximity/elevation layers (see{" "}
                    <code className="text-[11px] bg-bg-panel-alt px-1 rounded-sm">
                      backend/scripts/gee_build_feature_table.py
                    </code>
                    ) is required before operational use.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-faint mt-0.5 shrink-0 w-20">
                    Intent
                  </span>
                  <span className="text-[12.5px] text-muted leading-relaxed">
                    This is decision support, not an autonomous decision-maker — every recommendation
                    above explicitly requires field validation steps before action.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
     </div>
  );
}
