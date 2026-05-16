"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function Prihlaseni() {
  const [tab, setTab]           = useState<"login" | "register">("login");
  const [email, setEmail]       = useState("");
  const [heslo, setHeslo]       = useState("");
  const [jmeno, setJmeno]       = useState("");
  const [stav, setStav]         = useState<"idle" | "loading" | "ok" | "chyba">("idle");
  const [zprava, setZprava]     = useState("");

  const supabase = createClient();

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStav("loading");
    setZprava("");

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: heslo });
      if (error) { setStav("chyba"); setZprava("Špatný e-mail nebo heslo."); }
      else { setStav("ok"); setZprava(""); location.href = "/"; }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: heslo,
        options: { data: { full_name: jmeno } },
      });
      if (error) { setStav("chyba"); setZprava(error.message); }
      else { setStav("ok"); setZprava("Zkontrolujte e-mail a potvrďte registraci."); }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">

          {/* Logo / nadpis */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "#801A28" }}>Grand Padel</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              {tab === "login" ? "Přihlaste se ke svému účtu" : "Vytvořte si účet zdarma"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 mb-6">
            <button onClick={() => setTab("login")}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: tab === "login" ? "#801A28" : "white", color: tab === "login" ? "white" : "#6b7280" }}>
              Přihlášení
            </button>
            <button onClick={() => setTab("register")}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: tab === "register" ? "#801A28" : "white", color: tab === "register" ? "white" : "#6b7280" }}>
              Registrace
            </button>
          </div>

          {/* Google */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 py-3 text-sm font-medium mb-4 hover:bg-zinc-50 transition-colors"
            style={{ color: "#374151" }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Pokračovat přes Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs" style={{ color: "#9ca3af" }}>nebo e-mailem</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Formulář */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === "register" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: "#374151" }}>Jméno a příjmení</label>
                <input type="text" value={jmeno} onChange={e => setJmeno(e.target.value)}
                  placeholder="Jana Nováková" required
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "#374151" }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="jana@example.cz" required
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: "#374151" }}>Heslo</label>
              <input type="password" value={heslo} onChange={e => setHeslo(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#801A28]" />
            </div>

            {zprava && (
              <p className="text-sm text-center" style={{ color: stav === "ok" ? "#16a34a" : "#801A28" }}>{zprava}</p>
            )}

            <button type="submit" disabled={stav === "loading"}
              className="rounded-full py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#801A28" }}>
              {stav === "loading" ? "Moment…" : tab === "login" ? "Přihlásit se" : "Vytvořit účet"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "#9ca3af" }}>
            <Link href="/" className="hover:underline">← Zpět na web</Link>
          </p>
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs" style={{ backgroundColor: "#F2EDE4", color: "#9ca3af" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}
