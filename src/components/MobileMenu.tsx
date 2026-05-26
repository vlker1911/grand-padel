"use client";

import { useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "./Navbar";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Zavřít menu" : "Otevřít menu"}
        className="flex flex-col justify-center items-center w-9 h-9 gap-1.5"
      >
        <span
          className="block w-6 h-0.5 transition-all duration-200"
          style={{
            backgroundColor: "#0A0A0A",
            transform: open ? "translateY(8px) rotate(45deg)" : "none",
          }}
        />
        <span
          className="block w-6 h-0.5 transition-all duration-200"
          style={{
            backgroundColor: "#0A0A0A",
            opacity: open ? 0 : 1,
          }}
        />
        <span
          className="block w-6 h-0.5 transition-all duration-200"
          style={{
            backgroundColor: "#0A0A0A",
            transform: open ? "translateY(-8px) rotate(-45deg)" : "none",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-16 left-0 right-0 border-b border-zinc-100 shadow-lg z-50"
          style={{ backgroundColor: "#fff" }}
        >
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-zinc-50"
                style={{ color: "#0A0A0A" }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/kontakt"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full px-5 py-3 text-sm font-semibold text-white text-center transition-colors"
              style={{ backgroundColor: "#8C1325" }}
            >
              Mám zájem
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
