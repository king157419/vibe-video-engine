"""Extract exact-frame visual evidence, title cover and bell contact sheets. No external media."""
import json,pathlib,subprocess,sys
from PIL import Image,ImageDraw
BASE=pathlib.Path(__file__).resolve().parents[2]
OUT=BASE/'video-engine/out/v4/starry'
video=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else OUT/'final.mp4'
cue=json.loads((BASE/'video-engine/public/v4/starry/cue.json').read_text(encoding='utf8'))
ev=OUT/'evidence';ev.mkdir(exist_ok=True)
times=[0,3,9,18,27,52,84,112,132,162,174.5,177,178.5,181,201,214,224,232,239.5,240,241.5]
for h in cue['hits']:
 if h['type']=='bell':times.extend([max(0,h['t']-.2),h['t'],h['t']+.2])
times=sorted(set(times))
frames=[]
for t in times:
 f=round(t*30);dest=ev/f'f_{f:05d}.png'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{f/30:.8f}','-i',str(video),'-frames:v','1',str(dest)],check=True)
 im=Image.open(dest).convert('RGB').resize((480,270));frames.append((t,im))
for start in range(0,len(frames),24):
 group=frames[start:start+24];sheet=Image.new('RGB',(1920,6*300),'#10131a');d=ImageDraw.Draw(sheet)
 for j,(t,im)in enumerate(group):
  x=j%4*480;y=j//4*300;sheet.paste(im,(x,y));d.text((x+10,y+276),f'{t:.2f}s / frame {round(t*30)}',fill='white')
 sheet.save(ev/f'contact_{start//24}.jpg',quality=94)
Image.open(ev/'f_00540.png').save(OUT/'B_星空的风_封面.png')
print('evidence frames:',len(frames),'directory:',ev)
