"""按终稿里的「## 段落名｜时间」把 captions.json 切成段落时间窗，写 sections.json（手绘横屏引擎用）。

用法: python tools/wb_sections.py public/episodes/EP01v2 ../2_第二版资料/文案/EP01_终稿.md
换真人配音、重新生成 captions.json 之后要重跑一次。
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from script_text import parse_script  # noqa: E402


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ep, md_path = Path(sys.argv[1]), Path(sys.argv[2])
    md = md_path.read_text(encoding="utf-8")
    body = md.split("# 一、口播稿", 1)[1].split("# 二、分镜表", 1)[0]
    secs = re.split(r"^## (.+)$", body, flags=re.M)[1:]
    cap = json.loads((ep / "captions.json").read_text(encoding="utf-8"))
    flat = [c for l in cap["lines"] for c in l["chars"]]
    flat_text = "".join(c["t"][0] for c in flat)
    out, pos = [], 0
    for k in range(0, len(secs), 2):
        title, text = secs[k].strip(), re.sub(r"^>.*$", "", secs[k + 1], flags=re.M)
        _, chars = parse_script(text)
        seg = "".join(c["c"] for c in chars if not c.get("sym"))
        idx = flat_text.find(seg[:12], max(0, pos - 20))
        if idx < 0:
            sys.exit(f"找不到段落开头：{title} / {seg[:12]}")
        name, _, tc = title.partition("｜")
        out.append({"id": f"s{k // 2 + 1:02d}", "title": name, "plannedTime": tc,
                    "startChar": idx, "startMs": flat[idx]["s"], "firstText": seg[:14]})
        pos = idx + len(seg)
    for i, o in enumerate(out):
        end_char = out[i + 1]["startChar"] - 1 if i + 1 < len(out) else len(flat) - 1
        o["endMs"] = flat[end_char]["e"]
        o["nextStartMs"] = out[i + 1]["startMs"] if i + 1 < len(out) else cap["durationMs"]
        print(o["id"], o["title"], o["startMs"], o["endMs"])
    (ep / "sections.json").write_text(json.dumps({"durationMs": cap["durationMs"], "sections": out},
                                                 ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
