import os, sys, json
from PIL import Image, ImageDraw
src=r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
out=r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\crop"
os.makedirs(out,exist_ok=True)
# args: name scale  then list of t:x0,y0,x1,y1
name=sys.argv[1]; scale=float(sys.argv[2])
items=[]
for a in sys.argv[3:]:
    t,box=a.split(':'); box=[int(v) for v in box.split(',')]
    im=Image.open(os.path.join(src,'f_%04d.jpg'%(int(t)+1))).crop(box)
    im=im.resize((int(im.width*scale),int(im.height*scale)),Image.LANCZOS)
    items.append((t,im))
W=max(i.width for _,i in items)+50; H=sum(i.height+6 for _,i in items)
sh=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(sh); y=0
for t,im in items:
    sh.paste(im,(50,y)); d.text((3,y+3),t+'s',fill='black'); y+=im.height+6
sh.save(os.path.join(out,name+'.png'))
print(sh.size)
