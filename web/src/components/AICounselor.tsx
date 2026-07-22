"use client";

import { useState } from "react";
import { competenceGaps } from "@/lib/matching";
import type { Competence, TaskBankItem } from "@/lib/types";

interface ChatMessage {
  from: "bot" | "me";
  text: string;
}

interface AICounselorProps {
  roleName: string;
  competences: Competence[];
  required: number[];
  verified: number[];
  tasks: TaskBankItem[];
  readiness: number;
}

function greeting(roleName: string, competences: Competence[], required: number[], verified: number[], readiness: number, tasks: TaskBankItem[]): string {
  const gaps = competenceGaps(required, verified);
  const worst = gaps[0];
  const worstComp = competences[worst.index];
  const suggestedTask = tasks.find((t) => t.competenceId === worstComp.id);

  if (worst.verified === 0) {
    return `Dobrodošli! Vaš profil za "${roleName}" još nema provjerenih rezultata — spremnost je 0%. Predlažem da započnete s "${suggestedTask?.title ?? worstComp.name}" iz banke zadataka.`;
  }
  if (worst.gap <= 5) {
    return `Vaša spremnost za "${roleName}" trenutno je ${readiness}% — vrlo blizu ciljanog profila. Najveći preostali jaz je u "${worstComp.name}" (${worst.gap} bodova).`;
  }
  return `Vidim da vaš rezultat za "${worstComp.name}" zaostaje ${worst.gap} bodova za zahtjevom uloge "${roleName}". Preporučujem zadatak "${suggestedTask?.title ?? worstComp.name}" (~${suggestedTask?.minutes ?? 30} min) — trenutna spremnost: ${readiness}%.`;
}

export function AICounselor({ roleName, competences, required, verified, tasks, readiness }: AICounselorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { from: "bot", text: greeting(roleName, competences, required, verified, readiness, tasks) },
  ]);
  const [draft, setDraft] = useState("");

  function reply(question: string): string {
    const lower = question.toLowerCase();
    const matchedIndex = competences.findIndex((c) => lower.includes(c.name.toLowerCase().split(" ")[0].toLowerCase()));
    if (matchedIndex >= 0) {
      const gap = required[matchedIndex] - verified[matchedIndex];
      if (verified[matchedIndex] === 0) {
        return `"${competences[matchedIndex].name}" još nije testirano u banci zadataka.`;
      }
      if (gap <= 0) {
        return `"${competences[matchedIndex].name}" već zadovoljava zahtjev uloge (${verified[matchedIndex]}% naspram ${required[matchedIndex]}% traženo).`;
      }
      return `"${competences[matchedIndex].name}" zaostaje ${gap} bodova (${verified[matchedIndex]}% naspram ${required[matchedIndex]}% traženo).`;
    }
    if (lower.includes("spreman") || lower.includes("spremn") || lower.includes("posao")) {
      return `Trenutna spremnost za "${roleName}" je ${readiness}%, izračunato vektorskim podudaranjem vašeg provjerenog profila i zahtjeva uloge.`;
    }
    const gaps = competenceGaps(required, verified);
    const worst = competences[gaps[0].index];
    return `Konkretan savjet: usmjerite se na "${worst.name}" — trenutno najveći kompetencijski jaz. Konačna odluka o zapošljavanju uvijek ostaje na poslodavcu i vama.`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "me", text }, { from: "bot", text: reply(text) }]);
    setDraft("");
  }

  return (
    <div className="mt-8 rounded-xl border border-line bg-surface-sunken p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-serif text-base font-bold text-ink">💬 AI karijerni savjetnik</h4>
        <span className="text-xs text-ink-soft">Savjetodavno · human-in-the-loop</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
              m.from === "me"
                ? "ml-auto rounded-br-sm bg-teal text-white"
                : "rounded-bl-sm border border-line bg-surface text-ink"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pitajte o bilo kojoj kompetenciji…"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-teal"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dim"
        >
          Pošalji
        </button>
      </form>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-soft">
        <span>⚠</span>
        <span>
          AI savjetnik ne donosi odluke o zapošljavanju niti pristupa vašim osobnim podacima izvan
          ovog razgovora (GDPR, EU AI Act čl. 6).
        </span>
      </p>
    </div>
  );
}
