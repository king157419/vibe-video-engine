"""按「配乐表」用代码合成一段电影感配乐（无采样、可复现）。

为什么重写：旧的 music_synth.py 是一层不变的铺底 + 随机拨弦，没有起伏。
这个类型（vibe知识大赏）的配乐是主角：有动机、有段落、有渐强、高潮后会突然静音、片尾最响。

乐器：felt piano（加法合成，带非谐泛音和琴槌声）、弦乐铺底（多声部失谐锯齿波表）、
低音（跟和弦根音走，随段落强弱起伏）、心跳脉冲、FM 铃（「叮」）、低频轰鸣（片名）、
上升噪声（转场）、硬静音（高潮后的休止）。卷积混响（合成脉冲响应）。

用法（需要 scipy；用 D:\\conda\\envs\\d2l\\python.exe）:
  python tools/score.py cue.json out.wav
配乐表格式见文件末尾 EXAMPLE。所有时间单位是秒。
"""
from __future__ import annotations

import json
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
SCALE = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10],
         "dorian": [0, 2, 3, 5, 7, 9, 10], "lydian": [0, 2, 4, 6, 7, 9, 11]}
ROMAN = {"i": 0, "ii": 1, "iii": 2, "iv": 3, "v": 4, "vi": 5, "vii": 6}


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


class Rng:
    def __init__(self, seed: int):
        self.g = np.random.default_rng(seed)

    def u(self, a=0.0, b=1.0):
        return float(self.g.uniform(a, b))


# ---------------------------------------------------------------- harmony
def chord_tones(sym: str, key_pc: int, mode: str) -> list[int]:
    """'i' 'VI' 'iv7' 'V' 'IIIadd9' 'isus2' -> 相对调主音的半音（以根音所在八度为 0 附近）。"""
    s = sym
    ext = ""
    for e in ("add9", "sus2", "sus4", "maj7", "7", "9"):
        if s.endswith(e):
            ext, s = e, s[: -len(e)]
            break
    flat = s.startswith("b")
    if flat:
        s = s[1:]
    deg = ROMAN[s.lower()]
    sc = SCALE[mode]
    root = sc[deg] - (1 if flat else 0)
    # 三和弦的三音、五音按调内音取（自然和声），大写强制大三、小写强制小三
    third = (sc[(deg + 2) % 7] - sc[deg]) % 12
    fifth = (sc[(deg + 4) % 7] - sc[deg]) % 12
    if s.isupper():
        third = 4
    elif s.islower():
        third = 3
    if fifth not in (6, 7, 8):
        fifth = 7
    tones = [0, third, fifth]
    if ext == "sus2":
        tones = [0, 2, 7]
    elif ext == "sus4":
        tones = [0, 5, 7]
    elif ext == "add9":
        tones = [0, third, fifth, 14]
    elif ext == "maj7":
        tones = [0, third, fifth, 11]
    elif ext == "7":
        tones = [0, third, fifth, 10]
    elif ext == "9":
        tones = [0, third, fifth, 10, 14]
    return [root + t for t in tones]


# ---------------------------------------------------------------- instruments
def env_ar(n: int, a: float, r: float) -> np.ndarray:
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    e = e * np.clip((n / SR - t) / max(r, 1e-4), 0, 1)
    return e


def piano(f: float, dur: float, vel: float, rng: Rng) -> np.ndarray:
    """Felt piano：非谐泛音 + 两段式衰减 + 三弦失谐 + 琴槌噪声。dur 是按键时长，之后自然衰减 1.5 s。"""
    tail = 1.6
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    B = 0.00035
    low = np.clip((60 - 12 * np.log2(f / 261.6)) / 60, 0.3, 1.6)  # 低音衰减更慢
    out = np.zeros(n)
    nparts = 14 if f < 400 else 9
    bright = 0.55 + 0.6 * vel
    for k in range(1, nparts + 1):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        amp = (1.0 / k ** (1.35 - 0.35 * bright)) * (0.6 if k == 2 else 1.0)
        d1 = (2.2 + 0.9 * k) / low
        d2 = (0.35 + 0.12 * k) / low
        e = 0.55 * np.exp(-t * d1) + 0.45 * np.exp(-t * d2)
        det = [1.0, 1.0007, 0.9994] if 180 < f < 1200 else [1.0]
        part = sum(np.sin(2 * np.pi * fk * dd * t + rng.u(0, 6.28)) for dd in det) / len(det)
        out += amp * e * part
    # 按键松开后的阻尼
    rel = np.ones(n)
    k0 = int(dur * SR)
    if k0 < n:
        rel[k0:] = np.exp(-np.arange(n - k0) / SR * 4.5)
    att = np.minimum(1.0, t / 0.006)
    out *= rel * att
    # 琴槌（柔和，毡锤）
    hn = int(0.03 * SR)
    hammer = rng.g.standard_normal(hn) * np.exp(-np.arange(hn) / SR * 160) * 0.02 * vel
    out[:hn] += sosfilt(butter(2, [200, 2500], "bandpass", fs=SR, output="sos"), hammer)
    return out * vel * 0.32


