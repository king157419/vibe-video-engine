import os
from PIL import Image, ImageDraw, ImageFont

FR = r'D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh'
OUT = r'D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\review'
W, H = 384, 216
COLS = 4
font = ImageFont.truetype(r'C:\Windows\Fonts\arial.ttf', 20)
for start in range(0, 300, 20):
    secs = list(range(start, min(start + 20, 300)))
    rows = (len(secs) + COLS - 1) // COLS
    sheet = Image.new('RGB', (W * COLS + 2 * (COLS - 1), H * rows + 2 * (rows - 1)), (90, 0, 0))
    d = ImageDraw.Draw(sheet)
    for i, s in enumerate(secs):
        im = Image.open(os.path.join(FR, f'f_{s+1:04d}.jpg')).convert('RGB').resize((W, H), Image.LANCZOS)
        x = (i % COLS) * (W + 2)
        y = (i // COLS) * (H + 2)
        sheet.paste(im, (x, y))
        d.rectangle((x, y, x + 52, y + 24), fill=(0, 0, 0))
        d.text((x + 3, y + 1), f'{s//60}:{s%60:02d}', fill=(255, 255, 0), font=font)
    sheet.save(os.path.join(OUT, f'grid_{start:03d}.jpg'), quality=90)
print('ok')
