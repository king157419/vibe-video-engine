"""Archive final media probes, silence/loudness scans and every hit's full-size frame."""
from pathlib import Path
import hashlib
import json
import math
import subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'video-engine/out/v4/baobao'
video = out / 'final.mp4'
cue = json.loads((root/'video-engine/public/v4/baobao/cue.json').read_text(encoding='utf8'))

def run(args, filename):
    p = subprocess.run(args, capture_output=True, encoding='utf8', errors='replace')
    (out/filename).write_text(p.stdout+p.stderr, encoding='utf8')
    if p.returncode: raise RuntimeError(filename)
    return p.stdout+p.stderr

run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)], 'ffprobe_final.json')
run(['ffmpeg','-hide_banner','-nostats','-threads','2','-i',str(video),'-af','ebur128=peak=true','-f','null','-'], 'ebur128_final.txt')
run(['ffmpeg','-hide_banner','-nostats','-threads','2','-i',str(video),'-af','silencedetect=n=-60dB:d=0.4','-f','null','-'], 'silence_final.txt')
target = out/'hits_final'
target.mkdir(exist_ok=True)
items = []
for i,h in enumerate(cue['hits']):
    # The riser is keyed by its end (the deliberate cut).
    t = h['t']
    frame = math.ceil(t*30-1e-8)
    exact_time = frame/30
    path = target/f'{i+1:02d}_{t:.3f}_{h["type"]}.png'
    # Seek just before the timestamp so floating-point rounding cannot skip it.
    subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-ss',str(max(0,exact_time-0.000001)),'-i',str(video),'-frames:v','1',str(path)],check=True)
    for suffix, n in [('before',frame-1),('plus300ms',frame+9)]:
        subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-ss',str(max(0,n/30-0.000001)),'-i',str(video),'-frames:v','1',str(target/f'{i+1:02d}_{suffix}.png')],check=True)
    items.append({'t':t,'first_video_frame':frame,'first_frame_time':exact_time,'type':h['type'],'note':h.get('note'),'frame':str(path)})
for label,t in [('endmark',cue['dur']-1),('last',cue['dur']-1/30),('climax',194.6),('silence',195.7),('cover',18)]:
    subprocess.run(['ffmpeg','-v','error','-threads','2','-y','-ss',str(t),'-i',str(video),'-frames:v','1',str(target/f'{label}.png')],check=True)
(out/'hit_frames.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf8')
manifest = {'video':str(video),'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'bytes':video.stat().st_size,'expected_duration':cue['dur'],'expected_frames':round(cue['dur']*30),'silences':cue['silences'],'hits':len(cue['hits'])}
(out/'final_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
