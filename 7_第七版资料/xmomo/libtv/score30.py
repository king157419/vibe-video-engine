# xmomo score + foley, numpy only. 120 bpm, D. Writes out/mix.wav (48 kHz stereo).
import numpy as np, soundfile as sf, os
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 30.0; N = int(SR * DUR); rng = np.random.default_rng(5)
L = np.zeros(N); R = np.zeros(N)
def add(sig, at, gain=1., pan=0.):
    i = int(at * SR)
    if i >= N: return
    sig = sig[:N - i]; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414; R[i:i + len(sig)] += sig * gain * r * 1.414
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(d, a=.01, r=.2):
    t = tt(d); return np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)
def lp(x, fc): return sosfilt(butter(2, fc / (SR / 2), output='sos'), x)
def bp(x, f1, f2): return sosfilt(butter(2, [f1 / (SR / 2), f2 / (SR / 2)], btype='band', output='sos'), x)
def pad(notes, d, a=.8, r=1.2, bright=.25):
    t = tt(d); o = np.zeros_like(t)
    for m in notes:
        f = hz(m)
        for det in (-.0025, .0025):
            ph = 2 * np.pi * f * (1 + det) * t
            o += np.sin(ph) + bright * np.sin(2 * ph) / 2 + bright * .5 * np.sin(3 * ph) / 3
    return o / len(notes) / 2 * env(d, a, r) * (1 + .06 * np.sin(2 * np.pi * .23 * t))
def bell(m, d=1.6, br=1.):
    t = tt(d); f = hz(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * np.exp(-t * 7) * 1.3 * br
    return (np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2) + .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 5)) * np.clip(t / .004, 0, 1)
def tick(hi):
    t = tt(.05); n = rng.standard_normal(len(t)) * np.exp(-t * 160)
    return bp(n, 1800, 5200) * .8 + .35 * np.sin(2 * np.pi * (2300 if hi else 1750) * t) * np.exp(-t * 110)
def kick():
    t = tt(.32); f = 48 + 70 * np.exp(-t * 38); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
def bass(m, d):
    t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)) * env(d, .02, .12)
def whoosh(d, f1=500, f2=5000):
    t = tt(d); return bp(rng.standard_normal(len(t)), f1, f2) * np.sin(np.pi * t / d) ** 2


# ---- 30 s structure (12_Copy_Music_Edit_EN.md) ----
# 0-7 cool: low drone + one tick per second
add(pad([38, 45], 7.6, 1.5, 1.2, .5), 0, .26)
add(pad([50, 53, 57], 7.4, 2., 1.2, .12), .2, .14)
for s in range(0, 7): add(tick(s % 2 == 0), s, .2, .25 if s % 2 else -.25)
# 0.5 soft low thud: serum lands on cotton
t = tt(.5); add(np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 9) + 45) / SR) * np.exp(-t * 9), .25, .5)
add(lp(rng.standard_normal(int(.25 * SR)) * np.exp(-tt(.25) * 30), 700), .25, .45)
# 7.0 airy sweep: light crosses the silk
add(whoosh(2.4, 700, 7000), 6.8, .16, -.3); add(whoosh(2.4, 700, 7000), 7.1, .12, .4)
CH = {7: [50, 54, 57, 61, 64], 9: [50, 54, 57, 61, 64], 11: [47, 54, 57, 62, 66], 13: [47, 50, 54, 57, 61], 15: [43, 50, 54, 59, 62],
      17: [50, 54, 57, 62, 64], 18.5: [49, 52, 57, 61, 64], 20: [47, 50, 54, 57, 62], 21.5: [43, 47, 50, 54, 59], 23: [45, 52, 55, 59, 61],
      24: [38, 45, 50, 54, 57, 61, 64, 69], 27: [38, 45, 50, 54, 57, 62, 66]}
ks = sorted(CH); END = 30.0
for i, k in enumerate(ks):
    e = ks[i + 1] if i + 1 < len(ks) else END
    rel = 2.6 if k == 27 else .6
    add(pad(CH[k], e - k + .5, .35 if k != 27 else .1, rel, .45), k, .46 if k < 24 else .52)
    add(pad([CH[k][0] - 12], e - k + .3, .2, .4 if k != 27 else 2.4, .6), k, .17)
ARP = [0, 2, 4, 3, 2, 4, 1, 3]
tq = 7.0
while tq < 26.8:
    k = max(x for x in ks if x <= tq + 1e-6); step = int(round((tq - 7) / .25)) % 8
    n = CH[k][ARP[step] % len(CH[k])] + 12 + (12 if step in (2, 5) else 0)
    add(bell(n, 1.1, .6), tq, .08 * (1 + .9 * min(1, (tq - 7) / 17)), np.sin(tq * 2.1) * .5); tq += .25
add(bell(86, 2.6, 1.2), 9.0, .34); add(bell(93, 2.2, .8), 9.0, .14)        # 9.0 glass chime: serum on silk
add(whoosh(2.0, 2000, 9000), 12.0, .07)                                     # the weave
tq = 12.0
while tq < 26.9:                                                            # 12-24 pulse bass, soft kick from 15
    k = max(x for x in ks if x <= tq + 1e-6); add(bass(CH[k][0] - 12, .42), tq, .17)
    if tq >= 15: add(kick(), tq, .22)
    tq += .5
for tr, n in ((15.0, 86), (18.0, 88), (21.0, 90)):                          # product bells
    add(bell(n, 2.2, 1.1), tr, .3); add(bell(n - 12, 2.2, .6), tr, .16); add(whoosh(1.2, 900, 8000), tr - .1, .1, -.4)
for j, n in enumerate([78, 81, 86, 88, 93]): add(bell(n, 3.0, 1.), 24 + j * .25, .22 - .02 * j, (-1) ** j * .35)   # 24 morning
add(whoosh(2.0, 800, 8000), 24.0, .1)
add(bell(86, 3.0, 1.), 27.0, .36); add(bell(74, 3.0, .6), 27.0, .18)      # 27 logo bell
M = np.stack([L, R], 1); M = np.tanh(M * 1.25) / 1.25
f = int(2.2 * SR); M[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
os.makedirs('libtv/out', exist_ok=True); sf.write('libtv/out/score30.wav', M.astype(np.float32), SR)
print('peak', round(float(np.abs(M).max()), 3), 'len', len(M) / SR)
