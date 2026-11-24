"""扫描 src/ep01v2/**/*.ts(x) 里所有 write(...) 调用，把用到的汉字的笔顺数据
（node_modules/hanzi-writer-data/<字>.json）写进 src/ep01v2/hanzi.generated.ts。

- 识别：write(b, '词', ...) / ctx.write('词', ...) / write('词', ...)（单/双/反引号字符串；带 ${} 的模板串跳过）
- 手动补字：任何文件里写一行注释  // hanzi: 字字字   （给用变量传进 write 的字）
- 幂等：结果 = 所有文件用到的字的并集，按字排序；内容没变就不写文件。
- 并发安全：先写临时文件再 os.replace 原子替换；多个 agent 同时跑，最后留下的都是完整、正确的文件。

用法（在 video-engine 下）：D:\\conda\\miniconda3\\python.exe tools/wb_hanzi.py [--check]
  --check  只报告缺哪些字，不写文件（退出码 1 = 需要重新生成）
"""
import json
import os
import re
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "ep01v2"
OUT = SRC / "hanzi.generated.ts"
DATA = ROOT / "node_modules" / "hanzi-writer-data"

CALL = re.compile(r"\b[wW]rite\s*\(\s*(?:[\w$.]+\s*,\s*)?(['\"`])((?:\\.|(?!\1).)*?)\1", re.S)
HINT = re.compile(r"//\s*hanzi:\s*(\S+)")
CJK = re.compile(r"[\u3400-\u9fff]")


def scan() -> tuple[set[str], dict[str, set[str]]]:
    chars: set[str] = set()
    where: dict[str, set[str]] = {}
    for f in sorted(SRC.rglob("*.ts*")):
        if f.name == OUT.name:
            continue
        text = f.read_text(encoding="utf-8")
        found: set[str] = set()
        for m in CALL.finditer(text):
            s = m.group(2)
            if m.group(1) == "`" and "${" in s:
                continue
            found |= set(CJK.findall(s))
        for m in HINT.finditer(text):
            found |= set(CJK.findall(m.group(1)))
        for c in found:
            where.setdefault(c, set()).add(f.relative_to(SRC).as_posix())
        chars |= found
    return chars, where


def render(chars: set[str]) -> tuple[str, list[str]]:
    lines = [
        "// 自动生成：tools/wb_hanzi.py（扫描 src/ep01v2 里的 write(...) 调用）。不要手改。",
        "// hanzi-writer-data（Arphic Public License，见 node_modules/hanzi-writer-data/ARPHICPL.TXT）",
        "import type {HanziData} from '../whiteboard';",
        "",
        "export const HANZI: Record<string, HanziData> = {",
    ]
    missing = []
    for c in sorted(chars):
        p = DATA / f"{c}.json"
        if not p.exists():
            missing.append(c)
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        lines.append(f"\t{json.dumps(c, ensure_ascii=False)}: {json.dumps({'strokes': d['strokes'], 'medians': d['medians']}, ensure_ascii=False, separators=(',', ':'))},")
    lines.append("};")
    return "\n".join(lines) + "\n", missing


def main():
    check = "--check" in sys.argv
    chars, where = scan()
    text, missing = render(chars)
    old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
    have = set(re.findall(r'^\t"(.)":', old, re.M))
    need = sorted((chars - set(missing)) - have)
    if check:
        print(f"{len(chars)} chars used by write(); {len(need)} not yet generated: {''.join(need)}")
        if missing:
            print(f"no stroke data (write() falls back to font): {''.join(missing)}")
        sys.exit(1 if need or len(have - chars) else 0)
    if text != old:
        fd, tmp = tempfile.mkstemp(dir=str(SRC), prefix=".hanzi.", suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        for i in range(20):
            try:
                os.replace(tmp, OUT)
                break
            except PermissionError:
                time.sleep(0.1 * (i + 1))
        else:
            os.unlink(tmp)
            raise SystemExit("could not replace hanzi.generated.ts (file locked)")
        print(f"wrote {OUT.relative_to(ROOT)}: {len(chars) - len(missing)} chars ({OUT.stat().st_size // 1024} KB); new: {''.join(need) or '-'}")
    else:
        print(f"up to date: {len(chars) - len(missing)} chars")
    if missing:
        print(f"no stroke data (write() falls back to font): {''.join(missing)}  used in: " + "; ".join(f"{c}@{','.join(sorted(where[c]))}" for c in missing))


if __name__ == "__main__":
    main()
