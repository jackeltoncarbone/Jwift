# Stream a Claude Code agent transcript (JSONL, hundreds of MB) into a readable digest, in order: the orchestrator's
# messages (=== USER), the agent's text (--- SAY), every tool call (>>> Tool: command and description, paths, queries,
# sub-agent prompts) and each tool result truncated (<<<). Prints the last timestamp so a later pass can resume.
# usage: python extract.py [result_chars=600] [transcript.jsonl] [digest.txt]
import json, sys, io
SRC = sys.argv[2] if len(sys.argv) > 2 else r"C:\Users\jackc\AppData\Local\Temp\claude\C--Users-jackc\09ee8d5e-80fe-47d9-9f89-c18df11719be\tasks\aca88094d963d6e7a.output"
OUT = sys.argv[3] if len(sys.argv) > 3 else "digest.txt"
RMAX = int(sys.argv[1]) if len(sys.argv) > 1 else 600
out = io.open(OUT, "w", encoding="utf-8")
last_ts = None
seen = set()
n = 0
with io.open(SRC, "r", encoding="utf-8", errors="replace") as f:
    for line in f:
        try:
            o = json.loads(line)
        except Exception:
            continue
        u = o.get("uuid")
        if u in seen:
            continue
        seen.add(u)
        ts = o.get("timestamp", "")
        if ts:
            last_ts = ts
        m = o.get("message") or {}
        c = m.get("content")
        role = m.get("role") or o.get("type")
        if isinstance(c, str):
            if role == "user":
                out.write(f"\n=== USER {ts}\n{c}\n")
            continue
        if not isinstance(c, list):
            continue
        for b in c:
            t = b.get("type")
            if t == "text":
                tag = "=== USER" if role == "user" else "--- SAY"
                out.write(f"\n{tag} {ts}\n{b['text']}\n")
            elif t == "tool_use":
                i = b.get("input", {})
                nm = b.get("name")
                if nm in ("Bash", "PowerShell"):
                    s = f"{i.get('description', '')}\n$ {i.get('command', '')}"
                elif nm == "Read":
                    s = i.get("file_path", "") + (f" off={i.get('offset')}" if i.get("offset") else "")
                elif nm == "Write":
                    s = i.get("file_path", "") + "\n" + i.get("content", "")[:1500]
                elif nm == "Edit":
                    s = i.get("file_path", "") + "\n-" + i.get("old_string", "")[:300] + "\n+" + i.get("new_string", "")[:600]
                else:
                    s = json.dumps(i)[:3000]
                out.write(f"\n>>> {nm} {ts}\n{s}\n")
            elif t == "tool_result":
                cc = b.get("content")
                if isinstance(cc, list):
                    cc = "\n".join(x.get("text", "") if x.get("type") == "text" else "[image]" for x in cc)
                cc = str(cc)
                if len(cc) > RMAX:
                    cc = cc[:RMAX] + f" ...[{len(cc)} chars]"
                out.write(f"<<< {cc}\n")
        n += 1
out.write(f"\n#### LAST TIMESTAMP {last_ts} records {n}\n")
out.close()
print(last_ts, n)
