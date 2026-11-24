"""Reproducibility, exact audio silence and remux alignment checks for the delivered film."""
import pathlib,hashlib,json,subprocess,wave
import numpy as np
from scipy.signal import correlate,correlation_lags
ROOT=pathlib.Path(__file__).resolve().parents[2]
PUB=ROOT/'video-engine/public/v4/starry';OUT=ROOT/'video-engine/out/v4/starry'
names=['subs.json','cue.json','timeline_meta.json']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before={n:sha(PUB/n) for n in names}
subprocess.run([r'D:\conda\envs\d2l\python.exe','-X','utf8',str(pathlib.Path(__file__).with_name('timeline.py'))],check=True)
after={n:sha(PUB/n) for n in names}
assert before==after,'Generator is not reproducible'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUT/'final.mp4')]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],int(v['nb_frames']))==(1920,1080,7260)
assert abs(float(probe['format']['duration'])-242)<.05
with wave.open(str(PUB/'mix.wav')) as w:
 sr=w.getframerate();x=np.frombuffer(w.readframes(w.getnframes()),np.int16).reshape(-1,2)
assert not x[177*sr:180*sr].any(),'Planned silence contains nonzero samples'
# A three-second excerpt around the first bell includes asymmetrical texture,
# so cross-correlation will not confuse successive periods of a sustained tone.
start=14.5;dur=3
raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',str(OUT/'final.mp4'),'-t',str(dur),'-ar','48000','-ac','1','-f','f32le','-'])
y=np.frombuffer(raw,np.float32);ref=x[round(start*sr):round(start*sr)+len(y)].astype(np.float32).mean(axis=1)/32768
c=correlate(y,ref,mode='full',method='fft');lags=correlation_lags(len(y),len(ref),mode='full');mask=np.abs(lags)<=2400
lag=int(lags[mask][np.argmax(c[mask])])
result=dict(generator_reproducible=before==after,json_sha256=after,video=dict(width=v['width'],height=v['height'],frames=v['nb_frames'],duration=probe['format']['duration']),silence=dict(from_sec=177,to_sec=180,zero_samples_per_channel=3*sr),audio_lag_samples=lag,audio_lag_ms=lag/sr*1000,final_sha256=sha(OUT/'final.mp4'))
assert abs(lag)<=48,f'Unexpected audio alignment: {lag} samples'
(OUT/'probe_final.json').write_text(json.dumps(probe,ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False,indent=2))
