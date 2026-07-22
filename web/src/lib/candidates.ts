import { hashSeed, mulberry32, pick, range } from "./rng";
import { SENIORITIES, occupationById, requiredProfile } from "./taxonomy";
import type { Candidate, SeniorityId } from "./types";

const FIRST_INITIALS = "ABCDEFGHIJKLMNOPRSTUVZ".split("");
const LAST_INITIALS = "ABCDEGHIJKLMNOPRSTVZ".split("");
const CANDIDATE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Reference date for this build's demo data — keeps "last verified" dates readable/deterministic.
const DEMO_TODAY = new Date("2026-07-21T00:00:00Z").getTime();

function clamp(v: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, v)));
}

function lowerSeniority(id: SeniorityId): SeniorityId {
  const idx = SENIORITIES.findIndex((s) => s.id === id);
  return SENIORITIES[Math.max(0, idx - 1)].id;
}

/**
 * Deterministically generates a shortlist for any occupation/seniority framework.
 * Candidate index 2 is always an intentional "signal mismatch" case — someone whose
 * CV/application claims match the role, but whose verified task-bank results land a
 * tier below what they applied for. This dramatizes the thesis this whole platform is
 * built on: CVs alone degrade signal, verification recovers it.
 */
export function generateCandidates(occupationId: string, seniorityId: SeniorityId, count = 6): Candidate[] {
  const occupation = occupationById(occupationId);
  const required = requiredProfile(occupationId, seniorityId);

  const candidates: Candidate[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hashSeed(`${occupationId}:${seniorityId}:${i}`);
    const rng = mulberry32(seed);
    const isSignalMismatch = i === 2;
    const base = isSignalMismatch ? requiredProfile(occupationId, lowerSeniority(seniorityId)) : required;

    const verified = occupation.competences.map((_, idx) => {
      let bias: number;
      if (i === 0) bias = range(rng, 0, 10);
      else if (i === 1) bias = range(rng, -6, 6);
      else if (isSignalMismatch) bias = range(rng, -16, -4);
      else bias = range(rng, -18, 4);
      return clamp(base[idx] + bias, 15, 99);
    });

    const avgVerified = verified.reduce((s, v) => s + v, 0) / verified.length;
    const signalMismatch = isSignalMismatch;

    const variance =
      verified.reduce((s, v) => s + (v - avgVerified) ** 2, 0) / verified.length;
    const irtTheta = Math.round(((avgVerified - 70) / 15 + range(rng, -0.15, 0.15)) * 100) / 100;
    const irtSe = Math.round((0.08 + Math.sqrt(variance) / 220 + range(rng, 0, 0.03)) * 100) / 100;

    const daysAgo = Math.floor(range(rng, 1, 45));
    const lastVerifiedIso = new Date(DEMO_TODAY - daysAgo * 86400000).toISOString().slice(0, 10);

    candidates.push({
      id: `${occupationId}-${seniorityId}-c${i}`,
      name: `Kandidat ${CANDIDATE_LABELS[i] ?? i} — ${pick(rng, FIRST_INITIALS)}.${pick(rng, LAST_INITIALS)}.`,
      initials: `${pick(rng, FIRST_INITIALS)}${pick(rng, LAST_INITIALS)}`,
      claimedSeniority: seniorityId,
      verified,
      irtTheta,
      irtSe,
      lastVerifiedIso,
      signalMismatch,
    });
  }

  return candidates;
}
