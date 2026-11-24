"""QA: 从成片抽帧（每 2 秒 1 帧），按分段拼联系表。

用法: python tools/wb_qa_sheets.py <video.mp4> <out_dir> [--step 2] [--cols 4] [--w 480] [--per 24] [--only s12,s15]
       [--start 530 --end 560]   # 只抽某个时间段（秒），用于局部复查
"""
import argparse, json, os, subprocess, shutil, glob
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out')
ap.add_argument('--step', type=float, default=2.0)
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--w', type=int, default=480)
ap.add_argument('--per', type=int, default=24)
ap.add_argument('--only', default='')
ap.add_argument('--start', type=float, default=None)
ap.add_argument('--end', type=float, default=None)
ap.add_argument('--offset', type=float, default=0.0, help='视频第 0 帧对应的片内秒数')
a = ap.parse_args()

secs = json.load(open(os.path.join(ROOT, 'public/episodes/EP01v2/sections.json'), encoding='utf-8'))['sections']
os.makedirs(a.out, exist_ok=True)
fr = os.path.join(a.out, '_frames')
shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
cmd = ['ffmpeg', '-v', 'error']
if a.start is not None: cmd += ['-ss', str(a.start)]
cmd += ['-i', a.video]
if a.start is not None and a.end is not None: cmd += ['-t', str(a.end - a.start)]
# 按帧号精确抽帧（fps 滤镜会取每个区间末尾那帧，标签会晚约半个步长）
nstep = max(1, round(a.step * 30))
cmd += ['-vf', f"select='not(mod(n\\,{nstep}))',scale={a.w}:-1", '-fps_mode', 'vfr', os.path.join(fr, '%05d.png')]
subprocess.run(cmd, check=True)
files = sorted(glob.glob(os.path.join(fr, '*.png')))
base = a.offset + (a.start or 0.0)
items = []
for i, f in enumerate(files):
    t = base + i * a.step  # fps 滤镜按 0, step, 2·step… 取最近帧
    sid = secs[0]['id']
    for s in secs:
        if s['startMs'] / 1000 - 0.001 <= t: sid = s['id']
    items.append((t, sid, f))

try:
    font = ImageFont.truetype(os.path.join(ROOT, 'public/wb/fonts/wenkai-sub.ttf'), 22)
except Exception:
    font = ImageFont.load_default()

only = set(x for x in a.only.split(',') if x)
groups = {}
for it in items:
    if only and it[1] not in only: continue
    groups.setdefault(it[1], []).append(it)
out_files = []
for sid, its in groups.items():
    pages = [its[i:i + a.per] for i in range(0, len(its), a.per)]
    for pi, page in enumerate(pages):
        im0 = Image.open(page[0][2]); w, h = im0.size
        rows = (len(page) + a.cols - 1) // a.cols
        pad = 6
        sheet = Image.new('RGB', (a.cols * (w + pad) + pad, rows * (h + pad) + pad), (40, 40, 40))
        d = ImageDraw.Draw(sheet)
        for k, (t, _, f) in enumerate(page):
            im = Image.open(f)
            x = pad + (k % a.cols) * (w + pad); y = pad + (k // a.cols) * (h + pad)
            sheet.paste(im, (x, y))
            lab = f'{int(t // 60)}:{t % 60:04.1f} {sid}'
            d.rectangle([x, y, x + 130, y + 28], fill=(0, 0, 0))
            d.text((x + 5, y + 2), lab, fill=(255, 255, 255), font=font)
        name = f'{sid}_{pi + 1}.png' if len(pages) > 1 else f'{sid}.png'
        p = os.path.join(a.out, name); sheet.save(p); out_files.append(p)
shutil.rmtree(fr, ignore_errors=True)
print('\n'.join(out_files))
