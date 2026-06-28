import os
import json

brain_path = r"C:\Users\Alejandro\.gemini\antigravity\brain"

for root, dirs, files in os.walk(brain_path):
    for file in files:
        if file == "overview.txt":
            full_path = os.path.join(root, file)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_idx, line in enumerate(f):
                        if "listaRendimientos" in line:
                            try:
                                data = json.loads(line)
                                content = data.get("content", "")
                                print(f"FOUND IN: {full_path} at step {data.get('step_index')}")
                                print(f"Length: {len(content)}")
                                # Print first 1000 and last 1000 characters
                                print("--- START ---")
                                print(content[:1500])
                                print("--- END ---")
                                print(content[-1500:])
                                print("="*80)
                            except Exception as e:
                                print(f"JSON load error: {e}")
            except Exception as e:
                print(f"Error reading {full_path}: {e}")
