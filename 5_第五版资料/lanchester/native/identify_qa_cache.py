"""Identify only this film's QA cache by its complete 35-frame fingerprint."""
from pathlib import Path
import hashlib,json,subprocess,sys

DOC=Path(__file__).resolve().parent
VE=DOC.parents[2]/'video-engine'
OUT=VE/'out/v4/lanchester/native'
ROOT=Path('D:/tmp').resolve()
def signature(folder):
    return [hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(folder.glob('f_*.jpg'))]
owned=[]
for name in ['draft_r1','final']:
    dst=OUT/f'qa_signature_{name}'
    dst.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(OUT/f'{name}.mp4'),'-vf','fps=1/5,scale=480:-2',str(dst/'f_%04d.jpg')],check=True)
    sig=signature(dst)
    for candidate in ROOT.glob('v4qa_*'):
        resolved=candidate.resolve()
        if resolved.parent!=ROOT or not resolved.name.startswith('v4qa_'): continue
        if len(sig)==35 and signature(resolved/'f5')==sig:
            owned.append({'path':str(resolved),'source':name,'frame_count':35,'fingerprints':sig})
(DOC/'缓存归属.json').write_text(json.dumps(owned,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:v for k,v in x.items() if k!='fingerprints'} for x in owned],ensure_ascii=False,indent=2))
