import type { Competence, Occupation, Seniority, SeniorityId, TaskBankItem } from "./types";

export const SENIORITIES: Seniority[] = [
  { id: "junior", label: "Junior", baseRequirement: 56 },
  { id: "mid", label: "Mid-level", baseRequirement: 72 },
  { id: "senior", label: "Senior", baseRequirement: 86 },
];

export function senorityById(id: SeniorityId): Seniority {
  const s = SENIORITIES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown seniority: ${id}`);
  return s;
}

function comp(id: string, name: string, escoCode: string): Competence {
  return { id, name, escoCode };
}

export const OCCUPATIONS: Occupation[] = [
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    escoCode: "ESCO 2513.4",
    sector: "Digitalni sektor",
    competences: [
      comp("js-ts", "JavaScript / TypeScript razvoj", "2513.4.1"),
      comp("frameworks", "Frontend okviri (React/Vue)", "2513.4.2"),
      comp("a11y", "Responzivnost i pristupačnost", "2513.4.3"),
      comp("git-cicd", "Git / CI-CD suradnja", "2513.4.4"),
      comp("api", "API integracija", "2513.4.5"),
      comp("problem-solving", "Rješavanje problema pod pritiskom", "2513.4.6"),
    ],
  },
  {
    id: "backend-developer",
    name: "Backend Developer",
    escoCode: "ESCO 2512.7",
    sector: "Digitalni sektor",
    competences: [
      comp("architecture", "Sustavska arhitektura", "2512.7.1"),
      comp("api-design", "API dizajn i sigurnost", "2512.7.2"),
      comp("db", "Optimizacija baza podataka", "2512.7.3"),
      comp("testing", "Testiranje i CI/CD", "2512.7.4"),
      comp("tech-leadership", "Vođenje tehničkih odluka", "2512.7.5"),
      comp("scalability", "Skalabilnost sustava", "2512.7.6"),
    ],
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing Specialist",
    escoCode: "ESCO 2431.9",
    sector: "Digitalni sektor",
    competences: [
      comp("seo-sem", "SEO / SEM optimizacija", "2431.9.1"),
      comp("analytics", "Analitika podataka i KPI", "2431.9.2"),
      comp("content", "Content strategija", "2431.9.3"),
      comp("campaigns", "Upravljanje plaćenim kampanjama", "2431.9.4"),
      comp("automation", "Marketinška automatizacija", "2431.9.5"),
      comp("brand", "Brand komunikacija", "2431.9.6"),
    ],
  },
  {
    id: "project-manager",
    name: "Voditelj/ica projekta",
    escoCode: "ESCO 2421.1",
    sector: "Administrativni sektor",
    competences: [
      comp("planning", "Planiranje i raspored", "2421.1.1"),
      comp("risk", "Upravljanje rizicima", "2421.1.2"),
      comp("budget", "Budžetiranje", "2421.1.3"),
      comp("stakeholders", "Vođenje dionika", "2421.1.4"),
      comp("agile", "Agilne metodologije", "2421.1.5"),
      comp("reporting", "Izvještavanje i kontrola kvalitete", "2421.1.6"),
    ],
  },
  {
    id: "administrative-officer",
    name: "Administrativni referent",
    escoCode: "ESCO 4110.2",
    sector: "Administrativni sektor",
    competences: [
      comp("filing", "Uredsko poslovanje i arhiviranje", "4110.2.1"),
      comp("office-tools", "Rad s uredskim alatima", "4110.2.2"),
      comp("client-comms", "Komunikacija sa strankama", "4110.2.3"),
      comp("regulations", "Poznavanje propisa i procedura", "4110.2.4"),
      comp("records", "Vođenje evidencija", "4110.2.5"),
      comp("scheduling", "Organizacija sastanaka i protokola", "4110.2.6"),
    ],
  },
];

export function occupationById(id: string): Occupation {
  const o = OCCUPATIONS.find((x) => x.id === id);
  if (!o) throw new Error(`Unknown occupation: ${id}`);
  return o;
}

/** Task bank: one empirical simulation task per competence, per occupation. */
export const TASK_BANKS: Record<string, TaskBankItem[]> = {
  "frontend-developer": [
    { competenceId: "js-ts", title: "Refaktoriranje asinkronog modula", description: "Popravi race condition u TypeScript servisu koji dohvaća podatke s tri paralelna izvora.", minutes: 35 },
    { competenceId: "frameworks", title: "Izgradnja komponente s upravljanim stanjem", description: "Implementiraj kontrolirani formu-wizard u Reactu prema zadanoj specifikaciji.", minutes: 40 },
    { competenceId: "a11y", title: "WCAG audit simulacija", description: "Pronađi i ispravi 5 prekršaja pristupačnosti na zadanoj stranici.", minutes: 30 },
    { competenceId: "git-cicd", title: "Razrješavanje merge konflikta", description: "Riješi konflikt u simuliranom pull requestu bez gubitka tuđih promjena.", minutes: 20 },
    { competenceId: "api", title: "Integracija nestabilnog API-ja", description: "Poveži frontend na API koji povremeno vraća greške — implementiraj retry logiku.", minutes: 35 },
    { competenceId: "problem-solving", title: "Debug pod vremenskim ograničenjem", description: "Pronađi uzrok curenja memorije u zadanih 25 minuta.", minutes: 25 },
  ],
  "backend-developer": [
    { competenceId: "architecture", title: "Dizajn modularne arhitekture", description: "Rastavi monolitni servis na module prema zadanim granicama odgovornosti.", minutes: 45 },
    { competenceId: "api-design", title: "Sigurnosni pregled API-ja", description: "Pronađi ranjivosti u autorizacijskom sloju REST API-ja.", minutes: 35 },
    { competenceId: "db", title: "Optimizacija sporog upita", description: "Smanji vrijeme izvršavanja upita s 4s na ispod 200ms.", minutes: 30 },
    { competenceId: "testing", title: "Pisanje integracijskih testova", description: "Pokrij kritični tok narudžbi automatiziranim testovima.", minutes: 40 },
    { competenceId: "tech-leadership", title: "Tehnička odluka pod neizvjesnošću", description: "Opravdaj odabir arhitekture uz ograničene resurse i rok.", minutes: 25 },
    { competenceId: "scalability", title: "Simulacija opterećenja", description: "Predloži strategiju horizontalnog skaliranja za 10x promet.", minutes: 35 },
  ],
};

export function taskBankFor(occupationId: string): TaskBankItem[] {
  return (
    TASK_BANKS[occupationId] ??
    occupationById(occupationId).competences.map((c) => ({
      competenceId: c.id,
      title: `Simulacijski zadatak — ${c.name}`,
      description: "Empirijski zadatak koji testira funkcionalnu sposobnost, ne deklarativno znanje.",
      minutes: 30,
    }))
  );
}

/** Frameworks with hand-tuned required profiles preserved for narrative continuity. */
const REQUIRED_OVERRIDES: Record<string, number[]> = {
  "frontend-developer:mid": [85, 80, 70, 65, 75, 80],
  "backend-developer:senior": [80, 85, 75, 70, 65, 78],
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic required score per competence: seniority baseline + per-competence jitter. */
export function requiredProfile(occupationId: string, seniorityId: SeniorityId): number[] {
  const key = `${occupationId}:${seniorityId}`;
  if (REQUIRED_OVERRIDES[key]) return REQUIRED_OVERRIDES[key];

  const occupation = occupationById(occupationId);
  const seniority = senorityById(seniorityId);
  return occupation.competences.map((c) => {
    const jitter = (hashString(`${occupationId}:${c.id}`) % 15) - 7;
    return Math.min(97, Math.max(40, seniority.baseRequirement + jitter));
  });
}
