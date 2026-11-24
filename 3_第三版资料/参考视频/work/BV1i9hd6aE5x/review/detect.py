import os
from PIL import Image
d = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\review\s5"
fs = sorted(os.listdir(d))
rows = []
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert('L')
    zh = im.crop((0, 6, im.width, 36)).point(lambda v: 255 if v > 140 else 0)
    n = zh.histogram()[255]
    bb = zh.getbbox()
    ext = (bb[0], bb[2]) if (bb and n > 150) else (-1, -1)
    rows.append((i / 5.0, n, ext))
segs = []
cur = None
for t, n, ext in rows:
    on = n > 150
    if on:
        if cur and abs(cur['ext'][0] - ext[0]) <= 8 and abs(cur['ext'][1] - ext[1]) <= 8 and t - cur['end'] <= 0.41:
            cur['end'] = t
        else:
            if cur: segs.append(cur)
            cur = {'start': t, 'end': t, 'ext': ext}
    else:
        pass
    if not on and cur and t - cur['end'] > 0.41:
        segs.append(cur); cur = None
if cur: segs.append(cur)
for s in segs:
    print('%6.1f %6.1f  %5.1fs  ext=%s' % (s['start'], s['end'], s['end'] - s['start'] + 0.2, s['ext']))
print(len(segs))
