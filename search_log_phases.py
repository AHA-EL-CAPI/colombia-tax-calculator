import json

log_path = r"C:\Users\Alejandro\.gemini\antigravity\brain\3a5bbb00-f28d-4328-8709-8fe36b778740\.system_generated\logs\overview.txt"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "Fase" in line or "componente" in line:
            try:
                data = json.loads(line)
                content = data.get("content", "")
                if "Fase 2" in content or "Fase 3" in content:
                    print(f"--- MATCH IN Step {data.get('step_index')} (type: {data.get('type')}) ---")
                    print(content)
                    print("-" * 50)
            except Exception as e:
                pass
