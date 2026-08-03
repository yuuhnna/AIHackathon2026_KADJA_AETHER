"use client";

import { useEffect, useState } from "react";
import { DatabaseIcon, WarningIcon, GridIcon } from "@/components/icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

// One entry per section on the Data & Methodology page, in page order.
// Add an entry here (and give the matching section that same `id` and a
// `scroll-mt-7` class) whenever a new section is added to the page —
// nothing else needs to change for it to show up and auto-highlight here.
const SECTIONS: { id: string; label: string; icon: IconComponent }[] = [
  { id: "technical-documentation", label: "Technical Documentation", icon: DatabaseIcon },
  { id: "target-limitation", label: "Target Limitation", icon: WarningIcon },
  { id: "feature-justification", label: "Feature Justification", icon: GridIcon },
];

export default function MethodologySidebar() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Data & Methodology sections" className="sticky top-7 hidden lg:block w-52 shrink-0">
      <div className="text-[10.5px] uppercase tracking-wider text-faint mb-2 px-2">On this page</div>
      <ul className="space-y-0.5">
        {SECTIONS.map((section) => {
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
    </nav>
  );
}
