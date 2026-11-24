"""治愈插画风格的默认背景音乐：程序合成的「毛毡钢琴 + 柔和铺底」，无版权问题，可无缝循环。

用法（需要 numpy + scipy，例如 D:/conda/envs/d2l/python.exe）:
  python art-src/illustration/make_bgm.py
输出 public/styles/illustration/bgm.mp3（响度约 -24 LUFS，画面里再压到比人声低约 20 dB）。

和弦：D 大调 IV–V–iii–vi（Gmaj7 – Aadd9 – F#m7 – Bm7，「王道进行」），64 BPM，每个和弦 2 小节。
所有音符与混响都在环形缓冲里叠加（首尾相接），所以文件本身可以无缝 loop。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 64
BEAT = 60 / BPM
BAR = 4 * BEAT
CHORD_BARS = 2
CYCLES = 4

HERE = Path(__file__).resolve().parent
ENGINE = HERE.parent.parent
OUT_WAV = HERE / "bgm.wav"
OUT_MP3 = ENGINE / "public" / "styles" / "illustration" / "bgm.mp3"

rng = np.random.default_rng(20260930)

# (bass midi, right-hand chord tones low→high)
CHORDS = [
    (43, [62, 66, 69, 71, 74]),  # Gmaj7(9)
    (45, [64, 69, 71, 73, 76]),  # Aadd9
    (42, [61, 64, 66, 69, 73]),  # F#m7
    (47, [62, 66, 69, 71, 74]),  # Bm7
]

# 每小节的琶音型：(拍位, 和弦音序号)；稀疏，给人声留空间
PATTERNS = [
    [(0.0, 0), (1.5, 2), (2.5, 3), (3.5, 2)],
    [(0.5, 1), (1.5, 3), (3.0, 4)],
    [(0.0, 0), (1.0, 2), (2.0, 4), (3.0, 3)],
    [(0.5, 2), (2.0, 1), (3.5, 3)],
]

TOTAL = CYCLES * len(CHORDS) * CHORD_BARS * BAR
N = int(round(TOTAL * SR))
buf = np.zeros((2, N))


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig: np.ndarray, t0: float, pan: float) -> None:
    """环形叠加（-1 左 … +1 右，等功率声像）"""
    i0 = int(round(t0 * SR)) % N
    n = len(sig)
    gl = np.cos((pan + 1) * np.pi / 4)
    gr = np.sin((pan + 1) * np.pi / 4)
    idx = (np.arange(n) + i0) % N
    np.add.at(buf[0], idx, sig * gl)
    np.add.at(buf[1], idx, sig * gr)


def felt_piano(m: float, vel: float, length: float = 7.0) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    f0 = hz(m)
    tau = 2.4 * (262 / f0) ** 0.45  # 低音衰减更慢
    out = np.zeros_like(t)
    for k in range(1, 9):
        fk = k * f0 * np.sqrt(1 + 0.00035 * k * k)
        if fk > 5000:
            break
        # 毛毡音锤：高次谐波弱、力度越小越闷
        ak = (1 / k**1.7) * np.exp(-(k - 1) * (0.55 - 0.25 * vel))
        tk = tau / (1 + 0.55 * (k - 1))
        env = np.exp(-t / tk)
        ph = rng.uniform(0, 2 * np.pi)
        out += ak * env * (np.sin(2 * np.pi * fk * t + ph) + 0.8 * np.sin(2 * np.pi * fk * 1.0006 * t + ph * 1.3))
    attack = 1 - np.exp(-t / 0.012)
    release = np.clip((length - t) / 0.4, 0, 1)
    return out * attack * release * vel


def pad(ms: list[int], dur: float) -> np.ndarray:
    """柔和铺底：正弦 + 轻微失谐，慢起慢收"""
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for m in ms:
        f = hz(m)
        out += np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.0023 * t + 1.0)
        out += 0.15 * np.sin(2 * np.pi * 2 * f * t)
    swell = np.clip(t / 2.2, 0, 1) ** 1.5 * np.clip((dur - t) / 2.2, 0, 1) ** 1.5
    return out * swell / len(ms)


chord_len = CHORD_BARS * BAR
for c in range(CYCLES):
    for ci, (bass, tones) in enumerate(CHORDS):
        t_chord = (c * len(CHORDS) + ci) * chord_len
        # 左手：根音 + 五度，轻
        add(felt_piano(bass, 0.55, 8.0), t_chord + rng.normal(0, 0.006), -0.25)
        add(felt_piano(bass + 7, 0.32, 7.0), t_chord + BEAT * 2 + rng.normal(0, 0.008), -0.15)
        # 铺底：跨过和弦边界，交叉淡入淡出
        add(0.10 * pad([bass + 12, bass + 19, tones[1], tones[3]], chord_len + 2.2), t_chord - 1.1, 0.0)
        for b in range(CHORD_BARS):
            pat = PATTERNS[(c + ci * 2 + b) % len(PATTERNS)]
            if c == 0:
                pat = pat[:3]  # 第一轮更稀
            for beat, ti in pat:
                t = t_chord + b * BAR + beat * BEAT + rng.normal(0, 0.012)
                m = tones[ti]
                vel = float(np.clip(0.42 + 0.14 * rng.random() - 0.04 * ti, 0.25, 0.6))
                add(0.55 * felt_piano(m, vel), t, -0.35 + 0.14 * ti)
        # 偶尔一个高音点缀（后几轮）
        if c >= 1 and (ci + c) % 2 == 0:
            add(0.32 * felt_piano(tones[4] + 12, 0.35, 6.0), t_chord + BAR + BEAT * 2.5 + rng.normal(0, 0.01), 0.35)

# 混响：衰减噪声脉冲（立体声去相关）+ 早期反射，环形卷积 → 尾巴绕回开头，循环无缝
rt60 = 3.4
ir_len = int(4.5 * SR)
tt = np.arange(ir_len) / SR
lp = butter(2, 4200, btype="low", fs=SR, output="sos")
irs = []
for ch in range(2):
    noise = sosfilt(lp, rng.standard_normal(ir_len))
    ir = noise * np.exp(-6.9 * tt / rt60) * np.clip(tt / 0.03, 0, 1)
    for d, g in [(0.011, 0.5), (0.019 + 0.004 * ch, 0.35), (0.031, 0.28), (0.043 - 0.005 * ch, 0.2)]:
        ir[int(d * SR)] += g * 8
    ir /= np.sqrt(np.sum(ir**2))
    irs.append(ir)

wet = np.zeros_like(buf)
for ch in range(2):
    k = np.zeros(N)
    k[:ir_len] = irs[ch]
    wet[ch] = np.fft.irfft(np.fft.rfft(buf[ch]) * np.fft.rfft(k), n=N)

mix = 0.62 * buf + 0.55 * wet
# 去掉低频轰鸣和刺耳高频，让它安静地待在人声后面
hp = butter(2, 70, btype="high", fs=SR, output="sos")
lp2 = butter(2, 5500, btype="low", fs=SR, output="sos")
# 环形滤波：前面拼一段尾部做预热，保证循环点连续
pre = int(2 * SR)
for ch in range(2):
    x = np.concatenate([mix[ch, -pre:], mix[ch]])
    x = sosfilt(lp2, sosfilt(hp, x))
    mix[ch] = x[pre:]

mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.5

pcm = (mix.T * 32767).astype(np.int16)
import wave

with wave.open(str(OUT_WAV), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

print(f"wrote {OUT_WAV} ({TOTAL:.1f}s)")
# 静态增益（不用 loudnorm 的动态模式，避免抽吸感）：先量整体响度，再一次性调到 -24 LUFS
TARGET = -24.0
meas = subprocess.run(
    ["ffmpeg", "-hide_banner", "-nostats", "-i", str(OUT_WAV), "-af", "ebur128", "-f", "null", "-"],
    capture_output=True, text=True, encoding="utf-8", errors="replace",
).stderr
lufs = float([ln for ln in meas.splitlines() if ln.strip().startswith("I:")][-1].split()[1])
gain = TARGET - lufs
print(f"measured {lufs:.1f} LUFS, gain {gain:+.1f} dB")
subprocess.run(
    [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(OUT_WAV),
        "-af", f"volume={gain:.2f}dB,alimiter=limit=0.7:level=false",
        "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "160k", str(OUT_MP3),
    ],
    check=True,
)
print(f"wrote {OUT_MP3}")
sys.exit(0)
