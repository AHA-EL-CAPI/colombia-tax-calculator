import json

log_path = r"C:\Users\Alejandro\.gemini\antigravity\brain\3a5bbb00-f28d-4328-8709-8fe36b778740\.system_generated\logs\overview.txt"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        data = json.loads(line)
        print(f"Step {data.get('step_index')}: {data.get('type')} / {data.get('status')}")
        if data.get("type") == "USER_INPUT":
            # print first 200 chars and last 200 chars of user input
            content = data.get("content", "")
            print(f"  User input length: {len(content)}")
            print(f"  Start: {content[:200]}")
            print(f"  End: {content[-200:]}")
        elif data.get("type") == "PLANNER_RESPONSE":
            print(f"  Response: {data.get('content')}")
            for tc in data.get("tool_calls", []):
                print(f"    Tool call: {tc.get('name')} args: {list(tc.get('args', {}).keys())}")
