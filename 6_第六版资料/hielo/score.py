# 《多年以后》配乐：D 大调，84 拍/分，4/4。尼龙吉他 + 手风琴 + 响棒，往哥伦比亚的暖走，不用合成器长音。
# 所有时间从 video-engine/public/v4/hielo/timeline.json 读（和画面同一份时间轴）。
# 每一声叮都对着画面上的一个重点（见 timeline.py 的 EV）。硬静音段连混响尾巴一起清零。
# 用法：D:/tmp/lemo-opuscar/.venv/Scripts/python.exe score.py → video-engine/public/v4/hielo/music.wav
import sys, os, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', 'D:/tmp/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.normpath(os.path.join(HERE, '..', '..', 'video-engine', 'public', 'v4', 'hielo'))
J = json.load(open(os.path.join(PUB, 'timeline.json'), encoding='utf-8'))
DUR, T, EV, TY = J['dur'], J['T'], J['EV'], J['TYPE']
S.seed(11)

BEAT = 60 / 84; BAR = BEAT * 4
CH = {'D': [50, 54, 57], 'Bm': [47, 50, 54], 'G': [43, 47, 50], 'A': [45, 49, 52], 'Em': [40, 43, 47], 'F#': [42, 46, 49], 'A7': [45, 49, 52, 55]}
WARM = ['D', 'Bm', 'G', 'A']
TENSE = ['Bm', 'G', 'Em', 'F#']
# 主题（手风琴）：拍位, MIDI, 拍长
THEME = [[(0, 66, 1), (1, 69, 1), (2, 71, 1), (3, 69, 1)], [(0, 66, 1), (1, 64, 1), (2, 62, 2)],
         [(0, 64, 1), (1, 66, 1), (2, 69, 1), (3, 71, 1)], [(0, 69, 3), (3, 66, 1)],
         [(0, 67, 1), (1, 71, 1), (2, 74, 1), (3, 71, 1)], [(0, 69, 1), (1, 66, 1), (2, 64, 2)],
         [(0, 62, 1), (1, 64, 1), (2, 66, 1), (3, 64, 1)], [(0, 62, 4)]]

ev = []
def note(t, inst, p, d, v, pan=0.0, g=1.0):
    if -0.01 <= t < DUR - 0.05: ev.append(dict(t=max(0.0, t), inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g))
def bars(t0, t1):
    k, t = 0, t0
    while t < t1 - 0.3: yield k, t; k += 1; t += BAR

def guitar_arp(t0, t1, prog, v=.42, pan=-.15):
    for k, t in bars(t0, t1):
        c = CH[prog[k % len(prog)]]; r = c[0] + 12
        seq = [r - 12, r + (c[1] - c[0]), r + (c[2] - c[0]), r + 12, r + (c[2] - c[0]), r + (c[1] - c[0]) + 12, r + (c[2] - c[0]), r + (c[1] - c[0])]
        for i, m in enumerate(seq): note(t + i * BEAT / 2, 'guitar_nylon', m, BEAT * 1.4, v * (1.0 if i == 0 else .78), pan)
def bass(t0, t1, prog, v=.5):
    for k, t in bars(t0, t1):
        c = CH[prog[k % len(prog)]]
        note(t, 'contrabass_pizz', c[0] - 12 if c[0] > 45 else c[0], BEAT * 1.5, v, .05)
        note(t + 2 * BEAT, 'contrabass_pizz', c[2] - 12 if c[2] > 52 else c[2], BEAT * 1.2, v * .8, .05)
def clave(t0, t1, v=.3):   # 3-2 son clave
    for k, t in bars(t0, t1):
        hits = [0, 3, 6] if k % 2 == 0 else [2, 4]
        for h in hits: note(t + h * BEAT / 2, 'claves', None, None, v, .35)
def tick(t0, t1, v0=.25, v1=.45, speed0=2, speed1=4):   # 炸弹的钟：越来越快
    t = t0
    while t < t1:
        u = (t - t0) / max(.01, t1 - t0)
        note(t, 'claves', None, None, v0 + (v1 - v0) * u, -.3)
        t += BEAT / (speed0 + (speed1 - speed0) * u)
def theme(t0, inst, v=.5, pan=.1, n=8, oct_=0, start=0):
    for k in range(n):
        for (b, m, d) in THEME[(start + k) % 8]: note(t0 + (k * 4 + b) * BEAT, inst, m + oct_, d * BEAT * .95, v, pan)
