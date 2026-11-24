from PIL import Image, ImageStat
import os
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
res = []
for n in range(1,301):
    im = Image.open(os.path.join(src,"f_%04d.jpg"%n)).convert("L").crop((20,28,150,46))
    st = ImageStat.Stat(im)
    res.append((n-1, round(st.mean[0],1), max(im.getdata())))
line = []
for t,m,mx in res:
    line.append("%d:%d" % (t, mx))
print(" ".join(line))
