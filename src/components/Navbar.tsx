import Link from "next/link";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import NavbarAuth from "./NavbarAuth";

const NAV_LINKS = [
  { href: "/rezervace", label: "Rezervace" },
  { href: "/hry", label: "Hry 🎾" },
  { href: "/turnaje", label: "Turnaje" },
  { href: "/akademie", label: "Akademie" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/gp-logo-monogram.png"
            alt="Grand Padel logo"
            width={36}
            height={36}
            className="rounded-sm"
          />
          <Image
            src="/gp-logo-full.png"
            alt="Grand Padel"
            width={110}
            height={44}
            className="hidden sm:block rounded-sm"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#801A28] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <NavbarAuth />
        <MobileMenu />
      </div>
    </header>
  );
}

export { NAV_LINKS };
