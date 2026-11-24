"""白板手写体子集：霞鹜文楷 LXGW WenKai Medium（SIL OFL 1.1）→ public/wb/fonts/wenkai-sub.ttf

收字范围（一次做全，section 不用再子集化）：
  - GB2312 一级汉字（3755 个）
  - public/episodes/EP01v2/script.txt 和 2_第二版资料/文案/EP01_终稿.md 里的每一个字
  - src/ep01v2/**/*.ts(x) 和 src/whiteboard/**/*.ts(x) 里出现的每一个字
  - ASCII、常用中英文标点、手绘用符号（✓ ✗ → ① … ▇ 等，字体里有的才收）

用法（在 video-engine 下）：
  D:\\conda\\miniconda3\\python.exe tools/wb_font.py [--src art-src/fonts/LXGWWenKai-Medium.ttf]
"""
import argparse
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]  # video-engine
DOC = ROOT.parent / "2_第二版资料" / "文案" / "EP01_终稿.md"


def gb2312_level1() -> set[str]:
    out = set()
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            if hi == 0xD7 and lo > 0xF9:
                break
            try:
                out.add(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return out


PUNCT = (
    "，。、；：？！“”‘’「」『』《》〈〉（）【】〔〕…—–·～﹏＿／＼＋－＝＜＞％＃＆＊＠￥"
    "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
    "０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
    "✓✔✗✘☑☐□■▇█○●◎◇◆△▲▽▼☆★♡♥→←↑↓↔⇒⇐↗↘×÷±≈≠≤≥∞°℃※§¶†‡•‣"
    "　"
)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(ROOT / "art-src/fonts/LXGWWenKai-Medium.ttf"))
    ap.add_argument("--out", default=str(ROOT / "public/wb/fonts/wenkai-sub.ttf"))
    a = ap.parse_args()

    chars = set(chr(c) for c in range(0x20, 0x7F))
    chars |= set(PUNCT)
    chars |= gb2312_level1()
    n_gb = len(chars)
    for p in [ROOT / "public/episodes/EP01v2/script.txt", DOC]:
        if p.exists():
            chars |= set(p.read_text(encoding="utf-8"))
        else:
            print("warn: missing", p, file=sys.stderr)
    for d in [ROOT / "src/ep01v2", ROOT / "src/whiteboard"]:
        for f in d.rglob("*.ts*"):
            if f.name == "hanzi.generated.ts":
                continue
            chars |= set(f.read_text(encoding="utf-8"))
    chars = {c for c in chars if c.isprintable() or c == "　"}

    font = TTFont(a.src)
    cmap = font.getBestCmap()
    have = {c for c in chars if ord(c) in cmap}
    missing = sorted(c for c in chars - have if not c.isspace())
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    f2 = subset.load_font(a.src, opts)
    s = subset.Subsetter(opts)
    s.populate(text="".join(sorted(have)))
    s.subset(f2)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(f2, str(out), opts)
    print(f"{len(have)} glyph chars (GB2312-1 + ascii/punct = {n_gb} requested) -> {out} ({out.stat().st_size // 1024} KB)")
    if missing:
        print(f"not in font ({len(missing)}): {''.join(missing[:200])}")


if __name__ == "__main__":
    main()
