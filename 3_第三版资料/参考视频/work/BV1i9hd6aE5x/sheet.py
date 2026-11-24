import os, sys
from PIL import Image, ImageDraw
src=r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
out=r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x"
step=int(sys.argv[1]) if len(sys.argv)>1 else 5
cols,rows=4,3
W,H=426,240
idx=list(range(1,301,step))
per=cols*rows
for s in range(0,len(idx),per):
    sheet=Image.new('RGB',(cols*W,rows*(H+18)),'white')
    d=ImageDraw.Draw(sheet)
    for k,n in enumerate(idx[s:s+per]):
        im=Image.open(os.path.join(src,'f_%04d.jpg'%n)).resize((W,H))
        x=(k%cols)*W; y=(k//cols)*(H+18)
        sheet.paste(im,(x,y+18))
        d.text((x+4,y+3),'%d s (f_%04d)'%(n-1,n),fill='black')
    sheet.save(os.path.join(out,'ov_%02d.jpg'%(s//per)),quality=88)
print('done')
