# Recorder: reading an agent transcript

`extract.py` turned the glass agent's transcript (JSONL, 226 MB) into the digest these docs were written from.

- Input: `python extract.py [result_chars] [transcript.jsonl] [digest.txt]`. Defaults: 600 characters per tool result, the glass agent's transcript, `digest.txt`.
- Output: a chronological text file. `=== USER <time>` the orchestrator's messages (the why), `--- SAY <time>` the agent's own text, `>>> Bash <time>` each tool call with its description and command (Read, Write, Edit paths; WebFetch, WebSearch and Agent inputs as JSON), `<<< ...` each result, truncated.
- Sample output: `2026-09-24T18:58:31.975Z 8198` (the last timestamp and the record count). The digest was 3.7 MB; split into thirds by time and read in full.
- To continue a later pass: run it again and read from the `LAST TIMESTAMP` noted at the top of `../../Methods.md`.
