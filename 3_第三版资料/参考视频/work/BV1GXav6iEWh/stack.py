from PIL import Image
import os
d = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\zoom"
names = ["z_ch1","z_ch10","z_ch2","z_ch3","z_ch4","z_ch5","z_ch6","z_ch7","z_ch8","z_ch9"]
ims = [Image.open(os.path.join(d,n+".png")) for n in names]
W = ims[0].width; H = ims[0].height
s = Image.new("RGB",(W,H*len(ims)),"red")
for i,im in enumerate(ims): s.paste(im,(0,i*H))
s.save(os.path.join(d,"chapters.png"))
