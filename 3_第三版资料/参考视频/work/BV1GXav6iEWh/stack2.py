from PIL import Image
import os
d = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\zoom"
names = ["z_c0","z_c2","z_c5"]
ims = [Image.open(os.path.join(d,n+".png")) for n in names]
W = ims[0].width; H = ims[0].height
s = Image.new("RGB",(W,H*len(ims)),"red")
for i,im in enumerate(ims): s.paste(im,(0,i*H))
s.save(os.path.join(d,"chapters2.png"))
