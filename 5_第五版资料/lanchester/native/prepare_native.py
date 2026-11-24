"""Fork the existing production snapshot without touching its author's files."""
from pathlib import Path
import hashlib
import json

DOC=Path(__file__).resolve().parent
BASE=DOC.parents[2]
ORIG=DOC.parent
src=BASE/'video-engine/src/v4/lanchester'
dst=src/'native'
dst.mkdir(parents=True,exist_ok=True)
g=(ORIG/'generate.py').read_text(encoding='utf-8')
g=g.replace('parents[2]','parents[3]')
g=g.replace("video-engine/public/v4/lanchester'","video-engine/public/v4/lanchester/native'")
g=g.replace('20000结果压缩成2000显示点，每点10局','20000个真实结果点，每点对应1局')
g=g.replace('七处bell','七处bell')
g=g.replace('五章阶梯：','序章加五章：')
g=g.replace("(PUB/(name+'.json')).write_text", "(PUB/(name+'.json')).write_text")
g += '''
from PIL import Image, ImageDraw
im=Image.new('RGBA',(1600,700),(0,0,0,0))
dr=ImageDraw.Draw(im)
for i,v in enumerate(open_result['outcomes']):
    x,y=(i%200)*8+4,(i//200)*7+3
    col=(242,181,107,230) if v>0 else (117,189,232,230)
    dr.ellipse((x-1,y-1,x+1,y+1),fill=col)
im.save(PUB/'results.png')
assert len(open_result['outcomes'])==20000
assert sum(v>0 for v in open_result['outcomes'])==14295
assert abs(open_result['gold_survivors_if_win']-3.623504721930745)<1e-9
(DOC/'生成验证.json').write_text(json.dumps(dict(seed=SEED,n=N,gold_wins=14295,gold_pct=open_result['gold_win_pct'],gold_survivors_if_win=open_result['gold_survivors_if_win'],points=20000,grid=[200,100],one_point_one_trial=True,frames=174*30),ensure_ascii=False,indent=2),encoding='utf-8')
'''
(DOC/'generate.py').write_text(g,encoding='utf-8')
for name in ['事实核查.md','发布文案.md','mix.py']:
    (DOC/name).write_text((ORIG/name).read_text(encoding='utf-8'),encoding='utf-8')
(DOC/'制作来源.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [ORIG/'generate.py',src/'Video.tsx']},indent=2),encoding='utf-8')
print('native generator copied; original unchanged')
