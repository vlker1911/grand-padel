"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NavbarAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function odhlasit() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  if (email) {
    return (
      <div className="hidden md:flex items-center gap-3">
        <span className="text-sm text-zinc-500 truncate max-w-[160px]">{email}</span>
        <button onClick={odhlasit}
          className="rounded-full px-5 py-2 text-sm font-semibold border border-zinc-200 hover:bg-zinc-50 transition-colors"
          style={{ color: "#801A28" }}>
          Odhlásit
        </button>
      </div>
    );
  }

  return (
    <Link href="/prihlaseni"
      className="hidden md:inline-flex rounded-full px-5 py-2 text-sm font-semibold transition-colors border border-[#801A28]"
      style={{ color: "#801A28" }}>
      Přihlásit se
    </Link>
  );
}
