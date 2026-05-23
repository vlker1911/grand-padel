"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NavbarAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function nactiUzivatele(userId: string | undefined, userEmail: string | null) {
      setEmail(userEmail);
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("profily")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      setIsAdmin(data?.role === "management");
    }

    supabase.auth.getUser().then(({ data }) => {
      nactiUzivatele(data.user?.id, data.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      nactiUzivatele(session?.user?.id, session?.user?.email ?? null);
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
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm font-medium hover:text-[#801A28] transition-colors"
            style={{ color: "#801A28" }}
          >
            Admin
          </Link>
        )}
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
