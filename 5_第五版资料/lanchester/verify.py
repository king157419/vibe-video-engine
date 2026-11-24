"""Post-render evidence only; writes strictly inside this film's out/ directory."""
from pathlib import Path
import json, subprocess, re, wave, hashlib
import numpy as np
from PIL import Image, ImageDraw
BASE=Path(__file__).resolve().parents[2]
OUT=BASE/'video-engine/out/v4/lanchester'
PUB=BASE/'video-engine/public/v4/lanchester'
video=OUT/'final.mp4'
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace')
 if p.returncode: raise RuntimeError(p.stderr[-2000:])
 return p.stdout,p.stderr
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)])[0])
(OUT/'probe_final.json').write_text(json.dumps(probe,indent=2),encoding='utf-8')
vs=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (vs['width'],vs['height'],vs['nb_frames'],vs['r_frame_rate'])==(1920,1080,'5220','30/1')
assert vs['codec_name']=='h264'
aud=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert aud['codec_name']=='aac' and aud['sample_rate']=='48000'
cue=json.loads((PUB/'cue.json').read_text(encoding='utf-8'))
with wave.open(str(PUB/'mix.wav')) as w:
 sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),np.int16)
 assert a.size==174*sr*2
 for lo,hi in cue['silences']:assert np.max(np.abs(a[int(lo*sr)*2:int(hi*sr)*2]))==0
for name,filt in [('ebur128','ebur128=peak=true'),('silence','silencedetect=n=-60dB:d=0.4')]:
 _,err=run(['ffmpeg','-hide_banner','-nostats','-i',str(video),'-af',filt,'-f','null','-'])
 (OUT/f'audio_final_{name}.txt').write_text(err,encoding='utf-8')
frames=OUT/'ding_frames';frames.mkdir(exist_ok=True)
images=[]
for i,h in enumerate([h for h in cue['hits'] if h['type']=='bell']):
 dest=frames/f'{i+1:02d}_{h["t"]:.1f}.png'
 run(['ffmpeg','-v','error','-y','-ss',str(h['t']),'-i',str(video),'-frames:v','1',str(dest)])
 im=Image.open(dest).convert('RGB');im.thumbnail((640,360));images.append((im,h))
sheet=Image.new('RGB',(1280,4*390),(8,11,16));d=ImageDraw.Draw(sheet)
for i,(im,h) in enumerate(images):
 x=(i%2)*640;y=(i//2)*390;sheet.paste(im,(x,y));d.text((x+12,y+364),f'bell {i+1}: {h["t"]:.1f}s',fill=(240,200,140))
sheet.save(OUT/'ding_contact.jpg',quality=90)
run(['ffmpeg','-v','error','-y','-ss','19','-i',str(video),'-frames:v','1',str(OUT/'C_五打四_封面.png')])
report={'duration_seconds':174,'frames':5220,'width':1920,'height':1080,'fps':30,
 'bells':len(images),'silence_pcm_exact_zero':True,'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),
 'remaining_checks':'Read v4_qa metrics, v4_stutter and audio_final files; inspect ding_contact and full frames. Human ears were not used.'}
(OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
