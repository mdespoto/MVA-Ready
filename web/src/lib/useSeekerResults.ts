"use client";

import { useCallback, useSyncExternalStore } from "react";

type FrameworkResults = Record<string, number>;
type ResultsStore = Record<string, FrameworkResults>;

const STORAGE_KEY = "provjeri.seekerResults.v1";

// Seeded so the default demo persona (Ivana Kovač, Frontend Developer · Mid) opens
// with a partially-completed verification bank instead of an empty dashboard.
const DEFAULT_RESULTS: ResultsStore = {
  "frontend-developer:mid": {
    "js-ts": 78,
    frameworks: 82,
    a11y: 55,
    "git-cicd": 70,
    api: 60,
    "problem-solving": 65,
  },
};

function frameworkKey(occupationId: string, seniorityId: string): string {
  return `${occupationId}:${seniorityId}`;
}

function readFromLocalStorage(): ResultsStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESULTS;
    return { ...DEFAULT_RESULTS, ...(JSON.parse(raw) as ResultsStore) };
  } catch {
    return DEFAULT_RESULTS;
  }
}

const listeners = new Set<() => void>();
let snapshot: ResultsStore = DEFAULT_RESULTS;

if (typeof window !== "undefined") {
  snapshot = readFromLocalStorage();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot(): ResultsStore {
  return snapshot;
}

function getServerSnapshot(): ResultsStore {
  return DEFAULT_RESULTS;
}

function setSnapshot(updater: (prev: ResultsStore) => ResultsStore) {
  snapshot = updater(snapshot);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota / private-mode errors — demo data, not critical
  }
  listeners.forEach((l) => l());
}

export function useSeekerResults(occupationId: string, seniorityId: string) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const key = frameworkKey(occupationId, seniorityId);
  const scores = store[key] ?? {};

  const scoreFor = (competenceId: string): number | null => scores[competenceId] ?? null;

  /** Simulates completing a task-bank item: produces a plausible new verified score. */
  const completeTask = useCallback(
    (competenceId: string) => {
      setSnapshot((prev) => {
        const framework = prev[key] ?? {};
        const current = framework[competenceId] ?? 35 + Math.random() * 25;
        const improved = Math.min(99, Math.round(current + 8 + Math.random() * 18));
        return {
          ...prev,
          [key]: { ...framework, [competenceId]: improved },
        };
      });
    },
    [key]
  );

  return { scores, scoreFor, completeTask, hydrated: true };
}
