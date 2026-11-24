from PIL import Image, ImageDraw, ImageFont
import os
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
out = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\subs"
os.makedirs(out, exist_ok=True)
font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 22)
x0,x1,y0,y1 = 60, 792, 395, 455
S = 2
w, h = (x1-x0)*S, (y1-y0)*S
LBL = 70
for start in range(1, 301, 10):
    sheet = Image.new("RGB", (w+LBL, h*10), "black")
    d = ImageDraw.Draw(sheet)
    for i in range(10):
        n = start + i
        f = os.path.join(src, "f_%04d.jpg" % n)
        if not os.path.exists(f): continue
        im = Image.open(f).crop((x0,y0,x1,y1)).resize((w,h), Image.LANCZOS)
        sheet.paste(im, (LBL, i*h))
        d.text((4, i*h+40), "%ds" % (n-1), fill="yellow", font=font)
        d.line([(0,i*h),(w+LBL,i*h)], fill=(80,80,0))
    sheet.save(os.path.join(out, "sub_%03d.png" % (start-1)))
print("ok")
