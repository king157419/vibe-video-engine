from pathlib import Path
from PIL import Image,ImageDraw
import sys
p=Path(sys.argv[1]);files=sorted(p.glob('f_*.png'),key=lambda p:int(p.stem.split('_')[1]))
out=Image.new('RGB',(1440,294*((len(files)+2)//3)),(15,18,24));d=ImageDraw.Draw(out)
for j,f in enumerate(files):
 im=Image.open(f).convert('RGB');im.thumbnail((480,270));x=j%3*480;y=j//3*294;out.paste(im,(x,y));d.text((x+8,y+273),f.stem,fill='white')
out.save(p/'contact.jpg')
