# Moj Trener – aplikacija za fitness trenere

Web aplikacija za jednostavno vođenje evidencije klijenata: tjedni raspored treninga,
dolasci/otkazivanja, uplate (paketi dolazaka) i rezultati (mjere, prehrana) — sve na
klik, bez bilježnice i Excela.

## Kako radi

- **Tjedni pregled** (naslovna stranica) prikazuje sve termine za tekući tjedan, generirane
  iz tjednog rasporeda svakog klijenta. Za svaki termin jednim klikom označite:
  Odrađano / Otkazano na vrijeme / Otkazano kasno / Nije se pojavio/la.
  - "Otkazano na vrijeme" **ne** ide na paket dolazaka.
  - Odrađano, otkazano kasno i izostanak **idu** na paket (klijent je "potrošio" termin).
- **Klijenti** — popis klijenata s brzim uvidom u broj preostalih dolazaka. Klik na
  klijenta otvara detalje s karticama:
  - **Raspored** — tjedni termini koji se ponavljaju svaki tjedan.
  - **Evidencija dolazaka** — povijest svih termina i njihovog statusa.
  - **Uplate** — evidencija uplata (iznos + broj dolazaka u paketu); aplikacija sama
    računa koliko je dolazaka preostalo i upozorava kad je vrijeme za novu uplatu.
  - **Rezultati** — mjere tijela kroz vrijeme (težina, opseg struka, % masti...) i
    napomene o prehrani.
- Upozorenje na naslovnoj stranici pokazuje klijente kojima ističe paket dolazaka.

## Podaci

Svi podaci se spremaju lokalno u pregledniku (IndexedDB) — nema potrebe za serverom
ili internetskom vezom nakon prvog učitavanja. Podaci ostaju na uređaju na kojem se
aplikacija koristi.

## Pokretanje

```bash
npm install
npm run dev      # razvojni server
npm run build    # produkcijska verzija (dist/), spremna za hosting na bilo kojem statičkom hostingu
```

## Tehnologije

React + TypeScript + Vite, Dexie.js (IndexedDB), react-router-dom, date-fns.
