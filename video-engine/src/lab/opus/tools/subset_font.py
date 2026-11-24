"""把霞鹜文楷 Medium 子集化成本集用到的字（稿子 + 画面里写的所有字 + ASCII）。
用法：D:/conda/miniconda3/python.exe src/lab/opus/tools/subset_font.py <LXGWWenKai-Medium.ttf>
字体：LXGW WenKai v1.522（SIL OFL 1.1）github.com/lxgw/LxgwWenKai/releases
"""
import json
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parents[4]  # video-engine
src = Path(sys.argv[1])
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。：；！？「」“”‘’（）、…—·《》0123456789")
cap = json.loads((ROOT / "public/episodes/lab01/captions.json").read_text(encoding="utf-8"))
for l in cap["lines"]:
    chars |= set(l["text"])
for f in (ROOT / "src/lab/opus").rglob("*.ts*"):
    chars |= set(f.read_text(encoding="utf-8"))
chars = {c for c in chars if c.isprintable()}
out = ROOT / "public/lab/opus/fonts/wenkai-sub.ttf"
out.parent.mkdir(parents=True, exist_ok=True)
opts = subset.Options()
opts.layout_features = ["*"]
font = subset.load_font(str(src), opts)
s = subset.Subsetter(opts)
s.populate(text="".join(sorted(chars)))
s.subset(font)
subset.save_font(font, str(out), opts)
print(len(chars), "chars ->", out, out.stat().st_size // 1024, "KB")
