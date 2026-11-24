# 配乐：F 大调 3/4，♩=96，一小节 1.875 秒。小木头乐器 + 金属齿乐器，不用钢琴和弦乐。
# 段落时间从 events.json 的 cue 读；每一声「变小」= 钟琴一个音，落在画面替换的那一帧。
# 用法：<LIB>/.venv/Scripts/python.exe score.py  → out/score.wav
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', 'D:/tmp/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit

E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8')); DUR = E['dur']; EV = E['ev']
BEAT = 60 / 96; BAR = BEAT * 3
cue = {e['id']: e['t'] for e in EV if e['type'] == 'cue'}
S.seed(7)

# 和声：8 小节一轮（每小节一个和弦，根音 MIDI）
PROG = [('F', [53, 57, 60]), ('C', [48, 52, 55]), ('Dm', [50, 53, 57]), ('Bb', [46, 50, 53]),
        ('F', [53, 57, 60]), ('C', [48, 52, 55]), ('Bb', [46, 50, 53]), ('F', [53, 57, 60])]
# 主题：每小节三拍，(拍, MIDI, 拍长)；None 为休止
THEME = [
  [(0, 69, 1), (1, 72, 2)], [(0, 67, 3)], [(0, 65, 1), (1, 69, 1), (2, 74, 1)], [(0, 72, 3)],
  [(0, 69, 1), (1, 72, 1), (2, 77, 1)], [(0, 76, 1), (1, 72, 2)], [(0, 74, 1), (1, 72, 1), (2, 70, 1)], [(0, 69, 3)],
]
ev = []
def note(t, inst, p, d, v, pan=0.0, g=1.0, **kw):
    if t < DUR - 0.05: ev.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g, **kw))

def bars(t0, t1):
    """t0 起每小节一个 (小节序号, 起点)"""
    k, t = 0, t0
    while t < t1 - 0.2: yield k, t; k += 1; t += BAR

def oompah(t0, t1, inst, v=.55, pan=-.25, oct_=0):   # 低音在一拍，和弦在二、三拍
    for k, t in bars(t0, t1):
        root, ch = PROG[k % 8][1][0], PROG[k % 8][1]
        note(t, inst, root - 12 + oct_, BEAT * 0.9, v, pan)
        for b in (1, 2):
            for j, m in enumerate(ch): note(t + b * BEAT + j * 0.012, inst, m + oct_, BEAT * 0.7, v * 0.7, pan + 0.1)

def arp(t0, t1, inst, v=.45, pan=.2):                 # 分解和弦，八分音符
    for k, t in bars(t0, t1):
        ch = PROG[k % 8][1]; seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1]]
        for i, m in enumerate(seq): note(t + i * BEAT / 2, inst, m, BEAT * 0.9, v * (1 if i == 0 else .8), pan)

def theme(t0, inst, v=.6, pan=0.0, n=8, oct_=0, stretch=1.0, start=0):
    for k in range(n):
        for (b, m, d) in THEME[(start + k) % 8]:
            note(t0 + (k * 3 + b) * BEAT * stretch, inst, m + oct_, d * BEAT * stretch * 0.95, v, pan)

def perc(t0, t1, v=.35):
    for k, t in bars(t0, t1):
        note(t, 'woodblock', 'a', None, v, -.4)
        note(t + BEAT, 'shaker', 'down', None, v * .6, .4); note(t + 2 * BEAT, 'shaker', 'up', None, v * .5, .4)

C = cue
# 开场：尤克里里（或尼龙吉他）+ 木鱼
PLUCK = 'ukulele'
try: S.load(PLUCK)
except Exception: PLUCK = 'harp'
oompah(0, C['title'], PLUCK, .5)
perc(BAR, C['title'], .25)
# 片名：竖笛吹主题前半句，不吹完
theme(C['title'] + 0.3, 'recorder', .55, 0, n=3)
arp(C['title'], C['one'], 'harp', .3)
# 第一章：最热闹，单簧管断奏接主题，沙锤
oompah(C['one'], C['two'], PLUCK, .5)
perc(C['one'], C['two'], .3)
t = C['one'] + 4 * BAR
while t < C['two'] - 8 * BAR: theme(t, 'clarinet_stac', .5, .2); t += 16 * BAR
# 第二章：尼龙吉他式分解和弦，轻；偶尔长笛一句
arp(C['two'], C['three'], 'guitar_nylon', .42)
t = C['two'] + 4 * BAR
while t < C['three'] - 4 * BAR: theme(t, 'flute', .35, .3, n=4); t += 12 * BAR
# 三格画：钟琴高八度慢慢敲主题
arp(C['three'], C['four'], 'harp', .3)
theme(C['three'] + 2 * BAR, 'vibraphone', .45, -.2, n=8)
# 第三章：单簧管长音，慢一倍；硬静音时全部停
theme(C['four'], 'clarinet', .45, 0, n=2, oct_=-12, stretch=2.0)
oompah(C['back'], C['five'], 'harp', .35, oct_=0)
theme(C['back'] + 2 * BAR, 'clarinet', .45, .1, n=8, oct_=-12)
t = C['back'] + 12 * BAR
# 第四章：跷跷板，尤克里里 + 钟琴
oompah(C['five'], C['wash'] - 0.1, PLUCK, .5)
perc(C['five'] + 2 * BAR, C['wash'] - BAR, .22)
theme(C['five'] + 2 * BAR, 'recorder', .45, -.1, n=4, start=4)
# 水彩：前面留一拍空，然后主题第一次完整吹完
w0 = C['wash'] + 0.9
theme(w0, 'recorder', .6, 0, n=8)
theme(w0, 'glockenspiel', .35, .3, n=8, oct_=12)
arp(w0, w0 + 8 * BAR, 'harp', .4)
# 尾声：尤克里里轻轻弹到最后一个 F 和弦
tail0 = w0 + 8 * BAR
oompah(tail0, DUR - 2.5, PLUCK, .4)
for j, m in enumerate([53, 57, 60, 65]): note(DUR - 2.4 + j * 0.06, PLUCK, m, 2.2, .5, -.1)
note(DUR - 2.4, 'glockenspiel', 81, 2.2, .35, .3)

# 硬静音：把落在静音窗里的音全部拿掉
sil = [(e['t'], e['t'] + e['dur']) for e in EV if e['type'] in ('silence', 'breath')]
ev = [e for e in ev if not any(a - 0.3 < e['t'] < b for a, b in sil)]
# 每一声变小：钟琴；变大：竖笛短音（都在画面替换那一帧）
for e in EV:
    if e['type'] == 'shrink': note(e['t'], 'glockenspiel', 84, 1.5, .62, .2, 1.3)
    if e['type'] == 'grow': note(e['t'], 'recorder', 72, .5, .55, -.1)
    if e['type'] == 'reveal': note(e['t'], 'glockenspiel', 89, 3.0, .6, 0, 1.2)
    if e['type'] == 'bassoon':
        note(e['t'], 'bassoon_stac', 50, .3, .6, .3); note(e['t'] + .3, 'bassoon_stac', 46, .3, .6, .3); note(e['t'] + .6, 'bassoon_stac', 41, .6, .65, .3)

mix = S.render([dict(e) for e in ev], dur=DUR)
mix = S.room(mix, size=.35, mix=.16)
for a, b in sil:   # 混响尾巴也切掉：真的静
    i, j = int((a + 0.15) * SR), int(b * SR); mix[i:j] *= 0
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mix, SR)
print('score', DUR, 'notes', len(ev), 'pluck', PLUCK)
