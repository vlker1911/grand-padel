"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidateWebSettings } from "@/lib/get-design";
import type { BrandDesign } from "@/lib/brand";

export async function setActiveDesign(formData: FormData) {
  const raw = formData.get("design");
  const design: BrandDesign = raw === "B" ? "B" : "A";

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni?next=/admin/design");

  // RLS pustí UPDATE jen pro management — zde předem zkontrolujeme pro hezčí chybu.
  const { data: profil } = await supabase
    .from("profily")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profil?.role !== "management") {
    redirect("/");
  }

  const { error } = await supabase
    .from("web_settings")
    .update({
      active_design: design,
      zmenil: user.id,
      zmeneno_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    throw new Error(`Nepodařilo se uložit aktivní design: ${error.message}`);
  }

  revalidateWebSettings();
  revalidatePath("/", "layout");
  redirect("/admin/design?ok=1");
}