def pad(t0, t1, inst, chord, v=.25, pan=0.0):
    for m in CH[chord]: note(t0, inst, m + 12, t1 - t0, v, pan)
def ding(t, p='D6', inst='glockenspiel', v=.55, pan=.1):
    note(t, inst, p, 2.0, v, pan, 1.1)

# ---------- 序：每打出一个中文字，吉他一个音 ----------
tw = TY['proZh']; chars = ''.join(tw['lines'])
MEL = {0: [69, 74, 78, 76, 74, 69, 71, 74, 76, 74, 71],                    # 第一行：D
       1: [71, 74, 78, 74, 71, 67, 71, 74, 79, 78, 74, 71, 74, 76, 74, 71, 67],  # 第二行：Bm → G
       2: [69, 73, 76, 73, 69, 64, 69, 73, 76, 78, 76, 73, 69, 74, 78, 81, 78, 74]}  # 第三行：A → D
gi = 0
for li, line in enumerate(tw['lines']):
    for ci, ch in enumerate(line):
        t = tw['t0'] + gi / tw['cps']; gi += 1
        if ch in '，。·':
            note(t, 'harp', MEL[li][ci % len(MEL[li])] - 24, 1.6, .4, -.2)
            continue
        note(t, 'guitar_nylon', MEL[li][ci % len(MEL[li])], 1.2, .38 + .1 * (ci % 2 == 0), .1 * ((ci % 3) - 1))
pad(0.6, T['title'] + 0.8, 'accordion', 'D', .13, -.1)
# 打完到片名之间：吉他慢慢分解 D 和弦，不留空
for i, m in enumerate([62, 66, 69, 74, 69, 66, 69, 74]): note(tw['t1'] + 2.2 + i * BEAT * .8, 'guitar_nylon', m, 1.6, .3, .15 * ((i % 3) - 1))
# 三个词亮起：金、玫瑰、冰（三声，对着三个词）
for k, (p, inst) in enumerate([('A5', 'vibraphone'), ('F#5', 'vibraphone'), ('D6', 'glockenspiel')]):
    note(tw['t1'] + 0.4 + 0.5 * k, inst, p, 1.8, .45, .2 - .2 * k)
# 片名：竖琴往上一扫 → 定音鼓 + 管钟
for i, m in enumerate([50, 54, 57, 62, 66, 69, 74, 78, 81, 86]):
    note(T['title'] + 0.3 + i * (EV['titleHit'] - T['title'] - 0.4) / 10, 'harp', m, 1.4, .35 + .03 * i, -.3 + .06 * i)
note(EV['titleHit'], 'timpani', 'D2', 3.0, .75, 0, 1.2)
note(EV['titleHit'], 'tubular_bells', 'D5', 4.0, .6, .1)
note(EV['titleHit'], 'contrabass', 'D2', 3.5, .5, 0)
pad(EV['titleHit'], T['title_end'] + 0.5, 'accordion', 'D', .18, 0)

# ---------- 一 · 三个时间：慢波莱罗 ----------
c1 = T['jump3'] - 0.3
guitar_arp(c1, T['ch2'], WARM, .4)
bass(c1 + BAR, T['ch2'], WARM, .42)
clave(c1 + 2 * BAR, T['camus'], .18)
theme(T['camus'] + 0.2, 'accordion', .32, .2, n=4)
ding(EV['landF'], 'A5', 'glockenspiel', .55, .4)
ding(EV['landP'], 'D6', 'hand_chimes', .6, -.4)
for m in [74, 78, 81]: note(EV['three'], 'vibraphone', m, 2.5, .45, 0)
note(T['verb'] + 1.3, 'harp', 'A5', 1.2, .4, .3); note(T['verb'] + 2.5, 'harp', 'D4', 1.5, .4, -.3)
note(T['prolep'] + 0.8, 'flute', 'A5', 2.4, .32, .2)

