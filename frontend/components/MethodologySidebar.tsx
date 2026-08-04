"use client";

import { useEffect, useState } from "react";
import {
  InfoIcon,
  TargetIcon,
  CheckCircleIcon,
  GridIcon,
  DatabaseIcon,
  CpuIcon,
  WarningIcon,
} from "@/components/icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;
type SectionLink = { id: string; label: string; icon: IconComponent };

// Sections grouped the same way they read on the page, in page order.
// Add an entry to the right group (and give the matching section that same
// `id` and a `scroll-mt-7` class) whenever a new section is added — nothing
// else needs to change for it to show up and auto-highlight here.
const GROUPS: { label: string; sections: SectionLink[] }[] = [
  {
    label: "Overview",
    sections: [
      { id: "technical-documentation", label: "Technical Documentation", icon: InfoIcon },
      { id: "target-limitation", label: "Target Limitation", icon: TargetIcon },
      { id: "feature-justification", label: "Feature Justification", icon: CheckCircleIcon },
    ],
  },
  {
    label: "Data & Model",
    sections: [
      { id: "input-features", label: "Input Features", icon: GridIcon },
      { id: "data-sources", label: "Data Sources", icon: DatabaseIcon },
      { id: "recommendation-engine", label: "Recommendation Engine", icon: CpuIcon },
    ],
  },
  {
    label: "Disclosures",
    sections: [
      { id: "scope-limitations", label: "Scope, Bias & Limitations", icon: WarningIcon },
    ],
  },
];

const ALL_SECTIONS = GROUPS.flatMap((group) => group.sections);

export default function MethodologySidebar() {
  const [activeId, setActiveId] = useState(ALL_SECTIONS[0].id);

  useEffect(() => {
  const handleScroll = () => {
    const scrollPosition = window.scrollY + 150;

    // If we've reached the bottom of the page, force the last section active.
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 5
    ) {
      setActiveId(ALL_SECTIONS[ALL_SECTIONS.length - 1].id);
      return;
    }

    let current = ALL_SECTIONS[0].id;

    for (const section of ALL_SECTIONS) {
      const el = document.getElementById(section.id);
      if (el && el.offsetTop <= scrollPosition) {
        current = section.id;
      }
    }

    setActiveId(current);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  return (
    <nav aria-label="Data & Methodology sections" className="sticky top-7 hidden lg:block w-52 shrink-0">
      <div className="text-[10.5px] uppercase tracking-wider text-faint mb-2 px-2">On this page</div>
      {GROUPS.map((group, i) => (
        <div key={group.label} className={i > 0 ? "mt-4" : undefined}>
          <div className="text-[10px] uppercase tracking-wider text-faint/80 font-medium mb-1 px-2">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeId === section.id;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-sm text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-muted hover:text-ink hover:bg-bg-panel-alt"
                    }`}
                  >
                    <Icon className={isActive ? "text-accent" : "text-faint"} />
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
