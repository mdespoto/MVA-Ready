# PROVJERI — radni prototip

Next.js prototip platforme provjerenih kompetencija: uparivanje tražitelja posla i poslodavaca
na temelju empirijski provjerenih (ne prijavljenih) rezultata iz banke zadataka, mapiranih na
ESCO-nalik taksonomiju.

Ovo je istraživački demo — mock/seed podaci umjesto baze, deterministički generirani kandidati
umjesto pravog LLM/embedding pipelinea. Vidi `src/lib/` za mjesta gdje bi se prava integracija
(baza, embeddings, fino ugođeni LLM) uključila.

## Pokretanje

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

## Struktura

- `/` — landing i odabir uloge
- `/process` — vizualizacija istraživačko-tehničkog procesa (3 faze)
- `/seeker` — profil tražitelja posla: kompetencijski radar, banka zadataka, AI savjetnik
- `/employer` — izvješće za poslodavca: rang lista kandidata, izvješće po kandidatu
- `src/lib/taxonomy.ts` — ESCO-nalika taksonomija (5 zanimanja × 3 razine seniornosti)
- `src/lib/matching.ts` — izračun podudarnosti (vektorsko podudaranje po kompetenciji)
- `src/lib/candidates.ts` — deterministički generator kandidata za poslodavčevu rang listu
