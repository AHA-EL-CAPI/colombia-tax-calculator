with open(r"c:\Users\Alejandro\Documents\antigravity\colombia-tax-calculator\src\components\DeclaracionCedular.tsx", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "Rentas de Capital" in line or "capital.bruto" in line or "usaPresuntos" in line:
            print(f"Line {idx+1}: {line.strip()}")
