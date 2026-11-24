"""把一个目录里的静帧拼成带时间标签的印样。用法：python sheet.py <dir> <cols> <width>"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

d = Path(sys.argv[1]); cols = int(sys.argv[2]); w = int(sys.argv[3])
fs = sorted(d.glob("f_*.png"))
ims = [Image.open(f).convert("RGB") for f in fs]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "white")
for i, (f, im) in enumerate(zip(fs, ims)):
    im = im.resize((w, h))
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, 70, 22], fill="black")
    dr.text((4, 4), f"{int(f.stem[2:]) / 30:.1f}s", fill="white")
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(d / "sheet.png")
print(d / "sheet.png", sheet.size)
