"use client";

import { useState } from "react";
import { AICounselor } from "@/components/AICounselor";
import { Radar } from "@/components/Radar";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { competenceGaps, matchScore } from "@/lib/matching";
import { OCCUPATIONS, SENIORITIES, occupationById, requiredProfile, taskBankFor } from "@/lib/taxonomy";
import type { SeniorityId } from "@/lib/types";
import { useSeekerResults } from "@/lib/useSeekerResults";

export default function SeekerPage() {
  const [occupationId, setOccupationId] = useState("frontend-developer");
  const [seniorityId, setSeniorityId] = useState<SeniorityId>("mid");
  const [justSolved, setJustSolved] = useState<string | null>(null);

  const occupation = occupationById(occupationId);
  const competences = occupation.competences;
  const required = requiredProfile(occupationId, seniorityId);
  const tasks = taskBankFor(occupationId);

  const { scoreFor, completeTask, hydrated } = useSeekerResults(occupationId, seniorityId);
  const verified = competences.map((c) => scoreFor(c.id) ?? 0);
  const testedCount = competences.filter((c) => scoreFor(c.id) !== null).length;
  const readiness = hydrated ? matchScore(required, verified) : 0;
  const gaps = competenceGaps(required, verified);

  function handleSolve(competenceId: string) {
    completeTask(competenceId);
    setJustSolved(competenceId);
    window.setTimeout(() => setJustSolved(null), 2200);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-3xl font-bold text-ink">Mockup — profil tražitelja posla</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Provjerene kompetencije nasuprot ciljanoj ulozi, status banke zadataka i AI karijerni
        savjetnik.
      </p>

      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-sunken px-6 py-3.5">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal font-serif text-xs text-white">
              IK
            </span>
            <span>Ivana Kovač</span>
          </div>
          <Badge tone="gold">✓ Identitet provjeren</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr]">
          <aside className="border-b border-line p-6 md:border-b-0 md:border-r">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal-tint font-serif text-2xl text-teal">
              IK
            </div>
            <h3 className="font-serif text-lg font-bold text-ink">Ivana Kovač</h3>

            <div className="mt-3 space-y-2.5 text-sm">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-ink-soft">Ciljano zanimanje</span>
                <select
                  value={occupationId}
                  onChange={(e) => setOccupationId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-ink outline-none focus:border-teal"
                >
                  {OCCUPATIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wide text-ink-soft">Razina</span>
                <select
                  value={seniorityId}
                  onChange={(e) => setSeniorityId(e.target.value as SeniorityId)}
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-ink outline-none focus:border-teal"
                >
                  {SENIORITIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="my-4 border-y border-line py-3.5">
              <div className="font-serif text-3xl text-teal tabnum">{readiness}%</div>
              <div className="text-xs uppercase tracking-wide text-ink-soft">
                Spremnost za ulogu (vektorsko podudaranje)
              </div>
            </div>

            <ul className="grid gap-0.5 text-sm">
              <li className="rounded-lg bg-teal-tint px-2.5 py-2 font-semibold text-teal-dim">Kompetencijski profil</li>
              <li className="px-2.5 py-2 text-ink-soft">Banka zadataka</li>
              <li className="px-2.5 py-2 text-ink-soft">Povijest testiranja</li>
              <li className="px-2.5 py-2 text-ink-soft">AI savjetnik</li>
              <li className="px-2.5 py-2 text-ink-soft">Postavke privatnosti</li>
            </ul>
          </aside>

          <div className="p-6 sm:p-7">
            <div className="mb-8 grid grid-cols-1 items-center gap-7 sm:grid-cols-[260px_1fr]">
              <Radar
                labels={competences.map((c) => c.name)}
                series={[
                  { values: required, stroke: "var(--ink-soft)", fill: "var(--ink-soft)", fillOpacity: 0.06 },
                  { values: verified, stroke: "var(--teal)", fill: "var(--teal)", fillOpacity: 0.18 },
                ]}
              />
              <div>
                <h4 className="font-serif text-lg font-bold text-ink">Kompetencijski jaz</h4>
                <p className="mt-1.5 max-w-md text-sm text-ink-soft">
                  Usporedba zahtjeva uloge <em>{occupation.name} · {SENIORITIES.find((s) => s.id === seniorityId)?.label}</em>{" "}
                  ({occupation.escoCode}) i vaših provjerenih rezultata iz banke zadataka.
                </p>
                <div className="mt-2.5 flex gap-4 text-sm text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink-soft" /> Zahtijevano
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal" /> Provjereno
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-serif text-base font-bold text-ink">
                Kompetencije · {occupation.escoCode} {occupation.name}
              </h4>
              <span className="text-xs text-ink-soft">
                {testedCount} od {competences.length} testirano
              </span>
            </div>

            <ul className="grid gap-2.5">
              {competences.map((c, i) => {
                const score = scoreFor(c.id);
                const gap = gaps.find((g) => g.index === i)!;
                const status = score === null ? "pending" : gap.gap > 5 ? "gap" : "ok";
                const task = tasks.find((t) => t.competenceId === c.id);
                return (
                  <li
                    key={c.id}
                    className="grid grid-cols-1 items-center gap-3 rounded-xl border border-line bg-surface p-3.5 sm:grid-cols-[1fr_auto_130px]"
                  >
                    <div>
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <div className="font-mono text-xs text-ink-soft">{c.escoCode}</div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {status === "pending" ? (
                        <button
                          onClick={() => handleSolve(c.id)}
                          className="rounded-full bg-amber-tint px-3 py-1 text-xs font-semibold text-amber hover:bg-amber hover:text-white"
                        >
                          Riješi zadatak{task ? ` (${task.minutes} min)` : ""}
                        </button>
                      ) : (
                        <>
                          <span className="font-mono text-sm tabnum text-ink">{score}%</span>
                          <button
                            onClick={() => handleSolve(c.id)}
                            className="text-xs font-semibold text-teal hover:underline"
                          >
                            Ponovi
                          </button>
                        </>
                      )}
                      {justSolved === c.id && <Badge tone="green">Novi rezultat: {score}%</Badge>}
                    </div>
                    <ProgressBar value={score ?? 0} tone={status === "gap" ? "coral" : "teal"} />
                  </li>
                );
              })}
            </ul>

            <AICounselor
              key={`${occupationId}-${seniorityId}`}
              roleName={`${occupation.name} · ${SENIORITIES.find((s) => s.id === seniorityId)?.label}`}
              competences={competences}
              required={required}
              verified={verified}
              tasks={tasks}
              readiness={readiness}
            />
          </div>
        </div>
      </Card>
    </main>
  );
}
