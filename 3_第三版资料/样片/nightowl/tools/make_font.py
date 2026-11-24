r"""《沙漏与潮水》霞鹜文楷子集：只收本片用到的字（画面代码 + 字幕 + 数据里的标签）+ ASCII + 常用标点。

源字体：video-engine/art-src/fonts/LXGWWenKai-Medium.ttf（SIL OFL 1.1）
输出：video-engine/public/v3/nightowl/fonts/wenkai-night.ttf

用法（不要在上一级目录运行：那里的 numbers.py 会顶掉标准库 numbers）：
  D:\conda\miniconda3\python.exe 3_第三版资料\样片\nightowl\tools\make_font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

VE = Path(__file__).resolve().parents[4] / "video-engine"
SRC = VE / "art-src" / "fonts" / "LXGWWenKai-Medium.ttf"
OUT = VE / "public" / "v3" / "nightowl" / "fonts" / "wenkai-night.ttf"

PUNCT = "，。、；：？！“”‘’（）《》…—–·～＋－＝×÷≈≠≤≥→←↑↓%?!:;,.()[]+-=/ 　①②③④⑤⑥⑦⑧⑨"


def main() -> None:
    chars = set(chr(c) for c in range(0x20, 0x7F)) | set(PUNCT)
    files = list((VE / "src" / "v3" / "nightowl").rglob("*.ts*"))
    files += [VE / "public" / "v3" / "nightowl" / n for n in ("subs.json", "beats.json", "numbers.json")]
    for f in files:
        chars |= set(f.read_text(encoding="utf-8"))
    chars = {c for c in chars if c.isprintable() or c == "　"}
    cmap = TTFont(SRC).getBestCmap()
    have = {c for c in chars if ord(c) in cmap}
    missing = sorted(c for c in chars - have if not c.isspace())
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(SRC), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text="".join(sorted(have)))
    sub.subset(font)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(font, str(OUT), opts)
    print(f"{len(have)} 个字 -> {OUT} ({OUT.stat().st_size // 1024} KB)")
    if missing:
        print("字体里没有的字符：", "".join(missing))


if __name__ == "__main__":
    main()
