# 混音：配乐 + 按材质做的拟音（泡泡、翻页、筷子碰碗、跷跷板、湿笔刷）+ 很轻的房间声 → out/mix.wav
# 不做蜡笔沙沙声（用户明确不要手写沙沙声）。
import sys, os, json, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', 'D:/tmp/lemo-opuscar')
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import SR, add, bp, lp, hp, brown, limit, compress

E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8')); DUR = E['dur']; EV = E['ev']; N = int(DUR * SR)
rng = np.random.default_rng(5)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def T(d): return np.arange(int(round(d * SR))) / SR
def fade(x, a=.005, b=.03):
    ia, ib = min(len(x), int(a * SR)), min(len(x), int(b * SR))
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x
def env(d, pts): k = np.array(pts, float); return np.interp(T(d), k[:, 0] * d, k[:, 1])

def pop(v=1.0):            # 泡泡冒出来：软的气泡声
    t = T(0.12); f = 380 + 900 * (1 - np.exp(-t / 0.02))
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.3 * v)
def paper_whoosh(d=0.9, v=1.0):   # 镜头在纸上移动：很轻的纸面风声
    n = nz(d); return fade(bp(n, 500, 3500) * np.sin(np.linspace(0, np.pi, len(n))) ** 2 * 0.05 * v, .05, .1)
def clink(v=1.0):          # 筷子碰瓷碗
    t = T(0.5); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / tau) * a for f, tau, a in [(2630, .12, 1), (4110, .07, .6), (6020, .04, .4), (1480, .18, .3)])
    return fade(x * 0.12 * v + bp(nz(0.5), 3000, 9000) * np.exp(-t / .004) * 0.08 * v, .0005, .05)
def bowl_tap(v=1.0):       # 一块肉落进碗里
    t = T(0.25); return fade((np.sin(2 * np.pi * 820 * t) * np.exp(-t / .05) * .5 + lp(nz(.25), 900) * np.exp(-t / .02)) * 0.12 * v)
def creak(v=1.0):          # 木头跷跷板吱呀
    d = 0.5; t = T(d); f0 = 140 + 60 * np.sin(np.pi * t / d)
    ph = np.cumsum(f0) / SR; saw = 2 * (ph % 1) - 1
    x = bp(saw * (1 + .6 * (rng.random(len(t)) < .02)), 500, 2400) * env(d, [(0, 0), (.2, 1), (.8, .7), (1, 0)])
    return fade(x * 0.07 * v)
def thump(v=1.0):          # 板子落地
    t = T(0.25); return fade((np.sin(2 * np.pi * 75 * t) * np.exp(-t / .06) + lp(nz(.25), 400) * np.exp(-t / .02) * .5) * .25 * v)
def brush(d, v=1.0):       # 湿笔刷扫过纸
    n = nz(d); wet = lp(n, 1800) * .5 + bp(n, 1800, 5000) * .15
    g = uniform_filter1d(np.abs(rng.standard_normal(len(n))), 400) * .6 + .7
    return fade(wet * g * env(d, [(0, 0), (.06, .9), (.4, 1), (.85, .8), (1, 0)]) * 0.10 * v, .05, .2)
def door(v=1.0):           # 门把手 + 门开
    t = T(0.6); x = bp(nz(.06), 1500, 5000) * np.exp(-T(.06) / .01)
    out = np.zeros(len(t)); out[:len(x)] += x * .3
    out += lp(nz(.6), 700) * env(.6, [(0, 0), (.3, .5), (1, 0)]) * .08
    return fade(out * v)

buf = np.zeros((N, 2))
def put(x, at, g=1.0, pan=0.0): add(buf, x.astype(np.float64), at, g, pan)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'pop': put(pop(), t, 1.0, .2)
    elif ty == 'pan': put(paper_whoosh(e['dur']), t, 1.0, 0)
    elif ty == 'chop': put(clink(), t, 1.0, -.2)
    elif ty == 'bowl': put(bowl_tap(), t, 1.0, .3)
    elif ty == 'creak': put(creak(), t - .1, 1.0, .5 if e['k'] % 2 else -.5); put(thump(.6), t + .05, 1.0, -.5 if e['k'] % 2 else .5)
    elif ty == 'brush': put(brush(e['dur'] + .3), t, 1.0, 0)
    elif ty == 'door': put(door(), t, 1.0, .5)

# 房间声：极轻，硬静音时也保留一点点（静音是音乐静，不是数字真空），但再压低
tt = np.arange(N) / SR
room = lp(brown(DUR), 300) * 0.006
sil = [(e['t'], e['t'] + e['dur']) for e in EV if e['type'] == 'silence']
g = np.ones(N)
for a, b in sil: g *= 1 - 0.7 * np.clip(np.minimum((tt - a) / .2, (b - tt) / .2), 0, 1)
buf[:, 0] += room * g; buf[:, 1] += np.roll(room, 700) * g

mus, sr = sf.read(os.path.join(HERE, 'out', 'score.wav')); assert sr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
out = mus * 0.9 + buf
out = np.stack([limit(out[:, 0], .95), limit(out[:, 1], .95)], 1)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
print('mix', DUR)
