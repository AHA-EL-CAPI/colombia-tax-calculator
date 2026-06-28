import os

brain_path = r"C:\Users\Alejandro\.gemini\antigravity\brain"

for root, dirs, files in os.walk(brain_path):
    for file in files:
        if file.endswith(".txt") or file.endswith(".json") or file.endswith(".md"):
            full_path = os.path.join(root, file)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "multi-entidad" in content and "3a5bbb00" not in full_path:
                        print(f"Match found in: {full_path}")
                        # print context around the match
                        idx = content.find("multi-entidad")
                        start = max(0, idx - 500)
                        end = min(len(content), idx + 2500)
                        print("--- CONTEXT ---")
                        print(content[start:end])
                        print("=" * 60)
            except Exception as e:
                pass
