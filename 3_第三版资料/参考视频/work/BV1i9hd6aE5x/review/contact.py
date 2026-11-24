import os, sys
from PIL import Image, ImageDraw
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
out = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\review"
t0, t1, cols, w = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
h = int(w * 480 / 852)
ts = list(range(t0, t1))
rows = (len(ts) + cols - 1) // cols
sh = Image.new('RGB', (cols * (w + 4), rows * (h + 16)), 'white')
d = ImageDraw.Draw(sh)
for k, t in enumerate(ts):
    im = Image.open(os.path.join(src, 'f_%04d.jpg' % (t + 1))).resize((w, h), Image.LANCZOS)
    x = (k % cols) * (w + 4); y = (k // cols) * (h + 16)
    sh.paste(im, (x, y + 14))
    d.text((x + 2, y + 1), '%d:%02d (%ds)' % (t // 60, t % 60, t), fill='black')
sh.save(os.path.join(out, 'ct_%03d_%03d.png' % (t0, t1)))
print(sh.size)
