import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { jmeno, telefon, email, predmet, zprava } = await req.json();

  if (!email || !zprava) {
    return NextResponse.json({ error: "Vyplňte email a zprávu." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Grand Padel web <onboarding@resend.dev>",
    to: "info@grandpadel.cz",
    replyTo: email,
    subject: predmet || `Nová zpráva od ${jmeno || email}`,
    text: `Jméno: ${jmeno || "–"}
Telefon: ${telefon || "–"}
Email: ${email}

${zprava}`,
  });

  if (error) {
    return NextResponse.json({ error: "Odeslání se nezdařilo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
