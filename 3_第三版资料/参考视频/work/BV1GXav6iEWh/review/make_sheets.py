import os, random
from PIL import Image, ImageDraw, ImageFont

FR = r'D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh'
OUT = r'D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\review'
os.makedirs(OUT, exist_ok=True)

# subtitle band, 1x
Y0, Y1 = 392, 458
X0, X1 = 40, 812
PER = 20
font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 14)
for start in range(0, 300, PER):
    rows = []
    for s in range(start, min(start + PER, 300)):
        im = Image.open(os.path.join(FR, f'f_{s+1:04d}.jpg')).convert('RGB')
        rows.append((s, im.crop((X0, Y0, X1, Y1))))
    w = (X1 - X0) + 50
    h = (Y1 - Y0 + 2) * len(rows)
    sheet = Image.new('RGB', (w, h), (60, 0, 0))
    d = ImageDraw.Draw(sheet)
    for i, (s, c) in enumerate(rows):
        y = i * (Y1 - Y0 + 2)
        sheet.paste(c, (50, y))
        d.text((2, y + 25), f'{s//60}:{s%60:02d}', fill=(255, 255, 0), font=font)
    sheet.save(os.path.join(OUT, f'subsheet_{start:03d}.png'))
print('ok')