# ---------- 二 · 炸弹：B 小调，钟在走 ----------
c2 = T['bomb1'] - 0.2
for k, t in bars(c2, EV['flash15s'] - 0.1): note(t, 'cellos_pizz', CH[TENSE[k % 4]][0], BEAT, .45, -.1)
tick(c2 + 0.5, EV['flash15s'] - 0.05, .18, .3, 2, 2)
note(EV['flash15s'], 'timpani', 'D2', 2.0, .8, 0, 1.2); note(EV['flash15s'], 'crash', None, None, .35, .2)
guitar_arp(T['bomb3'] - 0.2, T['ch7'], TENSE, .32, -.2)
bass(T['bomb3'] - 0.2, EV['hush'] - 0.1, TENSE, .45)
tick(T['bomb3'], EV['hush'] - 0.05, .2, .42, 2, 6)
ding(EV['ding15m'], 'B5', 'tubular_bells', .55, .1)
for i in range(6):   # 翻六页：竖琴各扫一下
    tt = T['ch7'] + 0.2 + i * (EV['page7'] - T['ch7'] - 0.2) / 6
    for j, m in enumerate([59, 62, 66, 71]): note(tt + j * 0.04, 'harp', m + 2 * i, .8, .3, .2)
for m in [35, 47, 54]: note(EV['page7'], 'cellos', m + 12, EV['hush'] - EV['page7'], .42, -.1)
note(EV['page7'], 'timpani', 'F#2', 2.0, .6, 0)
for i in range(int((EV['hush'] - EV['page7']) / (BEAT / 2))):   # 定音鼓滚奏渐强，到静音那一帧断
    tt = EV['page7'] + 1.0 + i * BEAT / 4
    if tt < EV['hush'] - 0.05: note(tt, 'timpani', 'F#2', .3, .2 + .4 * (tt - EV['page7']) / (EV['hush'] - EV['page7']), 0, .8)
# 他活了下来：吉他单音落回 D
for i, m in enumerate([66, 69, 74, 78]): note(T['lived'] + i * BEAT, 'guitar_nylon', m, 2.0, .45, .1)
note(T['lived'] + 4 * BEAT, 'harp', 'D3', 3, .4, -.2)

# ---------- 三 · 冰：手风琴主题，暖起来 ----------
c3 = T['whyice'] - 0.3
guitar_arp(c3, EV['clickIn'] - 0.1, ['D', 'G', 'Bm', 'A'], .36)
bass(c3 + 2 * BAR, EV['clickIn'] - 0.1, ['D', 'G', 'Bm', 'A'], .38)
theme(T['tropic'], 'accordion', .4, .15, n=8)
for i, m in enumerate([62, 66, 69, 74, 78, 81]): note(EV['iceReveal'] + i * .07, 'harp', m, 1.6, .42, -.3 + .1 * i)
ding(EV['iceReveal'], 'D6', 'glockenspiel', .6, .2)
for m in [62, 66, 69, 74]: note(EV['trueIgnite'], 'vibraphone', m + 12, 3, .45, 0)
ding(EV['grandmaReveal'], 'A5', 'hand_chimes', .5, -.2)
# 标题党：铜管「当当当」，然后长号往下泄气
for k in range(3):
    for m in [62, 65, 69]: note(EV['clickIn'] + k * .32, 'trumpet_stac', m + 12, .25, .65, .2)
    note(EV['clickIn'] + k * .32, 'timpani', 'D2', .5, .55, 0)
for i, m in enumerate([58, 57, 56, 55, 53, 50]): note(T['deadpan'] - 0.3 + i * .12, 'trombone', m - 12, .18 if i < 5 else .9, .45, -.2)
for i, m in enumerate([62, 66, 69]): note(T['deadpan'] + 0.4 + i * BEAT, 'guitar_nylon', m + 12, 2.0, .42, .1)
# 平平地说完到第四章：手风琴垫着，吉他慢慢走到 G，不留空
pad(T['deadpan'] + 1.0, T['bogota'] + 1.2, 'accordion', 'G', .14, 0)
for i, m in enumerate([67, 71, 74, 79, 74, 71, 67, 74]): note(T['deadpan'] + 2.6 + i * BEAT * .9, 'guitar_nylon', m, 1.6, .3, .15 * ((i % 3) - 1))

