"""Render is a prerequisite. Mux, verify and collect reviewable evidence in the native branch."""
from pathlib import Path
import json,os,subprocess,sys,wave,re,tempfile,runpy
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
VE=ROOT/'video-engine'; OUT=VE/'out/v4/starry/native'; PUB=VE/'public/v4/starry/native'
TMP=Path('D:/tmp/v4starry-native');TMP.mkdir(parents=True,exist_ok=True)
os.environ['TEMP']=str(TMP);os.environ['TMP']=str(TMP)
os.chdir(VE)
def run(name,args):
 p=subprocess.run(args,capture_output=True,text=True,encoding='utf8',errors='replace')
 (OUT/name).write_text(p.stdout+'\n'+p.stderr,encoding='utf8')
 if p.returncode:raise RuntimeError(f'{name} failed; see log')
 return p.stdout+'\n'+p.stderr
video=OUT/'final.mp4'
run('mux.log',['ffmpeg','-hide_banner','-nostats','-y','-i',str(OUT/'final_render.mp4'),'-i',str(PUB/'mix.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-movflags','+faststart',str(video)])
run('ffprobe.json',['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,nb_frames,r_frame_rate,pix_fmt,color_space,color_range,sample_rate,bit_rate:format=duration,size','-of','json',str(video)])
# Keep the QA tool's transient frames entirely in this branch's task-owned temp directory.
original=tempfile.mkdtemp
def owned_temp(*args,**kwargs):
 kwargs['dir']=str(TMP);kwargs['prefix']='v4qa_owned_'
 return original(*args,**kwargs)
tempfile.mkdtemp=owned_temp
sys.argv=['v4_qa.py',str(video),str(OUT/'qa_final')]
runpy.run_path(str(VE/'tools/v4_qa.py'),run_name='__main__')
stutter=run('stutter_final.txt',[sys.executable,'-X','utf8',str(VE/'tools/v4_stutter.py'),str(video)])
run('ebur128.txt',['ffmpeg','-hide_banner','-nostats','-i',str(video),'-af','ebur128=peak=true','-f','null','-'])
run('silencedetect.txt',['ffmpeg','-hide_banner','-nostats','-i',str(video),'-af','silencedetect=n=-60dB:d=0.4','-f','null','-'])
meta=json.loads((PUB/'timeline_meta.json').read_text(encoding='utf8'))
frames=sorted(set([0,90,360,540,3990,4890,5310,5317,5355,5400,6480,7010,7220]+[round(h['t']*30) for h in meta['hits']]))
target=OUT/'final_frames';target.mkdir(exist_ok=True)
for f in frames:
 run(f'grab_{f}.log',['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(f/30),'-i',str(video),'-frames:v','1',str(target/f'f_{f}.png')])
run('cover.log',['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','18','-i',str(video),'-frames:v','1',str(OUT/'封面.png')])
with wave.open(str(PUB/'mix.wav')) as w:
 sr=w.getframerate();pcm=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).reshape(-1,2)
 a,b=meta['silence'];silent=pcm[round(a*sr):round(b*sr)]
 au={'sample_rate':sr,'duration':len(pcm)/sr,'silence':[a,b],'silence_samples':len(silent),'silence_max_sample':int(np.abs(silent.astype(np.int32)).max()),'freeze_count':len(re.findall(r'\bFREEZE\b',stutter)),'pop_count':len(re.findall(r'\bPOP\b',stutter)),'hits':meta['hits']}
 (OUT/'audio_checks.json').write_text(json.dumps(au,ensure_ascii=False,indent=2),encoding='utf8')
assert au['freeze_count']==0,au
assert au['silence_max_sample']==0,au
print(json.dumps(au,ensure_ascii=False,indent=2))
