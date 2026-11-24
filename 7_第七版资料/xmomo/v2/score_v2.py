# xmomo score v2: no noise sources at all (user: v1 hissed). Pure tones, bells an octave lower
# and softer, master low-passed at 7 kHz. Writes brand30.wav and ad15.wav (48 kHz stereo).
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(d, a=.01, r=.2):
    t = tt(d); return np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)
def lp(x, fc): return sosfilt(butter(2, fc / (SR / 2), output='sos'), x, axis=0)
def pad(notes, d, a=.8, r=1.2, bright=.18):
    t = tt(d); o = np.zeros_like(t)
    for m in notes:
        f = hz(m)
        for det in (-.002, .002):
            ph = 2 * np.pi * f * (1 + det) * t
            o += np.sin(ph) + bright * np.sin(2 * ph) / 2
    return o / len(notes) / 2 * env(d, a, r)
def bell(m, d=1.6, br=.5):
    t = tt(d); f = hz(m)
    mod = np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) * .8 * br
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.8) * np.clip(t / .012, 0, 1)
def kick():
    t = tt(.3); f = 45 + 50 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)
def bass(m, d):
    t = tt(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .2 * np.sin(4 * np.pi * f * t)) * env(d, .03, .15)
def thud():
    t = tt(.5); return np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 9) + 42) / SR) * np.exp(-t * 9)
class Mix:
    def __init__(s, dur): s.N = int(dur * SR); s.L = np.zeros(s.N); s.R = np.zeros(s.N); s.dur = dur
    def add(s, sig, at, g=1., pan=0.):
        i = int(at * SR)
        if i >= s.N: return
        sig = sig[:s.N - i]; l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
        s.L[i:i + len(sig)] += sig * g * l; s.R[i:i + len(sig)] += sig * g * r
    def write(s, path, fade=2.0):
        M = lp(np.stack([s.L, s.R], 1), 7000); M = np.tanh(M * 1.1) / 1.1
        f = int(fade * SR); M[-f:] *= np.linspace(1, 0, f)[:, None] ** 1.5
        M *= .7 / max(1e-9, np.abs(M).max()); sf.write(path, M.astype(np.float32), SR)
        print(path, 'peak', round(float(np.abs(M).max()), 3))
def warm(m, CH, t0, t1, arp_from, pulse_from, kick_from, arp_g=.06):
    ks = sorted(CH)
    for i, k in enumerate(ks):
        e = ks[i + 1] if i + 1 < len(ks) else t1
        m.add(pad(CH[k], e - k + .5, .4, .7), k, .42); m.add(pad([CH[k][0] - 12], e - k + .3, .3, .5, .3), k, .16)
    ARP = [0, 2, 4, 3, 2, 4, 1, 3]; tq = arp_from
    while tq < t1 - 1.5:
        k = max(x for x in ks if x <= tq + 1e-6); st = int(round((tq - arp_from) / .25)) % 8
        m.add(bell(CH[k][ARP[st] % len(CH[k])] + 12, 1.0, .4), tq, arp_g, np.sin(tq * 2.1) * .4); tq += .25
    tq = pulse_from
    while tq < t1 - 1.5:
        k = max(x for x in ks if x <= tq + 1e-6); m.add(bass(CH[k][0] - 12, .42), tq, .16)
        if tq >= kick_from: m.add(kick(), tq, .18)
        tq += .5
# ---------- brand film, 30 s ----------
m = Mix(30.)
m.add(pad([38, 45], 7.6, 1.5, 1.2, .3), 0, .26); m.add(pad([50, 53, 57], 7.4, 2., 1.2, .1), .2, .12)
m.add(thud(), .25, .45)
CH = {7: [50, 54, 57, 61, 64], 9: [50, 54, 57, 61, 64], 11: [47, 54, 57, 62, 66], 13: [47, 50, 54, 57, 61], 15: [43, 50, 54, 59, 62],
      17: [50, 54, 57, 62, 64], 18.5: [49, 52, 57, 61, 64], 20: [47, 50, 54, 57, 62], 21.5: [43, 47, 50, 54, 59], 23: [45, 52, 55, 59, 61],
      24: [38, 45, 50, 54, 57, 61, 64], 27: [38, 45, 50, 54, 57, 62, 66]}
warm(m, CH, 7, 30, 7, 12, 15)
m.add(bell(74, 2.6, .6), 9.0, .3)                                   # serum on silk
for tr, n in ((15, 74), (18, 76), (21, 78)): m.add(bell(n, 2.2, .5), tr, .24)
for j, n in enumerate([66, 69, 74, 76]): m.add(bell(n, 2.8, .5), 24 + j * .25, .18, (-1) ** j * .3)
m.add(bell(74, 3.0, .5), 27.0, .3); m.add(bell(62, 3.0, .3), 27.0, .15)
m.write('brand30.wav')
# ---------- ad, 15 s: 0-3 pain, 3-5 cotton, 5 silk turns warm, 9 product, 12 offer ----------
m = Mix(15.)
m.add(pad([38, 45], 5.4, .6, 1.0, .3), 0, .28); m.add(pad([50, 53, 57], 5.2, .8, 1.0, .1), 0, .12)
m.add(thud(), .25, .45)
for s in np.arange(0, 5, .5): m.add(bass(38 - 12, .3), s, .10)    # low heartbeat-like pulse, tone only
CH = {5: [50, 54, 57, 61, 64], 7: [47, 54, 57, 62, 66], 9: [43, 50, 54, 59, 62], 10.5: [45, 52, 57, 61, 64], 12: [38, 45, 50, 54, 57, 62, 66]}
warm(m, CH, 5, 15, 5, 7, 9, .055)
m.add(bell(74, 2.6, .6), 5.6, .3); m.add(bell(76, 2.2, .5), 9.0, .24); m.add(bell(74, 3.0, .5), 12.0, .3)
m.write('ad15.wav', 1.6)
