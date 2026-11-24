"""Procedural 20,000-trial cloud: one indexed point per real result, four depth layers."""
from pathlib import Path
import hashlib,json,math,random
from PIL import Image,ImageDraw

DOC=Path(__file__).resolve().parent
BASE=DOC.parents[2]
PUB=BASE/'video-engine/public/v4/lanchester/native'
nums=json.loads((PUB/'numbers.json').read_text(encoding='utf-8'))
values=nums['open']['outcomes']
assert len(values)==20000 and sum(v>0 for v in values)==14295
SPACE_SEED=19161026+55073
rng=random.Random(SPACE_SEED)
layers=[Image.new('RGBA',(1920,780),(0,0,0,0)) for _ in range(4)]
draw=[ImageDraw.Draw(im) for im in layers]
points=[]
for i,result in enumerate(values):
    # Gaussian-like radial population with a wispy spiral twist. No grid or rectangular hull.
    u=(i+.5)/20000
    rad=math.sqrt(u)
    theta=i*math.pi*(3-math.sqrt(5))+.55*math.sin(i*.017)+rad*2.6
    warp=1+.085*math.sin(theta*3+rad*5)+.035*math.cos(theta*7)
    x=960+math.cos(theta)*rad*842*warp+rng.uniform(-2.6,2.6)
    y=370+math.sin(theta)*rad*298*(1+.09*math.cos(theta*4))+rng.uniform(-2.3,2.3)
    depth=rng.randrange(4)
    # Every trial stays nonzero, with soft irregular feathering rather than a solid plate edge.
    feather=max(.13,(1-rad*rad)**.55)
    alpha=round((95+depth*37)*feather)
    radius=.65+.3*depth+rng.random()*.48
    color=(255,166,63) if result>0 else (67,163,255)
    g=draw[depth]
    halo=radius*3.4
    g.ellipse((x-halo,y-halo,x+halo,y+halo),fill=(*color,max(2,round(alpha*.065))))
    g.ellipse((x-radius,y-radius,x+radius,y+radius),fill=(*color,alpha))
    points.append(dict(i=i,result=result,x=round(x,4),y=round(y,4),depth=depth,r=round(radius,4),alpha=alpha))
for i,im in enumerate(layers):im.save(PUB/f'cloud_{i}.png')
cloud=dict(n=20000,seed=SPACE_SEED,source_seed=19161026,gold=14295,blue=5705,rule='one point index per original outcome; spatial placement does not depend on winner',layers=4,points=points)
(PUB/'cloud_meta.json').write_text(json.dumps(cloud,separators=(',',':')),encoding='utf-8')
evidence=dict(n=len(points),gold=sum(p['result']>0 for p in points),blue=sum(p['result']<0 for p in points),min_alpha=min(p['alpha'] for p in points),
    min_x=min(p['x'] for p in points),max_x=max(p['x'] for p in points),min_y=min(p['y'] for p in points),max_y=max(p['y'] for p in points),
    layer_counts=[sum(p['depth']==i for p in points) for i in range(4)],all_indices_in_order=all(p['i']==i and p['result']==values[i] for i,p in enumerate(points)),
    cue_sha256=hashlib.sha256((PUB/'cue.json').read_bytes()).hexdigest())
assert evidence['all_indices_in_order'] and evidence['min_alpha']>0
(DOC/'点海修订验证.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
print(json.dumps(evidence,indent=2))
