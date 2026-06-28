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
                        if "inflacionario" in line:
                            try:
                                data = json.loads(line)
                                content = data.get("content", "")
                                if data.get("type") == "USER_INPUT":
                                    print(f"FOUND USER INPUT IN: {full_path} at step {data.get('step_index')}")
                                    print(content)
                                    print("="*80)
                            except:
                                pass
            except Exception as e:
                pass
