import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AdminHome() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 px-4 py-12" style={{ backgroundColor: "#F2EDE4" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#0A0A0A" }}>Admin</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
            Interní nástroje Grand Padel
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/prezentace"
              className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold mb-1" style={{ color: "#8C1325" }}>
                Prezentace pro partnery
              </h2>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Generování personalizovaných prezentací přes AI
              </p>
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-4 px-4 text-center text-xs" style={{ backgroundColor: "#F2EDE4", color: "#9ca3af" }}>
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </footer>
    </div>
  );
}
