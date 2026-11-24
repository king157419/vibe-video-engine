"""把 wb_sheet.mjs 渲染的静帧拼成带时间标签的印样。用法：python tools/wb_sheet.py <out>/sheet.json"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

man = Path(sys.argv[1])
spec = json.loads(man.read_text(encoding="utf-8"))
cols, w = spec["cols"], spec["width"]
frames = spec["frames"]
ims = [Image.open(f["file"]).convert("RGB") for f in frames]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
pad = 6
sheet = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad) + pad), (40, 38, 34))
try:
    font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 16)
except OSError:
    font = ImageFont.load_default()
for i, (f, im) in enumerate(zip(frames, ims)):
    im = im.resize((w, h), Image.LANCZOS)
    dr = ImageDraw.Draw(im)
    tw = dr.textlength(f["label"], font=font)
    dr.rectangle([0, 0, tw + 10, 22], fill=(0, 0, 0))
    dr.text((5, 3), f["label"], fill=(255, 255, 255), font=font)
    sheet.paste(im, (pad + (i % cols) * (w + pad), pad + (i // cols) * (h + pad)))
out = man.with_name("sheet.png")
sheet.save(out)
print(out, sheet.size)
