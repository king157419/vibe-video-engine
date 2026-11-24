"""grabtimes.py <video> <out.jpg> <cols> <width> t1 t2 ...  — 按精确帧号抽帧（帧 = round(t·30)），拼成带时间标签的总览"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

video, out, cols, W = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ts = [float(x) for x in sys.argv[5:]]
H = W * 9 // 16
ims = []
for t in ts:
    n = round(t * 30)
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{n / 30 + 0.001:.4f}', '-i', video, '-vf', f'scale={W}:{H}', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = Image.fromarray(np.frombuffer(raw, np.uint8).reshape(H, W, 3).copy())
    dr = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype('arial.ttf', max(12, W // 30))
    except Exception:
        font = ImageFont.load_default()
    dr.text((6, 4), f'{int(t // 60)}:{t % 60:04.1f}  f{n}', fill=(255, 220, 60), font=font)
    ims.append(im)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W + (cols - 1) * 2, rows * H + (rows - 1) * 2), (60, 60, 60))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * (W + 2), (i // cols) * (H + 2)))
sheet.save(out, quality=92)
print(out, sheet.size)
