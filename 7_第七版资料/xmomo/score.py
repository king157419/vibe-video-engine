# xmomo score + foley, numpy only. 120 bpm, D. Writes out/mix.wav (48 kHz stereo).
import numpy as np, soundfile as sf, os
from scipy.signal import butter, sosfilt
SR = 48000; DUR = 36.0; N = int(SR * DUR); rng = np.random.default_rng(5)
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

CUT = 29.62   # everything stops here: hard silence until 31.5
# cold opening: drone + one tick per second
add(pad([38, 45], 9.6, 2., 1.2, .5), 0, .26)
add(pad([50, 53, 57], 9.4, 3., 1.5, .12), .2, .16)
for s in range(0, 30): add(tick(s % 2 == 0), s, .2 if s < 10 else .11, .25 if s % 2 else -.25)
# the drop lands on cotton (4.5): dull, low, falling
t = tt(.5); add(np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 9) + 45) / SR) * np.exp(-t * 9), 4.5, .55)
add(lp(rng.standard_normal(int(.25 * SR)) * np.exp(-tt(.25) * 30), 700), 4.5, .5)
add(pad([50, 53], 4., .05, 3.6, .1) * np.exp(-tt(4.) * .9), 4.6, .2)
# silk (10.0)
add(whoosh(2.6, 700, 7000), 10.0, .16, -.3); add(whoosh(2.6, 700, 7000), 10.3, .12, .4)
CH = {10: [50, 54, 57, 61, 64], 12: [50, 54, 57, 61, 64], 14: [47, 54, 57, 62, 66], 16: [47, 50, 54, 57, 61], 18: [43, 50, 54, 59, 62],
      20: [50, 54, 57, 62, 64], 21.5: [49, 52, 57, 61, 64], 23: [47, 50, 54, 57, 62], 24.5: [43, 47, 50, 54, 59], 26: [40, 47, 50, 55, 59], 28: [45, 52, 55, 59, 62]}
ks = sorted(CH)
for i, k in enumerate(ks):
    end = ks[i + 1] if i + 1 < len(ks) else CUT
    add(pad(CH[k], end - k + .5, .35, .6, .45), k, .46)
    add(pad([CH[k][0] - 12], end - k + .3, .2, .4, .6), k, .17)
ARP = [0, 2, 4, 3, 2, 4, 1, 3]
tq = 10.0
while tq < CUT - .2:
    k = max(x for x in ks if x <= tq + 1e-6); step = int(round((tq - 10) / .25)) % 8
    n = CH[k][ARP[step]] + 12 + (12 if step in (2, 5) else 0)
    add(bell(n, 1.1, .6), tq, .085 * (1 + .9 * min(1, (tq - 10) / 16)), np.sin(tq * 2.1) * .5); tq += .25
add(bell(86, 2.6, 1.2), 11.0, .34); add(bell(93, 2.2, .8), 11.0, .14)      # ding: the drop lands on silk
add(whoosh(2.2, 2000, 9000), 16.0, .07)                                     # threads
tq = 16.0
while tq < CUT - .3:
    k = max(x for x in ks if x <= tq + 1e-6); add(bass(CH[k][0] - 12, .42), tq, .17)
    if tq >= 20: add(kick(), tq, .26)
    tq += .5
for tr, n in ((20.0, 86), (23.0, 88), (26.0, 90)):                          # product reveals
    add(bell(n, 2.2, 1.1), tr, .3); add(bell(n - 12, 2.2, .6), tr, .16); add(whoosh(1.5, 900, 8000), tr, .13, -.4)
add(whoosh(.8, 1200, 6000), 24.25, .2, .3)                                  # bonnet spin
t = tt(1.6); add(bp(rng.standard_normal(len(t)), 400, 9000) * (t / 1.6) ** 2.2, 27.95, .2)   # riser
t = tt(.12); add(np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 20) + 38) / SR) * np.exp(-t * 18) * np.clip((.12 - t) / .03, 0, 1), 29.5, .9)   # blackout
i0 = int(CUT * SR); fo = int(.03 * SR); w = np.linspace(1, 0, fo)
for B in (L, R): B[i0 - fo:i0] *= w; B[i0:int(31.5 * SR)] = 0
# dawn (31.5): the fullest chord
add(pad([38, 45, 50, 54, 57, 61, 64, 69], 4.7, .12, 2.6, .34), 31.5, .62); add(pad([26], 4.6, .1, 2.4, .7), 31.5, .14)
for j, n in enumerate([78, 81, 86, 88, 93]): add(bell(n, 3.2, 1.), 31.5 + j * .25, .26 - .02 * j, (-1) ** j * .35)
add(whoosh(2.4, 800, 8000), 31.5, .12)
for s in range(0, 4): add(tick(s % 2 == 0), 32.5 + s, .07, .3)
M = np.stack([L, R], 1); M = np.tanh(M * 1.25) / 1.25
f = int(.9 * SR); M[-f:] *= np.linspace(1, 0, f)[:, None]
os.makedirs('out', exist_ok=True); sf.write('out/mix.wav', M.astype(np.float32), SR)
sp = np.abs(np.fft.rfft(M[:, 0])) ** 2; fr = np.fft.rfftfreq(N, 1 / SR)
print('peak', round(float(np.abs(M).max()), 3), 'share of energy below 150 Hz', round(float(sp[fr < 150].sum() / sp.sum()), 3))
