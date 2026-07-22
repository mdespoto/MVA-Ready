import { Badge, Card } from "@/components/ui";

interface Stage {
  n: string;
  title: string;
  meta: string;
  desc: string;
  tags: { label: string; tone: "teal" | "amber" | "gold" | "coral" }[];
  steps: string[];
}

const STAGES: Stage[] = [
  {
    n: "1",
    title: "Mapiranje taksonomije i formulacija zahtjeva",
    meta: "Faza 1 · Istraživački input",
    desc: "Operacionalizacija doktorskog nalaza o degradaciji signala u prijavama. Pet zanimanja visoke potražnje u hrvatskom digitalnom i administrativnom sektoru rastavlja se na 15 kompetencijskih okvira kroz tri razine seniornosti.",
    tags: [
      { label: "ESCO taksonomija", tone: "teal" },
      { label: "5 zanimanja × 3 razine", tone: "teal" },
      { label: "5–6 dubinskih intervjua", tone: "amber" },
      { label: "Tematsko kodiranje", tone: "amber" },
    ],
    steps: [
      "Odabir 5 zanimanja visoke potražnje (npr. Frontend Developer, Digital Marketing Specialist, Voditelj projekta) uz ESCO šifriranje.",
      "Rastav svakog zanimanja na Junior / Mid / Senior kompetencijski okvir → 15 okvira ukupno.",
      "Strukturirani intervjui s HR direktorima i industrijskim hiring managerima radi validacije tržišne relevantnosti.",
      "Tematsko kodiranje transkripata → usklađivanje ESCO kompetencija sa stvarnim operativnim potrebama poslodavaca.",
      "Izlaz: validirana matrica kompetencija po zanimanju i razini, spremna za fazu izrade zadataka.",
    ],
  },
  {
    n: "2",
    title: "Izrada i validacija banke provjere",
    meta: "Faza 2 · Empirijsko testiranje",
    desc: "Umjesto deklarativnog znanja s CV-a, testira se stvarna funkcionalna sposobnost. Za svaki od 15 okvira dizajniraju se scenariji rješavanja problema i simulacijski zadaci, stupnjevani po tehničkoj težini.",
    tags: [
      { label: "15 banaka zadataka", tone: "teal" },
      { label: "Simulacije i scenariji", tone: "teal" },
      { label: "IRT kalibracija", tone: "amber" },
      { label: "Anti-fraud dizajn", tone: "coral" },
    ],
    steps: [
      "Dizajn problemskih zadataka po okviru, stupnjevanih od Junior do Senior težine.",
      "Pilot testiranje zadataka na uzorku kandidata radi prikupljanja odgovora za kalibraciju.",
      "Item-response theory (IRT) analiza — provjera diskriminativnosti i težine svake stavke.",
      "Uklanjanje ili revizija stavki s niskom pouzdanošću ili sistemskom pristranošću.",
      "Izlaz: kalibrirana banka zadataka koja izolira stvarnu kompetenciju, otporna na „namještanje” CV-a.",
    ],
  },
  {
    n: "3",
    title: "Vektorsko uparivanje i fino ugađanje LLM-a",
    meta: "Faza 3 · Uparivanje i savjetovanje",
    desc: "Profili kandidata i opisi radnih mjesta transformiraju se u visokodimenzionalne vektore. Kosinusna sličnost otkriva točan postotni jaz između provjerene sposobnosti i operativnih zahtjeva uloge — taj jaz hrani AI karijernog savjetnika.",
    tags: [
      { label: "Vektorsko ugrađivanje", tone: "teal" },
      { label: "Kosinusna sličnost", tone: "teal" },
      { label: "Fino ugađanje LLM-a", tone: "gold" },
      { label: "GDPR · EU AI Act", tone: "coral" },
    ],
    steps: [
      "Enkodiranje verificiranih kompetencijskih profila i opisa slobodnih mjesta u zajednički vektorski prostor.",
      "Izračun kosinusne sličnosti → postotak podudarnosti i identifikacija specifičnog jaza po kompetenciji.",
      "Jaz se prosljeđuje LLM savjetniku, fino ugođenom na zatvorenom skupu kurikuluma i aktivnih oglasa.",
      "Savjetnik djeluje isključivo savjetodavno (human-in-the-loop) — ne donosi automatiziranu odluku o zapošljavanju.",
      "Izlaz: uparivanje kandidat↔uloga s objašnjivim jazom, dostupno objema stranama sustava.",
    ],
  },
];

export default function ProcessPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-balance font-serif text-3xl font-bold text-ink sm:text-4xl">
        Istraživačko-tehnički proces
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Tri faze koje povezuju doktorski nalaz o degradaciji signala u CV-ima sa sustavom
        provjerenog uparivanja: od taksonomije zanimanja, preko empirijskih banaka zadataka, do
        vektorskog uparivanja i AI savjetnika.
      </p>

      <div className="relative mt-14 pl-12">
        <div
          className="absolute top-2 bottom-16 left-[17px] w-px"
          style={{ backgroundImage: "linear-gradient(var(--line) 50%, transparent 0)", backgroundSize: "2px 10px", backgroundRepeat: "repeat-y" }}
        />

        {STAGES.map((stage) => (
          <div key={stage.n} className="relative mb-7">
            <div className="absolute -left-12 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-teal bg-surface font-serif text-base font-bold text-teal">
              {stage.n}
            </div>
            <Card className="p-6 sm:p-7">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{stage.meta}</div>
              <h2 className="mt-1 font-serif text-xl font-bold text-ink">{stage.title}</h2>
              <p className="mt-2.5 max-w-2xl text-sm text-ink-soft">{stage.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {stage.tags.map((tag) => (
                  <Badge key={tag.label} tone={tag.tone}>
                    {tag.label}
                  </Badge>
                ))}
              </div>
              <details className="group mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-teal [&::-webkit-details-marker]:hidden">
                  <span aria-hidden className="mr-1.5 inline-block transition-transform group-open:rotate-90">▸</span>
                  Prikaži koračni tijek
                </summary>
                <ul className="mt-3.5 grid gap-2.5">
                  {stage.steps.map((step) => (
                    <li key={step} className="grid grid-cols-[16px_1fr] gap-2.5 text-sm text-ink">
                      <span className="text-ink-soft">—</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </Card>
          </div>
        ))}
      </div>

      <div className="relative -mt-1 ml-0 rounded-2xl border border-dashed border-teal bg-teal-tint p-6 pl-16 sm:ml-0">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-teal">↺</span>
        <h3 className="font-serif text-base font-bold text-teal-dim">Kontinuirana kalibracija</h3>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Ishodi uparivanja i povratne informacije poslodavaca vraćaju se u fazu 1 i 2: taksonomija
          kompetencija i banke zadataka periodički se ažuriraju kako tržište rada evoluira, a IRT
          parametri se prekalibriraju na novim odgovorima.
        </p>
      </div>
    </main>
  );
}
