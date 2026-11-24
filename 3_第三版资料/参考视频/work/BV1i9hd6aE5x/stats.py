import os
from PIL import Image, ImageStat, ImageChops
src=r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
prev=None
for n in range(1,301):
    im=Image.open(os.path.join(src,'f_%04d.jpg'%n)).convert('L')
    lab=im.crop((30,30,230,52)); labv=sum(lab.point(lambda v:255 if v>90 else 0).histogram()[255:])
    top=im.crop((0,0,852,390))
    diff=0 if prev is None else ImageStat.Stat(ImageChops.difference(top,prev)).mean[0]
    prev=top
    rgb=Image.open(os.path.join(src,'f_%04d.jpg'%n)).convert('RGB')
    m=[int(x) for x in ImageStat.Stat(rgb).mean]
    print(n-1,labv,round(diff,2),m)