# ---------- 四 · 第一句会传染：越来越热闹，满屏时整团进来 ----------
c4 = T['bogota'] - 0.2
guitar_arp(c4, EV['bedFlip'], ['G', 'D', 'A', 'D'], .32)
for i, m in enumerate([67, 74, 79, 74, 67]): note(EV['bedFlip'] + i * .09, 'violins_pizz', m, .3, .5, .3)   # 床被掀起来：拨弦「嘣」
note(EV['bedFlip'] + 0.95, 'woodblock', 'a', None, .5, .3)
guitar_arp(EV['bedFlip'] + 0.6, EV['spectacle'], ['G', 'A', 'D', 'D'], .36)
bass(T['twenty'], EV['spectacle'], ['G', 'A', 'D', 'D'], .42)
for i in range(8): note(T['twenty'] + 0.4 + i * (1.8 / 8), 'harp', 62 + [0, 4, 7, 12, 16, 19, 24, 28][i], 1.0, .35, -.3 + .08 * i)
ding(T['twenty'] + 2.2, 'D6', 'glockenspiel', .5, .1)
# 满屏：昆比亚律动
sp0, sp1 = EV['spectacle'], T['memes'] + 9.0
note(sp0, 'crash', None, None, .5, .1); note(sp0, 'timpani', 'D2', 2.5, .8, 0)
for k, t in bars(sp0, sp1):
    c = CH[['D', 'G', 'A', 'D'][k % 4]]
    for b in range(4):
        tb = t + b * BEAT
        note(tb, 'contrabass_pizz', c[0] - 12 if b % 2 == 0 else c[2] - 12, BEAT * .9, .55, 0)
        for j, m in enumerate(c): note(tb + BEAT / 2 + j * .015, 'guitar_nylon', m + 12, BEAT * .4, .42, -.25)
        note(tb, 'shaker', 'down', None, .32, .4); note(tb + BEAT / 2, 'shaker', 'up', None, .28, .4)
        note(tb + BEAT / 2, 'conga', 'conga', None, .35, -.4)
        if b == 3: note(tb + BEAT / 2, 'conga', 'quinto', None, .4, -.4)
    clave(t, t + BAR, .25)
theme(sp0 + 0.2, 'accordion', .55, .15, n=4)
theme(sp0 + 0.2, 'glockenspiel', .28, .3, n=2, oct_=12)
theme(T['memes'], 'accordion', .45, .15, n=3, start=4)

# ---------- 五 · 收尾：慢下来，最后最暖 ----------
c5 = T['wall'] - 0.3
guitar_arp(c5, T['quote'], ['Bm', 'G', 'D', 'A'], .3)
pad(T['iceagain'], T['memoir'] + 2, 'violas', 'D', .22, -.1)
ding(T['iceagain'] + 0.3, 'D6', 'hand_chimes', .5, -.3)
guitar_arp(T['quote'], T['yours'] + 1.5, WARM, .38)
bass(T['quote'] + BAR, T['yours'] + 1.5, WARM, .4)
pad(T['quote'] + 0.5, EV['quoteDone'] + 2.5, 'violins', 'D', .2, .2)
pad(T['quote'] + 0.5, EV['quoteDone'] + 2.5, 'cellos', 'D', .25, -.2)
theme(T['quote'] + 2 * BAR, 'accordion', .45, .1, n=4)
ding(EV['quoteDone'], 'D6', 'tubular_bells', .55, 0)
for i, m in enumerate([62, 66, 69, 74, 78]): note(EV['quoteDone'] + i * .08, 'harp', m, 2, .4, -.2 + .1 * i)
# 填空：只剩吉他泛音一样的单音，等你填
for i, m in enumerate([78, 74, 69, 74, 78, 81, 78, 74]): note(T['blank'] + 0.6 + i * BEAT * 1.5, 'guitar_nylon', m, 2.0, .3, .1 * ((i % 3) - 1))
pad(T['closing'], DUR, 'accordion', 'D', .15, 0)
ding(EV['finalGlint'], 'D7', 'glockenspiel', .55, .1)
for j, m in enumerate([50, 57, 62, 66, 69, 74]): note(EV['finalGlint'] + j * .05, 'guitar_nylon', m, 3.5, .5, -.2 + .08 * j)
note(EV['finalGlint'], 'harp', 'D3', 3.5, .45, 0)

# ---------- 硬静音 ----------
sil = [(EV['hush'], EV['hushEnd'])]
ev = [e for e in ev if not any(a - 0.05 < e['t'] < b for a, b in sil)]
mix = S.render(ev, dur=DUR)
mix = S.room(mix, size=.42, mix=.17)
for a, b in sil:
    i, j = int(a * SR), int(b * SR); mix[i:j] *= 0
    k = int(0.03 * SR); mix[i - k:i] *= np.linspace(1, 0, k)[:, None]
fi = int(1.6 * SR); fo = int(3.0 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(PUB, 'music.wav'), mix.astype(np.float32), SR)
print('music', DUR, 'notes', len(ev))