_SAW = {}


def saw_table(nharm: int) -> np.ndarray:
    if nharm not in _SAW:
        L = 4096
        ph = np.arange(L) / L * 2 * np.pi
        _SAW[nharm] = sum(np.sin(k * ph) / k for k in range(1, nharm + 1)) * 0.6
    return _SAW[nharm]


def pad_voice(f: float, n: int, bright: float, rng: Rng) -> np.ndarray:
    """失谐锯齿合唱：5 个声部，带慢速颤音；bright 控制泛音数。"""
    nharm = int(np.clip(bright * 24, 3, max(3, 9000 / f)))
    tab = saw_table(nharm)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for dc in (-0.011, -0.005, 0.0, 0.005, 0.011):
        vib = 1 + 0.0018 * np.sin(2 * np.pi * rng.u(4.2, 5.6) * t + rng.u(0, 6.28))
        ph = np.cumsum(f * (1 + dc / 2) * vib / SR) + rng.u(0, 1)
        out += np.interp((ph % 1.0) * 4096, np.arange(4096), tab)
    return out / 5


def bell(f: float, dur: float, gain: float) -> np.ndarray:
    """FM 铃：清亮的「叮」。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = 2.2 * np.exp(-t * 3.0)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * idx
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 1.6)
    x += 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 2.4)
    return x * np.minimum(1, t / 0.002) * gain


def boom(dur: float, gain: float, rng: Rng) -> np.ndarray:
    """片名用的低频轰鸣：下滑正弦 + 低通噪声。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = 34 + 46 * np.exp(-t * 3.0)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 0.9)
    nz = sosfilt(butter(2, 180, "lowpass", fs=SR, output="sos"), rng.g.standard_normal(n)) * np.exp(-t * 2.5) * 0.6
    return (x + nz) * np.minimum(1, t / 0.01) * gain


def riser(dur: float, gain: float, rng: Rng) -> np.ndarray:
    """转场前的上升气息：逐段带通的噪声 + 指数渐强，在 dur 末尾结束。"""
    n = int(dur * SR)
    out = np.zeros(n)
    seg = int(0.05 * SR)
    noise = rng.g.standard_normal(n + seg)
    for i in range(0, n, seg):
        p = i / n
        lo, hi = 300 + 3000 * p ** 2, 900 + 9000 * p ** 2
        sos = butter(2, [lo, min(hi, 20000)], "bandpass", fs=SR, output="sos")
        out[i:i + seg] = sosfilt(sos, noise[i:i + seg + seg])[:len(out[i:i + seg])]
    env = (np.arange(n) / n) ** 2.6
    return out * env * gain * 0.5


def thump(gain: float) -> np.ndarray:
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    fr = 48 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 9) * np.minimum(1, t / 0.003) * gain


# ---------------------------------------------------------------- reverb
def make_ir(rt60: float, rng: Rng, bright: float = 0.5) -> np.ndarray:
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / rt60)
    irs = []
    for ch in range(2):
        nz = rng.g.standard_normal(n) * decay
        nz = sosfilt(butter(1, 2500 + 6000 * bright, "lowpass", fs=SR, output="sos"), nz)
        pre = int(0.018 * SR)
        nz = np.concatenate([np.zeros(pre), nz])[:n]
        # 早期反射
        for d, g in ((0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.2)):
            k = int((d + 0.003 * ch) * SR)
            nz[k] += g
        irs.append(nz / np.sqrt(np.sum(nz ** 2)))
    return np.stack(irs, 1)


