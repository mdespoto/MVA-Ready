import Link from "next/link";
import { Badge, Card } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-16 max-w-3xl">
        <Badge tone="gold">Istraživački prototip</Badge>
        <h1 className="mt-4 text-balance font-serif text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Uparivanje na temelju provjerenih, ne prijavljenih kompetencija.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-soft">
          PROVJERI zamjenjuje ključne riječi iz CV-a empirijski provjerenim rezultatima iz banke
          zadataka, mapiranim na ESCO taksonomiju i uparenim vektorski — s objašnjivim jazom
          umjesto crne kutije.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/seeker" className="group block">
          <Card className="h-full p-8 transition-transform group-hover:-translate-y-0.5">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">01 · Tražitelj posla</span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-ink">Izgradi provjereni profil</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Riješi zadatke iz banke provjere, prati kompetencijski jaz do ciljane uloge i razgovaraj
              s AI karijernim savjetnikom.
            </p>
            <span className="mt-6 inline-block text-sm font-semibold text-teal">Otvori profil →</span>
          </Card>
        </Link>

        <Link href="/employer" className="group block">
          <Card className="h-full p-8 transition-transform group-hover:-translate-y-0.5">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">02 · Poslodavac</span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-ink">Rangiraj po stvarnoj sposobnosti</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Definiraj potrebnu razinu po kompetenciji i dobij rang-listu kandidata izračunatu
              vektorskim podudaranjem, s IRT pokazateljima pouzdanosti.
            </p>
            <span className="mt-6 inline-block text-sm font-semibold text-teal">Otvori izvješće →</span>
          </Card>
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/process" className="group block">
          <Card className="p-8 transition-transform group-hover:-translate-y-0.5">
            <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">03 · Metodologija</span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-ink">Istraživačko-tehnički proces</h2>
            <p className="mt-3 max-w-2xl text-sm text-ink-soft">
              Tri faze koje povezuju ESCO taksonomiju, IRT-kalibriranu banku zadataka i
              vektorsko uparivanje s fino ugođenim LLM savjetnikom.
            </p>
            <span className="mt-6 inline-block text-sm font-semibold text-teal">Pogledaj proces →</span>
          </Card>
        </Link>
      </div>
    </main>
  );
}
