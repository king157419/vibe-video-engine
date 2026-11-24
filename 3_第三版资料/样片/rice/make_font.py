r"""霞鹜文楷子集：只收本片源码（src/v3/rice/*.ts(x)）和旁白稿里出现的字 + ASCII + 常用符号。
用法（在 video-engine 下）：D:\conda\miniconda3\python.exe -P ..\3_第三版资料\样片\rice\make_font.py
（加 -P：本目录有 numbers.py，会遮住标准库 numbers）
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3] / "video-engine"
SRC = ROOT / "art-src" / "fonts" / "LXGWWenKai-Medium.ttf"
OUT = ROOT / "public" / "v3" / "rice" / "fonts" / "wenkai-rice.ttf"

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。、；：？！“”‘’（）《》…—·～≈≠≤≥→←°℃×÷±①②③④⑤⑥｜")
for p in (ROOT / "src" / "v3" / "rice").glob("*.ts*"):
    chars |= set(p.read_text(encoding="utf-8"))
chars |= set((ROOT / "public" / "v3" / "rice" / "script.txt").read_text(encoding="utf-8"))
font = TTFont(SRC)
cmap = font.getBestCmap()
keep = sorted(c for c in chars if ord(c) in cmap)
OUT.parent.mkdir(parents=True, exist_ok=True)
opts = subset.Options()
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(text="".join(keep))
sub.subset(font)
font.save(OUT)
print(f"{len(keep)} 个字 → {OUT} ({OUT.stat().st_size // 1024} KB)")
