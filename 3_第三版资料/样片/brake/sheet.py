"""把一个目录里的 PNG 静帧拼成联系表（每张下面标时间）。
用法：D:\\conda\\miniconda3\\python.exe sheet.py <目录> <输出.png> [列数=2] [每张宽=960]
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 2
cw = int(sys.argv[4]) if len(sys.argv) > 4 else 960
files = sorted(glob.glob(os.path.join(src, "f_*.png")))
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((cw, round(im.height * cw / im.width)))
    ims.append((f, im))
h = ims[0][1].height
pad = 34
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * (cw + 6), rows * (h + pad)), "white")
d = ImageDraw.Draw(S)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
except OSError:
    font = ImageFont.load_default()
for i, (f, im) in enumerate(ims):
    x = (i % cols) * (cw + 6)
    y = (i // cols) * (h + pad)
    S.paste(im, (x, y))
    fr = int(os.path.basename(f)[2:7])
    d.text((x + 6, y + h + 4), f"{fr / 30:.2f}s  (frame {fr})", fill="black", font=font)
S.save(out)
print(out, S.size)
