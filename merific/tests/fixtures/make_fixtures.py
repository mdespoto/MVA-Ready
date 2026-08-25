"""Generates synthetic .xlsx fixtures illustrating each BARS level for
Vještina 1, modeled on the "Tipični bihevioralni primjeri" in the BARS
document. Run: python make_fixtures.py (writes into this directory).
"""

from __future__ import annotations

import os

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__))
BLUE = Font(color="FF0000FF")
BLACK = Font(color="FF000000")
GREEN = Font(color="FF008000")


def level1() -> Workbook:
    """"Tablica prihoda s fiksno upisanim brojevima... Model koji se
    raspada čim se promijeni jedna pretpostavka." Single sheet, every
    number hand-typed, no formulas referencing a parameter cell."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Plan"
    months = ["Sij", "Velj", "Ozu", "Tra", "Svi", "Lip"]
    ws.append(["Mjesec"] + months)
    ws.append(["Prihod", 1000, 1050, 1100, 1180, 1200, 1260])
    ws.append(["Trosak", 700, 705, 710, 720, 730, 740])
    ws.append(["Dobit", 300, 345, 390, 460, 470, 520])  # hand-typed, not =B2-B3
    return wb


def level2() -> Workbook:
    """"Plan troškova s jasno odvojenom tablicom parametara na vrhu lista...
    VLOOKUP koji izvlači cijene iz cjenika." One sheet with a parameter
    block, relative/absolute refs, IF/VLOOKUP."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Troskovi"
    ws["A1"] = "Parametri"
    ws["A2"], ws["B2"] = "Stopa rasta", 0.05
    ws["A3"], ws["B3"] = "PDV", 0.25

    ws["A5"] = "Sifra"
    ws["B5"] = "Cijena bez PDV"
    ws["C5"] = "Cijena s PDV"
    prices = [("P1", 100), ("P2", 200), ("P3", 150)]
    for i, (code, price) in enumerate(prices, start=6):
        ws[f"A{i}"] = code
        ws[f"B{i}"] = price
        ws[f"C{i}"] = f"=B{i}*(1+$B$3)"

    ws["A10"] = "Stavka"
    ws["B10"] = "Sifra"
    ws["C10"] = "Iznos"
    ws["A11"] = "Racun 1"
    ws["B11"] = "P2"
    ws["C11"] = "=VLOOKUP(B11,A6:C8,3,FALSE)"
    ws["A12"] = "Racun 2"
    ws["B12"] = "P1"
    ws["C12"] = '=IF(VLOOKUP(B12,A6:C8,3,FALSE)>150,"skupo","jeftino")'
    return wb


def level3() -> Workbook:
    """"Trogodišnji financijski plan s odvojenim listovima za pretpostavke,
    P&L, cash-flow i sažetak... Model u kojemu su svi inputi obojeni plavom
    bojom, formule crnom... Scenarijska analiza... IF/INDEX." Multi-sheet,
    named range, consistent color convention, cross-sheet formulas, a
    scenario selector, and copied (not one-off) formulas."""
    wb = Workbook()
    assump = wb.active
    assump.title = "Pretpostavke"

    assump["A1"] = "Scenarij (1=Base,2=Best,3=Worst)"
    assump["B1"] = 1
    assump["B1"].font = BLUE
    dv = DataValidation(type="list", formula1='"1,2,3"', allow_blank=False)
    assump.add_data_validation(dv)
    dv.add(assump["B1"])

    assump["A3"] = "Stopa rasta prihoda"
    for col, val in zip("BCD", (0.03, 0.08, -0.02)):
        assump[f"{col}3"] = val
        assump[f"{col}3"].font = BLUE
    assump["E3"] = "=INDEX(B3:D3,1,$B$1)"
    assump["E3"].font = BLACK

    wb.defined_names["StopaRasta"] = DefinedName("StopaRasta", attr_text="Pretpostavke!$E$3")

    pl = wb.create_sheet("P&L")
    pl["A1"] = "Mjesec"
    pl["B1"] = "Prihod"
    pl["C1"] = "Trosak"
    pl["D1"] = "Dobit"
    prev_revenue = 1000
    row = 2
    for i in range(1, 13):
        pl[f"A{row}"] = i
        if i == 1:
            pl[f"B{row}"] = prev_revenue
        else:
            pl[f"B{row}"] = f"=B{row-1}*(1+Pretpostavke!$E$3)"
        pl[f"C{row}"] = f"=B{row}*0.6"
        pl[f"D{row}"] = f"=B{row}-C{row}"
        for col in "BCD":
            pl[f"{col}{row}"].font = BLACK
        row += 1
    pl["B2"].font = BLUE  # the one hardcoded seed value, colour-coded as an input

    cashflow = wb.create_sheet("CashFlow")
    cashflow["A1"] = "Mjesec"
    cashflow["B1"] = "Neto CF"
    for i in range(1, 13):
        cashflow[f"A{i+1}"] = i
        cashflow[f"B{i+1}"] = f"='P&L'!D{i+1}*0.9"
        cashflow[f"B{i+1}"].font = BLACK

    summary = wb.create_sheet("Sazetak")
    summary["A1"] = "Ukupna dobit"
    summary["B1"] = "=SUM('P&L'!D2:D13)"
    summary["B1"].font = GREEN
    summary["A2"] = "Ukupni CF"
    summary["B2"] = "=SUM(CashFlow!B2:B13)"
    summary["B2"].font = GREEN

    return wb


def level4() -> Workbook:
    """"Model za procjenu vrijednosti poduzeća (DCF)... Model koji ima
    eksplicitni 'README' list." Fully modular input/calc/output sheets,
    a README sheet, and a LAMBDA-style dynamic function used in outputs."""
    wb = level3()  # start from a level-3 skeleton and add level-4 signals
    wb.worksheets[0].title = "Input_Pretpostavke"
    wb.worksheets[1].title = "Calc_PL"
    wb.worksheets[3].title = "Output_Sazetak"

    readme = wb.create_sheet("README")
    readme["A1"] = "Svrha, pretpostavke, ograničenja i uputa za upotrebu modela."
    readme["A2"] = "Zadnja izmjena: 2026-08-24. Kontakt: analitika@primjer.hr"

    out = wb["Output_Sazetak"]
    out["A4"] = "Prosjek zadnja 3 mjeseca (LAMBDA)"
    out["B4"] = "=LAMBDA(x,AVERAGE(x))(Calc_PL!D11:D13)"
    out["B4"].font = GREEN

    return wb


def main() -> None:
    for name, builder in (("level1", level1), ("level2", level2), ("level3", level3), ("level4", level4)):
        path = os.path.join(HERE, f"{name}.xlsx")
        builder().save(path)
        print("wrote", path)


if __name__ == "__main__":
    main()
