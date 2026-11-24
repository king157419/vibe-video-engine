import os, sys
from PIL import Image, ImageDraw
src=r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1i9hd6aE5x"
out=r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1i9hd6aE5x\sub"
os.makedirs(out,exist_ok=True)
x0,y0,x1,y1=[int(v) for v in sys.argv[1:5]]
scale=float(sys.argv[5]); per=int(sys.argv[6])
im=Image.open(os.path.join(src,'f_0001.jpg')); print(im.size)
w=int((x1-x0)*scale); h=int((y1-y0)*scale)
for s in range(1,301,per):
    ns=[n for n in range(s,min(s+per,301))]
    sheet=Image.new('RGB',(w+60,len(ns)*(h+4)),'white')
    d=ImageDraw.Draw(sheet)
    for k,n in enumerate(ns):
        c=Image.open(os.path.join(src,'f_%04d.jpg'%n)).crop((x0,y0,x1,y1)).resize((w,h),Image.LANCZOS)
        sheet.paste(c,(60,k*(h+4)))
        d.text((4,k*(h+4)+h//2-5),'%ds'%(n-1),fill='black')
    sheet.save(os.path.join(out,'s_%03d.png'%(s-1)))
print('ok')
