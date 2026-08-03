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

        <div // technical documentation 
        id="technical-documentation" 
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7">
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
    
    <div // target limitation 
        id="target-limitation"
        className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] overflow-hidden mb-5 scroll-mt-7"
      >
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
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
            <h3 className="text-[12.5px] font-semibold text-ink mb-2">
              Feature Justification Table
            </h3>
           <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full table-fixed border-collapse text-[12.5px]">
            <thead className="bg-bg-panel-alt border-b border-line">
              <tr>
                <th className="w-[25%] px-4 py-3 align-top text-left font-semibold text-ink">
                  Feature
                </th>
                <th className="w-[55%] px-4 py-3 align-top text-left font-semibold text-ink">
                  Description
                </th>
                <th className="w-[20%] px-4 py-3 align-top text-left font-semibold text-ink">
                  Source
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line-soft">
              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Vegetation Health (NDVI)
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  General canopy greenness and vigor derived from Sentinel-2
                  reflectance. Sensitive to vegetation stress before it becomes visible
                  on the ground.
                </td>
                <td className="px-4 py-3 align-top text-muted">Sentinel-2</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Mangrove-specific Vegetation (MVI)
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  A mangrove-specific vegetation index that distinguishes mangrove stand
                  condition from general greenness, which NDVI alone cannot provide.
                </td>
                <td className="px-4 py-3 align-top text-muted">Sentinel-2</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Mean Air Temperature
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Mean air temperature for the zone. Sustained heat stress is linked to
                  canopy dieback.
                </td>
                <td className="px-4 py-3 align-top text-muted">ERA5</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Annual Precipitation
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Total annual rainfall. Both prolonged deficit and abnormal excess are
                  associated with mangrove stress.
                </td>
                <td className="px-4 py-3 align-top text-muted">ERA5</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Mean Wind Exposure
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Average wind speed. Higher exposure raises physical storm-damage risk
                  to mangrove stands.
                </td>
                <td className="px-4 py-3 align-top text-muted">ERA5</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Elevation Above Sea Level
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Height above sea level. Low-elevation zones face greater tidal
                  inundation and flood exposure.
                </td>
                <td className="px-4 py-3 align-top text-muted">SRTM</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Terrain Slope
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Steepness of terrain. Steeper slopes are more prone to erosion and
                  sediment loss.
                </td>
                <td className="px-4 py-3 align-top text-muted">SRTM</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Proximity to Aquaculture
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Distance to the nearest aquaculture site. Closer proximity indicates
                  higher land-conversion pressure.
                </td>
                <td className="px-4 py-3 align-top text-muted">OpenStreetMap</td>
              </tr>

              <tr>
                <td className="px-4 py-3 align-top font-medium text-ink">
                  Proximity to Rivers
                </td>
                <td className="px-4 py-3 align-top text-muted">
                  Distance to the nearest river. Affects freshwater and sediment
                  connectivity important for recovery.
                </td>
                <td className="px-4 py-3 align-top text-muted">OpenStreetMap</td>
              </tr>
            </tbody>
          </table>
        </div>
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

    </div>
  );
}
