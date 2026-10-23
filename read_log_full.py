import json

log_path = r"C:\Users\Alejandro\.gemini\antigravity\brain\3a5bbb00-f28d-4328-8709-8fe36b778740\.system_generated\logs\overview.txt"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                print(f"--- USER INPUT Step {data.get('step_index')} ---")
                print(data.get("content"))
                print("-" * 40)
        except Exception as e:
            print(f"Error on line {idx}: {e}")
