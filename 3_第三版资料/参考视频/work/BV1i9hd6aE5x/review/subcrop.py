import os, sys, glob
from PIL import Image, ImageDraw
d = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\review"
files = sys.argv[2:]
name = sys.argv[1]
box = (120, 392, 732, 456)
sc = 2
ims = []
for f in files:
    im = Image.open(os.path.join(d, f)).convert('RGB').crop(box)
    im = im.resize((im.width * sc, im.height * sc), Image.LANCZOS)
    ims.append((f, im))
W = max(i.width for _, i in ims) + 90
H = sum(i.height + 6 for _, i in ims)
sh = Image.new('RGB', (W, H), 'white')
dr = ImageDraw.Draw(sh)
y = 0
for f, im in ims:
    sh.paste(im, (90, y))
    dr.text((3, y + 10), f.replace('t_', '').replace('.png', ''), fill='black')
    y += im.height + 6
sh.save(os.path.join(d, name + '.png'))
print(sh.size)
