import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { generateCandidates } from "@/lib/candidates";
import { matchScore } from "@/lib/matching";
import { SENIORITIES, occupationById, requiredProfile } from "@/lib/taxonomy";
import type { SeniorityId } from "@/lib/types";

interface PageProps {
  params: Promise<{ occupationId: string; seniorityId: string; candidateId: string }>;
}

export default async function CandidateReportPage({ params }: PageProps) {
  const { occupationId, seniorityId, candidateId } = await params;
  const seniority = SENIORITIES.find((s) => s.id === seniorityId);
  if (!seniority) notFound();

  let occupation;
  try {
    occupation = occupationById(occupationId);
  } catch {
    notFound();
  }

  const required = requiredProfile(occupationId, seniorityId as SeniorityId);
  const candidates = generateCandidates(occupationId, seniorityId as SeniorityId, 6);
  const candidate = candidates.find((c) => c.id === candidateId);
  if (!candidate) notFound();

  const match = matchScore(required, candidate.verified);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/employer" className="text-sm font-semibold text-teal hover:underline">
        ← Natrag na rang listu
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">{candidate.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Podudarnost {match}% · Uloga: {occupation.name} · {seniority.label} ·{" "}
            <span className="font-mono">{occupation.escoCode}</span>
          </p>
        </div>
        {candidate.signalMismatch ? (
          <Badge tone="coral">⚠ Jaz u seniornosti</Badge>
        ) : match >= 80 ? (
          <Badge tone="green">Preporučeno za intervju</Badge>
        ) : (
          <Badge tone="gold">✓ Provjereno</Badge>
        )}
      </div>

      <Card className="mt-6 p-6 sm:p-7">
        <h2 className="font-serif text-lg font-bold text-ink">Usporedba po kompetenciji</h2>
        <div className="mt-4 grid gap-3">
          {occupation.competences.map((c, i) => {
            const req = required[i];
            const got = candidate.verified[i];
            const short = got < req;
            return (
              <div key={c.id} className="grid grid-cols-1 items-center gap-2.5 text-sm sm:grid-cols-[200px_1fr_46px]">
                <span className="text-ink">{c.name}</span>
                <span className="relative h-2.5 rounded-full bg-surface-sunken">
                  <span
                    className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-ink"
                    style={{ left: `${req}%` }}
                    title={`Zahtjev: ${req}%`}
                  />
                  <span
                    className={`block h-full rounded-full ${short ? "bg-coral" : "bg-teal"}`}
                    style={{ width: `${got}%` }}
                  />
                </span>
                <span className="text-right font-mono tabnum">{got}%</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 border-t border-line pt-4 font-mono text-xs text-ink-soft">
          θ = {candidate.irtTheta.toFixed(2)} · SE(θ) = {candidate.irtSe.toFixed(2)} · zadaci riješeni:{" "}
          {occupation.competences.length}/{occupation.competences.length} · zadnja provjera: {candidate.lastVerifiedIso}
        </div>
      </Card>

      <div className="mt-6 rounded-xl border border-gold/40 bg-gold-tint p-5 text-sm text-ink">
        <strong className="mb-1 block font-serif text-base text-gold">Napomena o sukladnosti</strong>
        Ovo izvješće je alat za podršku odlučivanju (human-in-the-loop) sukladno EU AI Actu — ne
        predstavlja automatiziranu odluku o zapošljavanju. Poslodavac vidi isključivo agregirane
        rezultate provjere, ne sirove odgovore na zadatke.
      </div>
    </main>
  );
}
