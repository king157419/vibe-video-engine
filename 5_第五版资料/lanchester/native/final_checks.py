"""After the native full render: remux without -shortest, then collect evidence."""
from pathlib import Path
import json,subprocess,sys,wave
import numpy as np
from PIL import Image,ImageDraw

DOC=Path(__file__).resolve().parent
BASE=DOC.parents[2]
VE=BASE/'video-engine'
OUT=VE/'out/v4/lanchester/native'
PUB=VE/'public/v4/lanchester/native'
PY=sys.executable
def run(cmd,log):
    with (OUT/log).open('w',encoding='utf-8') as f:
        subprocess.run([str(x) for x in cmd],stdout=f,stderr=subprocess.STDOUT,check=True,cwd=VE)
run(['ffmpeg','-y','-i',OUT/'final_render.mp4','-i',PUB/'mix.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart',OUT/'final.mp4'],'mux_final.log')
run([PY,'-X','utf8','tools/v4_qa.py',OUT/'final.mp4',OUT/'qa_final'],'qa_final.log')
run([PY,'-X','utf8','tools/v4_stutter.py',OUT/'final.mp4'],'stutter_final.txt')
run(['ffmpeg','-hide_banner','-nostats','-i',OUT/'final.mp4','-af','ebur128=peak=true','-f','null','NUL'],'audio_final_ebur128.txt')
run(['ffmpeg','-hide_banner','-nostats','-i',OUT/'final.mp4','-af','silencedetect=n=-60dB:d=0.4','-f','null','NUL'],'audio_final_silence.txt')
p=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT/'final.mp4')],capture_output=True,text=True,check=True)
(OUT/'probe_final.json').write_text(p.stdout,encoding='utf-8')
cue=json.loads((PUB/'cue.json').read_text(encoding='utf-8'))
frames=OUT/'hit_frames';frames.mkdir(exist_ok=True)
hits=[(float(h['t'])+.12,h['note']) for h in cue['hits'] if h['type']=='bell']
for i,(t,note) in enumerate(hits):
    run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',OUT/'final.mp4','-frames:v','1',frames/f'bell_{i+1:02}_{t:.2f}.png'],f'grab_hit_{i+1:02}.log')
for t in [0,53.7,57,93,136.6,138,170.7,173]:
    run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',OUT/'final.mp4','-frames:v','1',frames/f'key_{t:.2f}.png'],f'grab_key_{t:.2f}.log')
run(['ffmpeg','-v','error','-y','-ss','19','-i',OUT/'final.mp4','-frames:v','1',OUT/'cover.png'],'grab_cover.log')
paths=list(frames.glob('bell*.png'))
im=Image.new('RGB',(3*640,3*390),(8,10,15));d=ImageDraw.Draw(im)
for i,path in enumerate(paths):
    x,y=(i%3)*640,(i//3)*390
    im.paste(Image.open(path).convert('RGB').resize((640,360)),(x,y+25))
    d.text((x+10,y+5),path.stem,fill=(230,210,160))
im.save(OUT/'bell_contact.jpg',quality=92)
w=wave.open(str(PUB/'mix.wav'));sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),np.int16).reshape(-1,2);w.close()
zero=int(np.max(np.abs(x[int(136.5*sr):int(139.5*sr)].astype(np.int32))))
assert zero==0
metrics=json.loads((OUT/'qa_final/metrics.json').read_text())
scan=(OUT/'stutter_final.txt').read_text(encoding='utf-8')
assert 'FREEZE' not in scan
assert not metrics['freezes_over_8s'] and 8<=metrics['lum_mean']<=15 and metrics['edge_mean_pct']<=4
(DOC/'最终验证.json').write_text(json.dumps(dict(metrics=metrics,zero_samples_peak=zero,silence=[136.5,139.5],bell_frames=len(hits),stutter=scan,render_frames=5220),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False,indent=2));print(scan);print('FINAL_CHECKS_PASS')
