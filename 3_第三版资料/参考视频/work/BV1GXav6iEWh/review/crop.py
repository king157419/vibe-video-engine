"""usage: crop.py out.png scale x0 y0 x1 y1 sec [sec ...]  -> stacks crops of given seconds vertically"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

FR = r'D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh'
OUT = r'D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\review'
out = sys.argv[1]
sc = float(sys.argv[2])
x0, y0, x1, y1 = map(int, sys.argv[3:7])
secs = [int(s) for s in sys.argv[7:]]
font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 16)
crops = []
for s in secs:
    im = Image.open(os.path.join(FR, f'f_{s+1:04d}.jpg')).convert('RGB')
    c = im.crop((x0, y0, x1, y1))
    c = c.resize((int(c.width * sc), int(c.height * sc)), Image.LANCZOS)
    crops.append((s, c))
w = max(c.width for _, c in crops) + 50
h = sum(c.height + 2 for _, c in crops)
sheet = Image.new('RGB', (w, h), (90, 0, 0))
d = ImageDraw.Draw(sheet)
y = 0
for s, c in crops:
    sheet.paste(c, (50, y))
    d.text((2, y + 4), f'{s//60}:{s%60:02d}', fill=(255, 255, 0), font=font)
    y += c.height + 2
sheet.save(os.path.join(OUT, out))
print(sheet.size)
