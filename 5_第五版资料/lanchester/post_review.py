"""Run after independent reviewer approves final.mp4; preserve previous phone preview."""
from pathlib import Path
import subprocess, shutil, sys, json, hashlib
BASE=Path(__file__).resolve().parents[2]
VE=BASE/'video-engine'; OUT=VE/'out/v4/lanchester'; DOC=Path(__file__).resolve().parent
py=sys.executable
def run(args,log):
 with (OUT/log).open('w',encoding='utf-8') as f:
  subprocess.run(args,cwd=VE,stdout=f,stderr=subprocess.STDOUT,check=True)
run([py,'-X','utf8',str(DOC/'verify.py')],'verify_final_approved.log')
run([py,'-X','utf8','tools/v4_qa.py',str(OUT/'final.mp4'),str(OUT/'qa_final_approved')],'qa_final_approved.log')
run([py,'-X','utf8','tools/v4_stutter.py',str(OUT/'final.mp4')],'stutter_final_approved.txt')
phone=OUT/'C_五打四_手机预览.mp4'
if phone.exists():
 old=OUT/'C_五打四_手机预览_铃声修正前.mp4'
 if old.exists():raise RuntimeError('Old phone backup exists; preserve explicitly before rerun')
 phone.rename(old)
base=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(OUT/'final.mp4'),'-vf','scale=1280:720',
 '-c:v','libx264','-preset','slow','-b:v','640k','-passlogfile','D:/tmp/v4lanchester/phone_C_final']
run(base+['-pass','1','-an','-f','null','NUL'],'phone_final_pass1.log')
run(base+['-pass','2','-c:a','aac','-b:a','96k','-ar','48000','-movflags','+faststart',str(phone)],'phone_final_pass2.log')
shutil.copy2(DOC/'发布文案.md',OUT/'C_五打四_发布文案.md')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(phone)],text=True,encoding='utf-8'))
(OUT/'phone_probe.json').write_text(json.dumps(probe,indent=2),encoding='utf-8')
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],v['nb_frames'])==(1280,720,'5220')
files=['final.mp4','C_五打四_手机预览.mp4','C_五打四_封面.png','C_五打四_发布文案.md']
manifest=[{'file':x,'bytes':(OUT/x).stat().st_size,'sha256':hashlib.sha256((OUT/x).read_bytes()).hexdigest()} for x in files]
(OUT/'delivery_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))
