import os
import json

brain_path = r"C:\Users\Alejandro\.gemini\antigravity\brain"

for root, dirs, files in os.walk(brain_path):
    for file in files:
        if file == "overview.txt":
            full_path = os.path.join(root, file)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        if "usaPresuntos" in line or "listaRendimientos" in line:
                            try:
                                data = json.loads(line)
                                content = data.get("content", "")
                                if "Fase 2" in content and "Fase 3" in content:
                                    print(f"FOUND IN: {full_path}")
                                    print(content)
                                    print("="*80)
                            except:
                                pass
            except Exception as e:
                print(f"Error reading {full_path}: {e}")
