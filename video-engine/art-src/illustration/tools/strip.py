"""Render a frame range of the Illustration composition and stack a crop of each frame into one strip.
usage: python strip.py <from> <to> <out.png> [y0 y1] [step]   (y in full-res px; frames rendered at scale 0.5)"""
import shutil, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

ENGINE = Path(__file__).resolve().parents[3]
a, b, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
y0, y1 = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1150, 1470)
step = int(sys.argv[6]) if len(sys.argv) > 6 else 1
seq = ENGINE / 'out' / 'v3' / '_seq'
shutil.rmtree(seq, ignore_errors=True)
npx = shutil.which('npx.cmd') or shutil.which('npx')
subprocess.run([npx, 'remotion', 'render', 'Illustration', str(seq), '--sequence', f'--frames={a}-{b}', '--scale=0.5',
                '--image-format=jpeg', '--jpeg-quality=90', '--log=error'], cwd=ENGINE, check=True)
frames = list(range(a, b + 1, step))
crops = []
for f in frames:
    p = seq / f'element-{f}.jpeg'
    if not p.exists():
        p = seq / f'element-{f:04d}.jpeg'
    im = Image.open(p).crop((0, y0 // 2, 540, y1 // 2))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 70, 18), fill=(0, 0, 0))
    d.text((3, 3), f'f{f} {f/30:.2f}s', fill=(255, 255, 0))
    crops.append(im)
h = crops[0].size[1]
sheet = Image.new('RGB', (540, (h + 4) * len(crops)), 'white')
for i, c in enumerate(crops):
    sheet.paste(c, (0, i * (h + 4)))
sheet.save(ENGINE / 'out' / 'v3' / out)
print('saved', out)
