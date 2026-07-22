export type SeniorityId = "junior" | "mid" | "senior";

export interface Seniority {
  id: SeniorityId;
  label: string;
  baseRequirement: number;
}

export interface Competence {
  id: string;
  name: string;
  escoCode: string;
}

export interface Occupation {
  id: string;
  name: string;
  escoCode: string;
  sector: string;
  competences: Competence[];
}

/** A framework = one occupation at one seniority level (15 total = 5 occupations x 3 levels). */
export interface Framework {
  occupation: Occupation;
  seniority: Seniority;
  /** Required score (0-100) per competence, same order as occupation.competences. */
  required: number[];
}

export interface TaskBankItem {
  competenceId: string;
  title: string;
  description: string;
  minutes: number;
}

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  claimedSeniority: SeniorityId;
  /** Verified score (0-100) per competence, same order as occupation.competences. */
  verified: number[];
  irtTheta: number;
  irtSe: number;
  lastVerifiedIso: string;
  signalMismatch: boolean;
}
