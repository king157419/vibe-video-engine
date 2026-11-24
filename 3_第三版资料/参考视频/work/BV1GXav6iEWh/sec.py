from PIL import Image, ImageDraw, ImageFont
import os
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
out = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\sec"
os.makedirs(out, exist_ok=True)
W, H = 568, 320
font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 20)
for start in range(1, 301, 9):
    sheet = Image.new("RGB", (W*3, H*3), "white")
    for i in range(9):
        n = start + i
        f = os.path.join(src, "f_%04d.jpg" % n)
        if not os.path.exists(f): continue
        im = Image.open(f).resize((W, H), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle([0,0,64,24], fill="black")
        d.text((3,1), "%ds" % (n-1), fill="yellow", font=font)
        d.rectangle([0,0,W-1,H-1], outline=(90,90,0))
        sheet.paste(im, ((i%3)*W, (i//3)*H))
    sheet.save(os.path.join(out, "sec_%03d.jpg" % (start-1)), quality=88)
print("ok")
