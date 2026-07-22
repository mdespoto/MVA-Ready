"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { generateCandidates } from "@/lib/candidates";
import { matchScore } from "@/lib/matching";
import { OCCUPATIONS, SENIORITIES, occupationById, requiredProfile } from "@/lib/taxonomy";
import type { SeniorityId } from "@/lib/types";

export default function EmployerPage() {
  const [occupationId, setOccupationId] = useState("backend-developer");
  const [seniorityId, setSeniorityId] = useState<SeniorityId>("senior");

  const occupation = occupationById(occupationId);
  const seniority = SENIORITIES.find((s) => s.id === seniorityId)!;
  const required = requiredProfile(occupationId, seniorityId);

  const ranked = useMemo(() => {
    return generateCandidates(occupationId, seniorityId, 6)
      .map((c) => ({ candidate: c, match: matchScore(required, c.verified) }))
      .sort((a, b) => b.match - a.match);
  }, [occupationId, seniorityId, required]);

  const avgSe = ranked.reduce((s, r) => s + r.candidate.irtSe, 0) / ranked.length;
  const above70 = ranked.filter((r) => r.match >= 70).length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-ink">Mockup — izvješće za poslodavca</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Rangirana lista kandidata prema vektorskom uparivanju, s objašnjivim jazom po kompetenciji i
        pokazateljima pouzdanosti testa.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={occupationId}
                onChange={(e) => setOccupationId(e.target.value)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 font-serif text-lg font-bold text-ink outline-none focus:border-teal"
              >
                {OCCUPATIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <span className="font-serif text-lg text-ink-soft">·</span>
              <select
                value={seniorityId}
                onChange={(e) => setSeniorityId(e.target.value as SeniorityId)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 font-serif text-lg font-bold text-ink outline-none focus:border-teal"
              >
                {SENIORITIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-1.5 text-sm text-ink-soft">
              Tvrtka: <strong className="text-ink">Nordis Tech d.o.o.</strong> · Sektor: {occupation.sector} ·{" "}
              <span className="font-mono">{occupation.escoCode}</span>
            </div>
          </div>
          <Badge tone="teal">Oglas aktivan · 12 dana</Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Kpi num={ranked.length} label="Prijavljenih kandidata" />
          <Kpi num={above70} label="Iznad 70% podudarnosti" />
          <Kpi num="100%" label="Vektorski provjereno" />
          <Kpi num={avgSe.toFixed(2)} label="Prosj. IRT standardna greška" />
        </div>

        <div className="mt-8 mb-3 flex items-baseline justify-between">
          <h4 className="font-serif text-base font-bold text-ink">Rang lista kandidata</h4>
          <span className="text-xs text-ink-soft">Sortirano po podudarnosti</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="pb-2.5 pr-3">Kandidat</th>
                <th className="pb-2.5 pr-3">Prijavljena razina</th>
                <th className="pb-2.5 pr-3">Podudarnost</th>
                <th className="pb-2.5 pr-3">Status</th>
                <th className="pb-2.5" />
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ candidate, match }) => (
                <tr key={candidate.id} className="border-b border-line hover:bg-surface-sunken">
                  <td className="py-3.5 pr-3 font-bold">{candidate.name}</td>
                  <td className="py-3.5 pr-3">{seniority.label}</td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 text-right font-mono tabnum">{match}%</span>
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-sunken">
                        <span className="block h-full rounded-full bg-teal" style={{ width: `${match}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-3">
                    {candidate.signalMismatch ? (
                      <Badge tone="coral">⚠ Jaz u seniornosti</Badge>
                    ) : (
                      <Badge tone="gold">✓ Provjereno</Badge>
                    )}
                  </td>
                  <td className="py-3.5">
                    <Link
                      href={`/employer/${occupationId}/${seniorityId}/${candidate.id}`}
                      className="text-xs font-semibold text-teal hover:underline"
                    >
                      Prikaži izvješće →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-xl border border-gold/40 bg-gold-tint p-5 text-sm text-ink">
          <strong className="mb-1 block font-serif text-base text-gold">Napomena o sukladnosti</strong>
          Ovo izvješće je alat za podršku odlučivanju (human-in-the-loop) sukladno EU AI Actu — ne
          predstavlja automatiziranu odluku o zapošljavanju. Podaci o kompetencijama obrađuju se uz
          eksplicitnu privolu kandidata i minimizaciju podataka prema GDPR-u; poslodavac vidi
          isključivo agregirane rezultate provjere, ne sirove odgovore na zadatke.
        </div>
      </Card>
    </main>
  );
}

function Kpi({ num, label }: { num: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="font-serif text-2xl tabnum text-teal">{num}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  );
}
