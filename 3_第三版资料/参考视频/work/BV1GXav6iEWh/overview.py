from PIL import Image, ImageDraw, ImageFont
import os
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
out = r"D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh"
im0 = Image.open(os.path.join(src, "f_0001.jpg"))
print(im0.size)
W, H = 426, 240
font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 18)
secs = list(range(1, 301, 5))  # frame indices
per = 12
for s in range(0, len(secs), per):
    chunk = secs[s:s+per]
    sheet = Image.new("RGB", (W*3, H*4), "white")
    for i, n in enumerate(chunk):
        f = os.path.join(src, "f_%04d.jpg" % n)
        im = Image.open(f).resize((W, H))
        d = ImageDraw.Draw(im)
        d.rectangle([0,0,70,22], fill="black")
        d.text((3,1), "%ds" % (n-1), fill="yellow", font=font)
        sheet.paste(im, ((i%3)*W, (i//3)*H))
    sheet.save(os.path.join(out, "overview_%02d.jpg" % (s//per)), quality=85)
