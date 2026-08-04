"use client";

// Top navigation, shared by every page. Highlights the current route.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Rehabilitation Activities", href: "/rehabilitation-activities" },
  { label: "Model Explainability", href: "/model-explainability" },
  { label: "Data & Methodology", href: "/data-methodology" },
];

export default function NavBar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-3 w-full">
      <nav className="flex justify-between items-center border-b border-line pb-3 mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center rounded-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Image
              src="/aether-logo-green.png"
              alt="AETHER"
              width={1424}
              height={507}
              priority
              className="h-12 w-auto"
            />
          </Link>

          <div className="hidden sm:block h-6 w-px bg-line" aria-hidden="true" />

          <Link
            href="/"
            aria-current={isDashboard ? "page" : undefined}
            className={`hidden sm:block text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm pb-0.5 border-b-2 ${
              isDashboard
                ? "text-ink border-accent"
                : "text-muted border-transparent hover:text-ink hover:border-line"
            }`}
          >
            Dashboard
          </Link>
        </div>

        <div className="flex gap-0.5 bg-bg-panel-alt border border-line rounded-full p-1 shadow-[inset_0_1px_2px_rgba(22,36,30,0.04)] overflow-x-auto max-w-full">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wide whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "bg-accent text-white font-semibold shadow-[0_1px_4px_rgba(22,36,30,0.18)]"
                    : "text-muted hover:text-ink hover:bg-bg-panel/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
