# 检查用：把一组静帧拼成带标注的联系表。用法：python sheet.py out.png cols w file1 file2 ...
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 8) + 8, rows * (h + 30) + 8), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x = 8 + (i % cols) * (w + 8)
    y = 8 + (i // cols) * (h + 30)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 4, y + h + 6), f.replace(chr(92), '/').split('/')[-1], fill=(220, 220, 220))
sheet.save(out)
