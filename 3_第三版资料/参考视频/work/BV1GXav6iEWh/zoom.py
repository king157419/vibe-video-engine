from PIL import Image
import os, sys
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
out = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\zoom"
os.makedirs(out, exist_ok=True)
# args: name n x0 y0 x1 y1 scale
jobs = [l.split() for l in sys.argv[1].split(";") if l.strip()]
for name,n,x0,y0,x1,y1,s in jobs:
    im = Image.open(os.path.join(src, "f_%04d.jpg" % int(n))).crop((int(x0),int(y0),int(x1),int(y1)))
    s = float(s)
    im = im.resize((int(im.width*s), int(im.height*s)), Image.LANCZOS)
    im.save(os.path.join(out, name + ".png"))
print("ok")
