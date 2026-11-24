from PIL import Image
import os
d = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\zoom"
names = ["s16","s17","s18","s19","s20","s21","s22"]
ims = [Image.open(os.path.join(d,n+".png")) for n in names]
W = ims[0].width; H = ims[0].height
s = Image.new("RGB",(W*len(ims)+6*len(ims),H),"red")
for i,im in enumerate(ims): s.paste(im,(i*(W+6),0))
s.save(os.path.join(d,"slot.png"))
