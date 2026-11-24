import os, sys
from PIL import Image, ImageDraw
src=r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
out=r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\det"
os.makedirs(out,exist_ok=True)
start,end,step=int(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3])
cols=3; W,H=568,320
idx=list(range(start+1,end+2,step))
rows=(len(idx)+cols-1)//cols
sheet=Image.new('RGB',(cols*W,rows*(H+16)),'white')
d=ImageDraw.Draw(sheet)
for k,n in enumerate(idx):
    if n>300: break
    im=Image.open(os.path.join(src,'f_%04d.jpg'%n)).resize((W,H),Image.LANCZOS)
    x=(k%cols)*W; y=(k//cols)*(H+16)
    sheet.paste(im,(x,y+16)); d.text((x+4,y+2),'%ds'%(n-1),fill='black')
sheet.save(os.path.join(out,'d_%03d_%03d.jpg'%(start,end)),quality=90)
