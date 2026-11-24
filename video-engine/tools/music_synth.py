"""用代码合成安静的氛围配乐（无版权素材、无采样、可复现）。

层次：低音持续音 + 慢起慢落的和弦铺底 + 稀疏的五声音阶拨弦 + 段落处的轻铃。
同样的参数和 seed 每次输出完全相同。

用法:
  python tools/music_synth.py out.wav --dur 180 --key D --mode major --bpm 70 --seed 7 \
      [--mood calm|warm|airy] [--marks 15.2,48,90.5] [--density 0.35]
--marks: 段落切换的秒数，会在这些点加一声轻铃并让拨弦稍停，方便和画面分段对齐。
输出 48 kHz 立体声 16-bit WAV，峰值约 -6 dBFS；最终响度在混音时统一。
"""
from __future__ import annotations

import argparse
import wave

import numpy as np

SR = 48000
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
SCALES = {
    "major": [0, 2, 4, 7, 9],      # 大调五声
    "minor": [0, 3, 5, 7, 10],     # 小调五声
    "lydian": [0, 2, 4, 6, 7, 9, 11],
}
PROGS = {  # 以音阶级数表示的和弦根音（半音偏移）与三和弦类型
    "major": [(0, "maj7"), (9, "m7"), (5, "maj7"), (7, "sus2")],
    "minor": [(0, "m7"), (8, "maj7"), (3, "maj7"), (10, "sus2")],
    "lydian": [(0, "maj7"), (2, "sus2"), (7, "maj7"), (9, "m7")],
}
CHORD = {"maj7": [0, 4, 7, 11], "m7": [0, 3, 7, 10], "sus2": [0, 2, 7, 14]}


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n: int, a: float, r: float) -> np.ndarray:
    t = np.arange(n) / SR
    dur = n / SR
    e = np.minimum(1.0, t / max(a, 1e-3))
    e *= np.clip((dur - t) / max(r, 1e-3), 0, 1)
    return e ** 1.5


def pad_voice(f: float, n: int, rng: np.random.Generator) -> np.ndarray:
    t = np.arange(n) / SR
    det = 1 + rng.uniform(-0.002, 0.002)
    ph = rng.uniform(0, 2 * np.pi)
    x = np.sin(2 * np.pi * f * t + ph) + 0.35 * np.sin(2 * np.pi * f * det * 2 * t + ph)
    x += 0.15 * np.sin(2 * np.pi * f * 3.001 * t)
    trem = 1 + 0.08 * np.sin(2 * np.pi * rng.uniform(0.07, 0.15) * t)
    return x * trem


def pluck(f: float, n: int) -> np.ndarray:
    t = np.arange(n) / SR
    e = np.exp(-t * 3.2) * np.minimum(1, t / 0.004)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 6) + 0.12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 9)
    return x * e


def bell(f: float, n: int) -> np.ndarray:
    t = np.arange(n) / SR
    parts = [(1, 1.0, 1.2), (2.76, 0.45, 2.0), (5.4, 0.25, 3.2), (8.93, 0.12, 4.5)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in parts)
    return x * np.minimum(1, t / 0.003)


def reverb(x: np.ndarray, mix: float = 0.35) -> np.ndarray:
    """简单的施罗德混响：4 个梳状 + 2 个全通，足够做空间感。"""
    out = np.zeros_like(x)
    for d_ms, g in [(29.7, 0.80), (37.1, 0.78), (41.1, 0.76), (43.7, 0.74)]:
        d = int(SR * d_ms / 1000)
        y = np.copy(x)
        for i in range(d, len(y), d):
            y[i:i + d] += g * y[i - d:i][: len(y[i:i + d])]
        out += y
    out /= 4
    for d_ms, g in [(5.0, 0.7), (1.7, 0.7)]:
        d = int(SR * d_ms / 1000)
        buf = np.concatenate([np.zeros(d), out])
        y = -g * out + buf[: len(out)]
        out = y
    return (1 - mix) * x + mix * out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--dur", type=float, required=True)
    ap.add_argument("--key", default="D")
    ap.add_argument("--mode", default="major", choices=list(SCALES))
    ap.add_argument("--bpm", type=float, default=70)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--mood", default="calm", choices=["calm", "warm", "airy"])
    ap.add_argument("--density", type=float, default=0.3, help="拨弦出现概率（每个八分音符）")
    ap.add_argument("--marks", default="", help="段落切换秒数，逗号分隔")
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    n = int(args.dur * SR)
    root = 48 + NOTE[args.key]  # C3 附近
    beat = 60 / args.bpm
    bar = 4 * beat
    marks = [float(m) for m in args.marks.split(",") if m.strip()]
    L = np.zeros(n)
    R = np.zeros(n)

    # 1) 低音持续音（跟和弦根音走）
    prog = PROGS[args.mode]
    chord_len = 4 * bar
    k = 0
    t0 = 0.0
    while t0 < args.dur:
        off, kind = prog[k % len(prog)]
        s = int(t0 * SR)
        m = min(n - s, int((chord_len + 2.5) * SR))
        if m <= 0:
            break
        base = root + off
        e = env_adsr(m, 2.5, 3.0)
        drone = np.sin(2 * np.pi * hz(base - 12) * np.arange(m) / SR) * e * 0.22
        L[s:s + m] += drone
        R[s:s + m] += drone
        # 2) 和弦铺底
        voices = [base + iv + (12 if args.mood == "airy" else 0) for iv in CHORD[kind]]
        for j, v in enumerate(voices):
            x = pad_voice(hz(v), m, rng) * e * (0.09 if args.mood != "warm" else 0.11)
            pan = 0.5 + (j - 1.5) * 0.18
            L[s:s + m] += x * (1 - pan)
            R[s:s + m] += x * pan
        t0 += chord_len
        k += 1

    # 3) 稀疏拨弦（五声音阶，避开段落切换前后 1.5 秒）
    scale = SCALES[args.mode]
    eighth = beat / 2
    t = 2 * bar
    last = 2
    while t < args.dur - 3:
        near = any(abs(t - mk) < 1.5 for mk in marks)
        if not near and rng.random() < args.density:
            step = int(np.clip(last + rng.integers(-2, 3), 0, len(scale) * 2 - 1))
            last = step
            midi = root + 24 + scale[step % len(scale)] + 12 * (step // len(scale))
            m = int(2.2 * SR)
            s = int(t * SR)
            m = min(m, n - s)
            x = pluck(hz(midi), m) * rng.uniform(0.05, 0.09)
            pan = rng.uniform(0.3, 0.7)
            L[s:s + m] += x * (1 - pan)
            R[s:s + m] += x * pan
        t += eighth

    # 4) 段落处的轻铃
    for mk in marks:
        s = int(mk * SR)
        if s >= n:
            continue
        m = min(int(4 * SR), n - s)
        x = bell(hz(root + 36 + scale[0]), m) * 0.06
        L[s:s + m] += x
        R[s:s + m] += x

    # 柔化 + 混响 + 淡入淡出
    L = reverb(L)
    R = reverb(R)
    fade_in = np.minimum(1, np.arange(n) / (SR * 3))
    fade_out = np.clip((n - np.arange(n)) / (SR * 4), 0, 1)
    L *= fade_in * fade_out
    R *= fade_in * fade_out
    peak = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
    g = 10 ** (-6 / 20) / peak
    stereo = np.stack([L * g, R * g], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(args.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {args.out} {args.dur:.1f}s key={args.key} mode={args.mode} bpm={args.bpm} seed={args.seed}")


if __name__ == "__main__":
    main()
