from pathlib import Path
DOC=Path(__file__).resolve().parent
BASE=DOC.parents[2]
SRC=BASE/'video-engine/src/v4/lanchester'
DST=SRC/'native'
for name in ['index.ts','Root.tsx','data.ts','fontReady.ts','stills.mjs','Video.tsx']:
    text=(SRC/name).read_text(encoding='utf-8')
    text=text.replace("'../kit'","'../../kit'").replace("'../kit/","'../../kit/")
    text=text.replace("../../../public/v4/lanchester/","../../../../public/v4/lanchester/native/")
    text=text.replace("v4/lanchester/mix.wav","v4/lanchester/native/mix.wav")
    text=text.replace("src/v4/lanchester/index.ts","src/v4/lanchester/native/index.ts")
    if name=='stills.mjs':
        text=text.replace('const t0 = Date.now();','').replace('`${Date.now() - t0} ms`',"'done'")
    (DST/name).write_text(text,encoding='utf-8')
print('native sources copied')
