import json

log_path = r"C:\Users\Alejandro\.gemini\antigravity\brain\3a5bbb00-f28d-4328-8709-8fe36b778740\.system_generated\logs\overview.txt"
output_path = r"c:\Users\Alejandro\Documents\antigravity\colombia-tax-calculator\user_request_clean.txt"

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT" and data.get("step_index") == 0:
                content = data.get("content", "")
                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(content)
                print(f"Successfully extracted {len(content)} characters to user_request_clean.txt")
                break
        except Exception as e:
            pass
