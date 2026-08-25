"""Rule-based BARS scorers for Vještina 1 ("Modeliranje financijskih tablica")
and Vještina 2 ("Analitička interpretacija i komunikacija financijskih nalaza").

This is deliberately NOT the ML classifier described in the Merific
methodology (H1/H2): that model is trained on an expert-labelled corpus
(N≈120-160 documents, Cohen's kappa against expert consensus) that does not
exist yet. This module is the rule-based "Model A (content-only)" baseline
one would need before that corpus-driven model can even be evaluated —
every decision is a named, inspectable rule over `ModelIndicators`, so a
domain expert can check whether the automated level matches their own
reading of the same document (the "reconstructable reasoning" requirement
the methodology places on any automated scorer).

Level thresholds encode the BARS level-1..4 descriptions for Vještina 1
verbatim from the BARS document; see the docstring on each `_check_level_*`
function for the specific sentence(s) it operationalizes.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .indicators import ModelIndicators
from .text_indicators import TextIndicators

LEVEL_NAMES = {
    1: "Razina 1 — Osnovni korisnik",
    2: "Razina 2 — Operativni korisnik",
    3: "Razina 3 — Samostalan analitičar (ciljna razina)",
    4: "Razina 4 — Napredna razina (samostalno modeliranje)",
}


@dataclass
class LevelCheck:
    level: int
    satisfied: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    # optional label -> weight (default 1.0 for any label not listed here).
    # Skill 1's checks never populate this, so its scoring is unchanged
    # (every item implicitly weight 1.0, same plain-ratio math as before).
    # Skill 2 uses it so a more diagnostic signal (per the BARS text) counts
    # for more than a merely-present one, instead of every check being an
    # equal vote.
    weights: dict[str, float] = field(default_factory=dict)

    def _weight(self, label: str) -> float:
        return self.weights.get(label, 1.0)

    @property
    def score(self) -> float:
        satisfied_weight = sum(self._weight(label) for label in self.satisfied)
        total_weight = satisfied_weight + sum(self._weight(label) for label in self.missing)
        return satisfied_weight / total_weight if total_weight else 0.0


@dataclass
class BARSResult:
    skill: str
    level: int
    level_name: str
    checks: dict[int, LevelCheck]
    gap_to_next_level: list[str]


def _check_level_2(m: ModelIndicators) -> LevelCheck:
    """"Model je organiziran na jednom ili eventualno dva radna lista...
    Koristi relativne i apsolutne reference ($A$1) svjesno... Koristi
    uvjetne funkcije (IF, SUMIF) i lookupe (VLOOKUP)."""
    c = LevelCheck(level=2)
    if 1 <= m.structural.n_sheets <= 2:
        c.satisfied.append("model na 1-2 radna lista")
    else:
        c.missing.append("model na 1-2 radna lista")
    if m.formula.uses_absolute_refs:
        c.satisfied.append("koristi apsolutne reference ($A$1)")
    else:
        c.missing.append("koristi apsolutne reference ($A$1)")
    if m.formula.uses_conditional or m.formula.uses_lookup:
        c.satisfied.append("koristi uvjetne funkcije i/ili lookup (IF/SUMIF/VLOOKUP)")
    else:
        c.missing.append("koristi uvjetne funkcije i/ili lookup (IF/SUMIF/VLOOKUP)")
    if m.structural.hardcoded_ratio < 0.6:
        c.satisfied.append("inputi barem djelomično odvojeni od izračuna (hardcoded_ratio < 0.6)")
    else:
        c.missing.append("inputi barem djelomično odvojeni od izračuna (hardcoded_ratio < 0.6)")
    return c


def _check_level_3(m: ModelIndicators) -> LevelCheck:
    """"Gradi 'višelistne', integrirane financijske modele... Promjena jednog
    ulaznog parametra automatski propagira... Koristi dosljedne konvencije:
    boje za razlikovanje... imenovane raspone ili strukturirane tablice...
    Sposoban je izgraditi osnovnu scenarijansku analizu."""
    c = LevelCheck(level=3)
    if m.structural.n_sheets >= 3:
        c.satisfied.append("višelistni model (>= 3 radna lista)")
    else:
        c.missing.append("višelistni model (>= 3 radna lista)")
    if m.structural.has_input_sheet and (m.structural.has_calc_sheet or m.structural.has_output_sheet):
        c.satisfied.append("odvojeni listovi za pretpostavke i izračune/izvještaj")
    else:
        c.missing.append("odvojeni listovi za pretpostavke i izračune/izvještaj")
    if m.structural.cross_sheet_ref_count > 0:
        c.satisfied.append("formule povezuju listove (cross-sheet reference)")
    else:
        c.missing.append("formule povezuju listove (cross-sheet reference)")
    if m.structural.n_named_ranges > 0 or m.structural.n_structured_tables > 0:
        c.satisfied.append("imenovani rasponi ili strukturirane tablice umjesto 'magičnih' referenci")
    else:
        c.missing.append("imenovani rasponi ili strukturirane tablice umjesto 'magičnih' referenci")
    if m.structural.color_convention_score >= 0.5:
        c.satisfied.append("dosljedna konvencija boja za inpute vs. formule")
    else:
        c.missing.append("dosljedna konvencija boja za inpute vs. formule")
    if m.structural.hardcoded_ratio < 0.2:
        c.satisfied.append("nizak udio hardkodiranih vrijednosti u izračunima (< 0.2)")
    else:
        c.missing.append("nizak udio hardkodiranih vrijednosti u izračunima (< 0.2)")
    if m.formula.pattern_consistency >= 0.6:
        c.satisfied.append("dosljedna propagacija formula (kopirane/ispunjene, ne ad hoc)")
    else:
        c.missing.append("dosljedna propagacija formula (kopirane/ispunjene, ne ad hoc)")
    if m.structural.has_scenario_selector:
        c.satisfied.append("scenarijski selektor (data validation ćelija) prisutan")
    # scenario selector is a bonus signal per the text ("sposoban je izgraditi"),
    # not a mandatory anchor — omitted from `missing` on purpose.
    return c


def _check_level_4(m: ModelIndicators) -> LevelCheck:
    """"Dizajnira modularne, skalabilne modele... jasno odvojen modul za
    inpute/pretpostavke, modul za izračune i modul za outpute/izvještaje...
    Power Query... dinamičke raspone... LAMBDA funkcije... ili VBA/skripte...
    Dokumentacija modela... sastavni je dio datoteke."""
    c = LevelCheck(level=4)
    modular = m.structural.has_input_sheet and m.structural.has_calc_sheet and m.structural.has_output_sheet
    if modular:
        c.satisfied.append("modularna arhitektura: odvojeni input/calc/output moduli")
    else:
        c.missing.append("modularna arhitektura: odvojeni input/calc/output moduli")
    if m.formula.has_power_query:
        c.satisfied.append("Power Query prisutan")
    else:
        c.missing.append("Power Query prisutan")
    if m.formula.uses_lambda_or_dynamic:
        c.satisfied.append("LAMBDA / dinamičke funkcije (LET, FILTER, SEQUENCE...) prisutne")
    else:
        c.missing.append("LAMBDA / dinamičke funkcije prisutne")
    if m.formula.has_vba:
        c.satisfied.append("VBA/makro automatizacija prisutna")
    else:
        c.missing.append("VBA/makro automatizacija prisutna")
    if m.structural.has_readme_sheet:
        c.satisfied.append("dokumentacijski list (README/upute) prisutan")
    else:
        c.missing.append("dokumentacijski list (README/upute) prisutan")
    return c


# minimum satisfied/total ratio required to be *awarded* a level, once its
# prerequisite level is also met (cascading: 4 requires 3, 3 requires 2).
_PASS_THRESHOLD = {2: 0.6, 3: 0.55, 4: 0.6}


def score_skill1(m: ModelIndicators) -> BARSResult:
    checks = {
        2: _check_level_2(m),
        3: _check_level_3(m),
        4: _check_level_4(m),
    }

    level = 1
    if checks[2].score >= _PASS_THRESHOLD[2]:
        level = 2
        if checks[3].score >= _PASS_THRESHOLD[3]:
            level = 3
            if checks[4].score >= _PASS_THRESHOLD[4]:
                level = 4

    next_level = level + 1
    gap = list(checks[next_level].missing) if next_level in checks else []

    return BARSResult(
        skill="Vještina 1: Modeliranje financijskih tablica",
        level=level,
        level_name=LEVEL_NAMES[level],
        checks=checks,
        gap_to_next_level=gap,
    )


# ============================================================================
# Vještina 2 — Analitička interpretacija i komunikacija financijskih nalaza
# ============================================================================

SKILL2_LEVEL_NAMES = {
    1: "Razina 1 — Opisni izvjestitelj",
    2: "Razina 2 — Kontekstualni analitičar",
    3: "Razina 3 — Samostalan analitičar (ciljna razina)",
    4: "Razina 4 — Napredni analitičar / strateški savjetnik",
}


def _check_skill2_level_2(t: TextIndicators) -> LevelCheck:
    """"Uspoređuje rezultate s relevantnim benchmarkom... i identificira
    odstupanja. Objašnjava uzroke poznatih odstupanja na razini direktno
    opažljivih faktora."""
    c = LevelCheck(level=2)
    label_benchmark = "usporedba s benchmarkom (plan, prošla godina, prosjek)"
    label_causal = "objašnjava uzrok odstupanja"
    label_quant = "kvantificirani podaci (>= 2 broja/postotka)"
    label_vocab = "domenski financijski vokabular (>= 2 pojma)"
    (c.satisfied if t.has_benchmark_language else c.missing).append(label_benchmark)
    (c.satisfied if t.has_causal_language else c.missing).append(label_causal)
    (c.satisfied if t.n_numeric_tokens >= 2 else c.missing).append(label_quant)
    (c.satisfied if t.n_distinct_finance_terms >= 2 else c.missing).append(label_vocab)
    # causal explanation is the actual level-1-vs-2 differentiator per the BARS
    # text (see the mandatory gate in score_skill2 below); weight it above the
    # other three, which a level-1 text can satisfy on their own.
    c.weights = {label_causal: 1.5, label_benchmark: 1.0, label_quant: 0.7, label_vocab: 0.7}
    return c


def _check_skill2_level_3(t: TextIndicators) -> LevelCheck:
    """"Strukturira analitički narativ koji vodi... do zaključka i
    preporuke. Jasno razlikuje simptom od uzroka... kvantificira
    implikaciju za ključne financijske metrike. Prezentira scenarije...
    Zaključci su specifični i akcijski orijentirani."""
    c = LevelCheck(level=3)
    label_structure = "struktura: ključna poruka / sažetak / zaključak / preporuka"
    label_recommend = "akcijski orijentirana preporuka"
    label_scenario = "scenarijska analiza / eksplicitna neizvjesnost"
    label_concl_num = "kvantificirana implikacija u istom odlomku kao zaključak/preporuka"
    label_contrast = "eksplicitno razlikuje simptom od uzroka"
    label_vocab_dense = "veća gustoća financijskog vokabulara (>= 4 pojma)"
    label_quant_impact = "eksplicitno kvantificiran financijski učinak (broj uz EBITDA/maržu/prihod...)"
    (c.satisfied if t.has_structure_markers else c.missing).append(label_structure)
    (c.satisfied if t.has_recommendation_language else c.missing).append(label_recommend)
    (c.satisfied if t.has_scenario_language else c.missing).append(label_scenario)
    (c.satisfied if t.conclusion_paragraph_has_number else c.missing).append(label_concl_num)
    (c.satisfied if t.has_contrast_pattern else c.missing).append(label_contrast)
    (c.satisfied if t.n_distinct_finance_terms >= 4 else c.missing).append(label_vocab_dense)
    (c.satisfied if t.has_quantified_financial_impact else c.missing).append(label_quant_impact)
    # distinguishing symptom from cause is literally what the BARS text names
    # as this level's defining behaviour ("Jasno razlikuje simptom od uzroka");
    # structure and an actionable recommendation are close behind. Vocabulary
    # density alone is the weakest signal here (level 2 already requires some).
    c.weights = {
        label_contrast: 1.5,
        label_structure: 1.2,
        label_recommend: 1.2,
        label_scenario: 1.0,
        label_concl_num: 1.0,
        label_quant_impact: 1.0,
        label_vocab_dense: 0.6,
    }
    return c


def _check_skill2_level_4(t: TextIndicators) -> LevelCheck:
    """"Dizajnira analizu koja testira [ključne] pretpostavke... na kojim
    razinama... preporuka mijenja predznak. Komunicira s različitim
    publikama... Sposobna je prepoznati kada podaci nisu dovoljno
    kvalitetni... i jasno komunicirati tu neizvjesnost."""
    c = LevelCheck(level=4)
    label_sensitivity = "osjetljivosna analiza / prag na kojem se zaključak mijenja"
    label_audience = "komunikacija prilagođena >= 2 različite publike (uprava/CFO/investitori/operativni tim)"
    label_data_quality = "eksplicitno priznaje ograničenja kvalitete podataka"
    label_context = "integrira strateški/operativni/tržišni kontekst uz financijsku analizu"
    (c.satisfied if t.has_sensitivity_language else c.missing).append(label_sensitivity)
    (c.satisfied if t.n_distinct_audience_keywords >= 2 else c.missing).append(label_audience)
    (c.satisfied if t.has_data_quality_language else c.missing).append(label_data_quality)
    (c.satisfied if t.has_strategic_context_language else c.missing).append(label_context)
    # sensitivity analysis and naming data-quality limitations are the two
    # behaviours the BARS text calls out explicitly for level 4; audience
    # adaptation and context integration are supporting signals.
    c.weights = {label_sensitivity: 1.3, label_data_quality: 1.2, label_audience: 1.0, label_context: 1.0}
    return c


_SKILL2_LEVEL2_RATIO = 0.5


def score_skill2(t: TextIndicators) -> BARSResult:
    checks = {
        2: _check_skill2_level_2(t),
        3: _check_skill2_level_3(t),
        4: _check_skill2_level_4(t),
    }

    # Level 2 needs an explicit *mandatory* gate on top of the usual ratio:
    # quantification and domain vocabulary are satisfied by the BARS
    # document's own Level-1 example ("troškovi su bili viši nego prethodne
    # godine" already has numbers, "trošak", and even an implicit
    # year-over-year comparison) — the actual level-1-vs-2 differentiator
    # per the rubric is that Level 2 *explains the cause* of a deviation,
    # not merely quantifies or mentions a prior period. Without this gate,
    # any text with a couple of numbers and two finance words would clear
    # the ratio threshold on quantification + vocabulary alone.
    level = 1
    if t.has_causal_language and checks[2].score >= _SKILL2_LEVEL2_RATIO:
        level = 2
        if checks[3].score >= _PASS_THRESHOLD[3]:
            level = 3
            if checks[4].score >= _PASS_THRESHOLD[4]:
                level = 4

    next_level = level + 1
    gap = list(checks[next_level].missing) if next_level in checks else []

    return BARSResult(
        skill="Vještina 2: Analitička interpretacija i komunikacija financijskih nalaza",
        level=level,
        level_name=SKILL2_LEVEL_NAMES[level],
        checks=checks,
        gap_to_next_level=gap,
    )
