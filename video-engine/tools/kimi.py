"""Call Kimi (Kimi Code, OpenAI-compatible) chat completions (stdlib only). Key is read from ../../.env (KIMI_API_KEY).
Models: k3 (default), k3-256k, kimi-for-coding. Docs: https://www.kimi.com/code/docs/kimi-code/models.html

    python tools/kimi.py --prompt p.md --out out.md [--system s.md] [--attach a.txt ...]
                             [--model k3] [--effort max]
"""
import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
URL = "https://api.kimi.com/coding/v1/chat/completions"


def api_key() -> str:
    key = os.environ.get("KIMI_API_KEY")
    if key:
        return key
    env = ROOT / ".env"
    for line in env.read_text(encoding="utf-8").splitlines():
        if line.startswith("KIMI_API_KEY="):
            return line.split("=", 1)[1].strip()
    sys.exit("KIMI_API_KEY not found in env or .env")


def call(messages, model, effort, max_tokens):
    body = {"model": model, "messages": messages, "stream": True, "max_tokens": max_tokens}
    if effort:
        body["reasoning_effort"] = effort
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key()}", "Content-Type": "application/json"},
    )
    content, reasoning, usage = [], [], None
    with urllib.request.urlopen(req, timeout=1800) as resp:
        for raw in resp:
            line = raw.decode("utf-8").strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            chunk = json.loads(data)
            if chunk.get("usage"):
                usage = chunk["usage"]
            for ch in chunk.get("choices", []):
                d = ch.get("delta", {})
                if d.get("reasoning_content"):
                    reasoning.append(d["reasoning_content"])
                if d.get("content"):
                    content.append(d["content"])
    return "".join(content), "".join(reasoning), usage


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True, help="file with the user message")
    ap.add_argument("--system", help="file with the system message")
    ap.add_argument("--attach", nargs="*", default=[], help="files appended to the user message")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="k3")
    ap.add_argument("--effort", default="max", help="none|low|high|max")
    ap.add_argument("--max-tokens", type=int, default=131072)
    a = ap.parse_args()

    user = Path(a.prompt).read_text(encoding="utf-8")
    for f in a.attach:
        user += f"\n\n===== 附件：{Path(f).name} =====\n" + Path(f).read_text(encoding="utf-8")
    messages = []
    if a.system:
        messages.append({"role": "system", "content": Path(a.system).read_text(encoding="utf-8")})
    messages.append({"role": "user", "content": user})

    t0 = time.time()
    for attempt in range(3):
        try:
            content, reasoning, usage = call(messages, a.model, None if a.effort == "none" else a.effort, a.max_tokens)
            break
        except Exception as e:  # network hiccups on long generations
            print(f"attempt {attempt + 1} failed: {e}", file=sys.stderr)
            if attempt == 2:
                raise
            time.sleep(10)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    if reasoning:
        out.with_suffix(".reasoning.md").write_text(reasoning, encoding="utf-8")
    print(f"ok {a.model} effort={a.effort} {time.time() - t0:.0f}s chars={len(content)} usage={usage}")


if __name__ == "__main__":
    main()
