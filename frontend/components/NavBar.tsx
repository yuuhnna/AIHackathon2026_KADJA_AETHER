import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Rehabilitation Activities", href: "/rehabilitation-activities" },
  { label: "Model Explainability", href: "/model-explainability" },
  { label: "Data & Methodology", href: "/data-methodology" },
];

export default function NavBar() {
  return (
    <nav className="flex w-full items-center justify-between border-b border-[#1E2B24] bg-[#0B1410] px-6 py-4">
      {/* Left: Logo + Dashboard */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/aether-logo-green.png"
            alt="AETHER"
            width={1424}
            height={507}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <Link
          href="/dashboard"
          className="flex h-9 items-center justify-center rounded-sm border border-[#2C3D33] bg-[#12201A] px-4 text-xs font-medium uppercase tracking-widest text-[#8FA396] transition-colors hover:border-[#5CFF9D]/40 hover:text-[#E8EDE9]"
        >
          Dashboard
        </Link>
      </div>

      {/* Right: Nav links */}
      <div className="flex items-center gap-7">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs font-medium uppercase tracking-widest text-[#8FA396] transition-colors hover:text-[#FFB454]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}