def convolve_st(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    L = fftconvolve(x[:, 0], ir[:, 0])[: len(x)]
    R = fftconvolve(x[:, 1], ir[:, 1])[: len(x)]
    return np.stack([L, R], 1)


# ---------------------------------------------------------------- arrangement
def smooth_curve(points: list[tuple[float, float]], n: int, ramp: float) -> np.ndarray:
    """分段常数 → 用 ramp 秒的余弦过渡连起来的增益曲线。"""
    g = np.zeros(n)
    for i, (t0, v) in enumerate(points):
        a = int(t0 * SR)
        b = int(points[i + 1][0] * SR) if i + 1 < len(points) else n
        g[a:b] = v
    k = int(ramp * SR)
    if k > 1:
        w = np.hanning(2 * k + 1)
        w /= w.sum()
        g = fftconvolve(g, w, mode="same")
    return g


def add(buf: np.ndarray, x: np.ndarray, start: int, pan: float = 0.5, gain: float = 1.0):
    if start >= len(buf) or len(x) == 0:
        return
    if start < 0:
        x = x[-start:]
        start = 0
    m = min(len(x), len(buf) - start)
    l = np.cos(pan * np.pi / 2)
    r = np.sin(pan * np.pi / 2)
    buf[start:start + m, 0] += x[:m] * l * gain
    buf[start:start + m, 1] += x[:m] * r * gain


def render(cue: dict) -> np.ndarray:
    rng = Rng(cue.get("seed", 7))
    dur = float(cue["dur"])
    n = int(dur * SR)
    key_pc = NOTE[cue.get("key", "D")]
    mode = cue.get("mode", "minor")
    bpm = float(cue.get("bpm", 70))
    beat = 60 / bpm
    base = 48 + key_pc  # C3 区
    sections = cue["sections"]

    dry_piano = np.zeros((n, 2))
    dry_pad = np.zeros((n, 2))
    dry_low = np.zeros((n, 2))
    dry_fx = np.zeros((n, 2))

    for si, sec in enumerate(sections):
        t0, t1 = float(sec["t0"]), float(sec["t1"])
        chords = sec.get("chords", ["i"])
        bpc = float(sec.get("bars_per_chord", 2))
        chord_len = bpc * 4 * beat
        lay = sec.get("layers", {})
        pat = sec.get("piano", "sparse")
        density = float(sec.get("density", 0.5))
        reg = int(sec.get("register", 0))
        vel0 = float(sec.get("velocity", 0.55))
        motif = sec.get("motif") or cue.get("motif") or [[0, 1], [2, 1], [4, 2]]
        t = t0
        ci = 0
        while t < t1 - 0.05:
            cl = min(chord_len, t1 - t)
            tones = chord_tones(chords[ci % len(chords)], key_pc, mode)
            # ---- 弦乐铺底
            if lay.get("pad", 0) > 0:
                m = int((cl + 2.5) * SR)
                e = env_ar(m, float(sec.get("pad_attack", 1.8)), 2.6)
                voicing = [base + tones[0] - 12, base + tones[0], base + tones[1] + 12, base + tones[2]] + \
                          ([base + tones[3]] if len(tones) > 3 else [])
                for j, v in enumerate(voicing):
                    x = pad_voice(hz(v + 12 * reg), m, float(sec.get("pad_bright", 0.35)), rng) * e
                    add(dry_pad, x, int(t * SR), pan=0.25 + 0.5 * (j / max(1, len(voicing) - 1)), gain=lay["pad"] * 0.16)
            # ---- 低音：根音，两个八度下，柔和
            if lay.get("low", 0) > 0:
                m = int((cl + 1.5) * SR)
                tt = np.arange(m) / SR
                f = hz(base + tones[0] - 12)
                x = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * env_ar(m, 1.2, 1.4)
                add(dry_low, x, int(t * SR), gain=lay["low"] * 0.30)
            # ---- 钢琴
            if lay.get("piano", 0) > 0:
                pv = lay["piano"]
                step = beat / 2 if pat in ("arp", "arp8") else beat / 4 if pat == "arp16" else beat
                nsteps = int(cl / step + 1e-6)
                arp = [0, 2, 1, 3, 2, 1]
                vtones = [base + 12 + tones[0], base + 12 + tones[2], base + 24 + tones[1], base + 24 + tones[0],
                          base + 24 + tones[2]]
                if pat == "chordal":
                    for b in range(0, nsteps, 4):
                        for k, v in enumerate([base + tones[0], base + 12 + tones[1], base + 12 + tones[2]]):
                            add(dry_piano, piano(hz(v + 12 * reg), 3.0, vel0 * pv * (0.9 - 0.1 * k), rng),
                                int((t + b * step + 0.012 * k) * SR), pan=0.45 + 0.05 * k)
                elif pat == "motif":
                    tm = t
                    sc = SCALE[mode]
                    for deg, beats_ in motif:
                        if tm >= t + cl - 0.05:
                            break
                        if deg is not None:
                            d = int(deg)
                            pc = sc[d % 7] + 12 * (d // 7)
                            v = base + 24 + pc + 12 * reg
                            add(dry_piano, piano(hz(v), beats_ * beat * 0.95, vel0 * pv, rng), int(tm * SR), pan=0.55)
                        tm += float(beats_) * beat
                    # 左手根音
                    add(dry_piano, piano(hz(base + tones[0] + 12 * reg), cl * 0.8, vel0 * pv * 0.55, rng),
                        int(t * SR), pan=0.4)
                else:  # sparse / arp
                    for s in range(nsteps):
                        if pat == "sparse" and rng.u() > density:
                            continue
                        idx = arp[s % len(arp)] if pat != "sparse" else int(rng.u(0, len(vtones)))
                        v = vtones[idx % len(vtones)] + 12 * reg
                        accent = 1.0 if s % 4 == 0 else 0.78
                        add(dry_piano, piano(hz(v), step * 1.8, vel0 * pv * accent * rng.u(0.85, 1.0), rng),
                            int((t + s * step + rng.u(0, 0.008)) * SR), pan=0.35 + 0.3 * (idx / 4))
            # ---- 心跳
            if lay.get("pulse", 0) > 0:
                nb = int(cl / beat + 1e-6)
                for b in range(nb):
                    add(dry_low, thump(lay["pulse"] * (1.0 if b % 2 == 0 else 0.6)), int((t + b * beat) * SR))
            t += cl
            ci += 1

    # ---- 点位事件
    for h in cue.get("hits", []):
        typ, tt, g = h["type"], float(h["t"]), float(h.get("gain", 1.0))
        if typ == "bell":
            midi = base + 36 + SCALE[mode][int(h.get("deg", 0)) % 7]
            add(dry_fx, bell(hz(midi), 5.0, 0.22 * g), int(tt * SR), pan=float(h.get("pan", 0.5)))
        elif typ == "ding":
            midi = base + 48 + SCALE[mode][int(h.get("deg", 4)) % 7]
            add(dry_fx, bell(hz(midi), 2.5, 0.12 * g), int(tt * SR), pan=float(h.get("pan", 0.5)))
        elif typ == "boom":
            add(dry_fx, boom(float(h.get("len", 5.0)), 0.55 * g, rng), int(tt * SR))
        elif typ == "riser":
            L = float(h.get("len", 3.0))
            add(dry_fx, riser(L, 0.5 * g, rng), int((tt - L) * SR))
        elif typ == "sour":
            # 一个刺耳但不吵的「错音」：小二度 + 三全音的钢琴簇音，音高在 len 秒里往下塌（像唱片被拖慢）
            L = float(h.get("len", 0.9))
            m = int(L * SR)
            tt_ = np.arange(m) / SR
            sag = 1 - 0.06 * (tt_ / L) ** 1.5
            root = base + 24 + int(h.get("semi", 0))
            x = np.zeros(m)
            for k, iv in enumerate((0, 1, 6, 13)):
                f0 = hz(root + iv)
                ph = 2 * np.pi * np.cumsum(f0 * sag) / SR
                x += (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.exp(-tt_ * (2.5 + k))
            x *= np.minimum(1, tt_ / 0.004) * np.clip((L - tt_) / 0.08, 0, 1)
            add(dry_piano, x * 0.16 * g, int(tt * SR), pan=0.5)
        elif typ == "note":
            add(dry_piano, piano(hz(int(h["midi"])), float(h.get("len", 2.0)), 0.6 * g, rng), int(tt * SR),
                pan=float(h.get("pan", 0.5)))

    # ---- 分层混响
    ir_long = make_ir(float(cue.get("rt60", 3.6)), rng, 0.45)
    ir_mid = make_ir(2.2, rng, 0.6)
    wet_fx = convolve_st(dry_fx, ir_long) * 0.6
    # 静音之后不让转场音效的混响尾巴「漏」回来：从静音起点到终点后 3 s 压掉
    for a, b in cue.get("silences", []):
        ia, ib = int(a * SR), min(n, int((b + 3.0) * SR))
        wet_fx[ia:ib] *= np.clip((np.arange(ib - ia) - (int(b * SR) - ia)) / (3.0 * SR), 0, 1)[:, None] * 0
    wet = (convolve_st(dry_piano, ir_mid) * 0.42 + convolve_st(dry_pad, ir_long) * 0.55 +
           wet_fx + convolve_st(dry_low, ir_mid) * 0.15)
    mix = dry_piano * 0.85 + dry_pad * 0.6 + dry_low * 0.9 + dry_fx * 0.7 + wet

    # ---- 段落总音量（intensity）与淡入淡出
    pts = [(float(s["t0"]), float(s.get("intensity", 0.7))) for s in sections]
    g = smooth_curve(pts, n, float(cue.get("ramp", 1.5)))
    mix *= g[:, None]
    fi = float(cue.get("fade_in", 1.0))
    fo = float(cue.get("fade_out", 4.0))
    tt = np.arange(n) / SR
    mix *= np.clip(tt / max(fi, 1e-3), 0, 1)[:, None] * np.clip((dur - tt) / max(fo, 1e-3), 0, 1)[:, None]

    # ---- 硬静音（高潮后的休止）：连混响尾巴一起切掉，结束时 0.25 s 淡回
    for a, b in cue.get("silences", []):
        ia, ib = int(a * SR), int(b * SR)
        k = int(0.012 * SR)
        mix[ia:ib] = 0
        if ia - k > 0:
            mix[ia - k:ia] *= np.linspace(1, 0, k)[:, None]
        kb = int(0.25 * SR)
        if ib + kb < n:
            mix[ib:ib + kb] *= np.linspace(0, 1, kb)[:, None]

    # ---- 母带：高通 28 Hz，柔性限幅，峰值 -3 dBFS（响度在混音阶段统一）
    mix = sosfilt(butter(2, 28, "highpass", fs=SR, output="sos"), mix, axis=0)
    pk = np.max(np.abs(mix)) + 1e-9
    mix = mix / pk * 1.15
    mix = np.tanh(mix) / np.tanh(1.15)
    mix *= 10 ** (-3 / 20)
    return mix


def write_wav(path: str, x: np.ndarray):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


EXAMPLE = {
    "dur": 60, "key": "D", "mode": "minor", "bpm": 66, "seed": 3, "rt60": 3.8,
    "motif": [[4, 1], [2, 0.5], [0, 0.5], [2, 2]],
    "sections": [
        {"t0": 0, "t1": 14, "chords": ["i", "VI"], "piano": "sparse", "density": 0.3,
         "layers": {"piano": 0.8, "pad": 0.25}, "intensity": 0.5},
        {"t0": 14, "t1": 34, "chords": ["i", "VI", "III", "VII"], "bars_per_chord": 1, "piano": "arp",
         "layers": {"piano": 0.7, "pad": 0.5, "low": 0.5}, "intensity": 0.75},
        {"t0": 34, "t1": 46, "chords": ["iv", "VI", "VII", "i"], "bars_per_chord": 1, "piano": "arp16",
         "layers": {"piano": 0.8, "pad": 0.8, "low": 0.8, "pulse": 0.4}, "intensity": 1.0, "pad_bright": 0.5},
        {"t0": 47.5, "t1": 60, "chords": ["VI", "i"], "piano": "motif",
         "layers": {"piano": 0.9, "pad": 0.6, "low": 0.6}, "intensity": 0.95},
    ],
    "hits": [{"type": "boom", "t": 14.0}, {"type": "bell", "t": 14.0, "deg": 0},
             {"type": "riser", "t": 46.0, "len": 4}, {"type": "ding", "t": 30.0}],
    "silences": [[46.0, 47.5]],
}

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        cue = json.load(open(sys.argv[1], encoding="utf-8"))
        out = sys.argv[2]
    else:
        cue, out = EXAMPLE, "score_example.wav"
    x = render(cue)
    write_wav(out, x)
    print(f"wrote {out} {cue['dur']}s")
