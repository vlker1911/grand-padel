import Image from "next/image";

interface PageHeroProps {
  badge?: string;
  title: string;
  subtitle?: string;
  photo?: string;
  photoAlt?: string;
}

export default function PageHero({ badge, title, subtitle, photo, photoAlt }: PageHeroProps) {
  return (
    <section className="relative py-20 px-4 text-center text-white overflow-hidden" style={{ backgroundColor: "#801A28" }}>
      {photo && (
        <Image
          src={photo}
          alt={photoAlt ?? title}
          fill
          className="object-cover opacity-20"
          priority
        />
      )}
      <div className="relative z-10 max-w-3xl mx-auto">
        {badge && (
          <span
            className="inline-block rounded-full px-4 py-1 text-sm font-medium mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            {badge}
          </span>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">{title}</h1>
        {subtitle && (
          <p className="text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
