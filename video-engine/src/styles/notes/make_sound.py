"""生成「读书笔记」样式自带的垫乐和两个小音效（一次性离线生成，结果放在 public/styles/notes/）。

全部由程序合成（无采样、无第三方音乐），没有版权问题；固定随机种子，可重复生成。
- bed.m4a   ：~58s 可无缝循环的“毛毡钢琴 + 柔和铺底”，F 大调、66 BPM，16 小节
- swipe.wav ：荧光笔刷过纸面的“沙——”（很轻）
- paper.wav ：卡片贴到纸上的轻响（纸面滑动 + 一下闷声）

用法（需要 numpy；编码 m4a 需要系统里有 ffmpeg）：
    D:/conda/envs/d2l/python.exe src/styles/notes/make_sound.py
"""
from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parents[3] / "public" / "styles" / "notes"
rng = np.random.default_rng(20260930)

BPM = 66
BEAT = 60 / BPM
BAR = BEAT * 4

# ---------- 和声（F 大调，16 小节） ----------
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name: str, octave: int) -> int:
    return 12 * (octave + 1) + NOTE[name]


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# (低音, 和弦音列表：从低到高，用于右手分解和弦与铺底)
CHORDS = [
    ("F", ["F", "A", "C", "E"]),
    ("A", ["A", "C", "E", "G"]),
    ("D", ["D", "F", "A", "C"]),
    ("Bb", ["Bb", "D", "F", "A"]),
    ("A", ["F", "A", "C", "E"]),  # Fmaj7/A
    ("G", ["G", "Bb", "D", "F"]),
    ("Bb", ["Bb", "D", "F", "A"]),
    ("C", ["C", "F", "G", "Bb"]),  # Csus4(7)
    ("D", ["D", "F", "A", "C"]),
    ("A", ["A", "C", "E", "G"]),
    ("Bb", ["Bb", "D", "F", "A"]),
    ("F", ["F", "A", "C", "E"]),
    ("G", ["G", "Bb", "D", "F"]),
    ("A", ["A", "C", "E", "G"]),
    ("Bb", ["Bb", "D", "F", "A"]),
    ("C", ["C", "E", "G", "Bb"]),  # C7 → 回到 F
]
LOOP_BARS = len(CHORDS)
LOOP = LOOP_BARS * BAR


def chord_midis(tones: list[str], lo: int) -> list[int]:
    """把和弦音排成从 lo 往上的一串 MIDI 号"""
    out = []
    cur = lo
    for t in tones:
        m = midi(t, 0)
        while m < cur:
            m += 12
        out.append(m)
        cur = m + 1
    return out


# ---------- 毛毡钢琴 ----------
def piano(f: float, dur: float, vel: float) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    B = 0.00035
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        amp = (1 / k**1.7) * (0.6 if k == 2 else 1.0)
        decay = 0.55 + f / 900 + 0.35 * k
        sig += amp * np.exp(-t * decay) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28))
    # 毛毡：起音慢一点（~9ms）、再压一点高频
    att = np.clip(t / 0.009, 0, 1)
    att = 0.5 - 0.5 * np.cos(np.pi * att)
    sig *= att
    # 琴槌的一点点闷响
    thump_n = int(0.025 * SR)
    thump = rng.standard_normal(thump_n) * np.exp(-np.arange(thump_n) / (0.006 * SR))
    thump = np.convolve(thump, np.ones(40) / 40, mode="same")
    sig[:thump_n] += thump * 0.02
    # 释放：结尾 0.3s 渐隐
    rel = int(0.3 * SR)
    sig[-rel:] *= np.linspace(1, 0, rel) ** 2
    return sig * vel


def pad_tone(f: float, dur: float) -> np.ndarray:
    n = int(SR * dur)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for det in (-0.0012, 0.0012):
        ff = f * (1 + det)
        sig += np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(2 * np.pi * 2 * ff * t)
    env = np.minimum(1, t / 1.3) * np.minimum(1, (dur - t) / 1.6)
    env = np.clip(env, 0, 1) ** 1.5
    return sig * env * 0.5


def render(n_loops: int) -> np.ndarray:
    total = n_loops * LOOP + 6
    L = np.zeros((int(total * SR), 2))

    def add(sig: np.ndarray, at: float, pan: float):
        i = int(at * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        j = min(len(L), i + len(sig))
        s = sig[: j - i]
        L[i:j, 0] += s * np.sqrt(0.5 * (1 - pan))
        L[i:j, 1] += s * np.sqrt(0.5 * (1 + pan))

    # 右手分解和弦的节奏型（拍位, 用第几个和弦音, 力度）——很稀，留白多
    patterns = [
        [(0.0, 0, 0.9), (1.0, 1, 0.55), (1.5, 2, 0.5), (2.5, 3, 0.62), (3.0, 1, 0.45)],
        [(0.0, 0, 0.85), (1.0, 2, 0.5), (2.0, 3, 0.58), (3.0, 2, 0.42)],
        [(0.0, 0, 0.9), (0.5, 1, 0.45), (1.5, 3, 0.55), (2.5, 2, 0.5), (3.5, 1, 0.38)],
        [(0.0, 0, 0.85), (1.5, 1, 0.5), (2.0, 2, 0.5), (3.0, 3, 0.55)],
    ]
    for lp in range(n_loops):
        for b, (bass, tones) in enumerate(CHORDS):
            t0 = lp * LOOP + b * BAR
            # 左手：低音，第 1 拍；偶尔第 3 拍补一个五度
            bm = midi(bass, 2)
            add(piano(hz(bm), 3.6, 0.3), t0 + rng.normal(0, 0.006), -0.12)
            if b % 4 == 2:
                add(piano(hz(bm + 7), 2.0, 0.16), t0 + 2 * BEAT, -0.1)
            # 右手：分解和弦（第 4 个音放高八度，越往后越轻）
            rh = chord_midis(tones, midi("F", 4) - 3)
            pat = patterns[b % len(patterns)]
            for beat, idx, vel in pat:
                m = rh[idx % len(rh)] + (12 if idx == 3 else 0)
                v = vel * rng.uniform(0.85, 1.05) * 0.5
                add(piano(hz(m), 2.8, v), t0 + beat * BEAT + rng.normal(0, 0.008), (m - 66) / 40)
            # 铺底：和弦的 1、3、7 音，一小节一个，缓入缓出（前后小节交叠）
            pm = chord_midis(tones, midi("C", 4) - 5)
            for m in (pm[0], pm[1], pm[3]):
                add(pad_tone(hz(m), BAR + 1.6) * 0.045, t0 - 0.4, 0.0)
    return L


def reverb(x: np.ndarray, rt60: float = 2.6, wet: float = 0.32) -> np.ndarray:
    n_ir = int(rt60 * 1.2 * SR)
    t = np.arange(n_ir) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n_ir) * np.exp(-6.9 * t / rt60)
        # 越往后越暗
        ir = np.convolve(ir, np.ones(12) / 12, mode="same")
        ir[: int(0.018 * SR)] = 0  # 预延迟
        ir /= np.sqrt(np.sum(ir**2))
        n = len(x) + n_ir
        nfft = 1 << (n - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x[:, ch], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
        out[:, ch] = y
    return (1 - wet) * x + wet * out * 0.9


def lowpass(x: np.ndarray, fc: float) -> np.ndarray:
    n = len(x)
    nfft = 1 << (n - 1).bit_length()
    f = np.fft.rfftfreq(nfft, 1 / SR)
    h = 1 / np.sqrt(1 + (f / fc) ** 4) / np.sqrt(1 + (70 / np.maximum(f, 1)) ** 4)  # 同时切掉 70Hz 以下（手机外放听不到，只会吃响度）
    out = np.zeros_like(x)
    for ch in range(x.shape[1]):
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], nfft) * h, nfft)[:n]
    return out


def write_wav(path: Path, x: np.ndarray):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = x[:, None]
    pcm = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(pcm.shape[1])
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def bed():
    x = render(3)
    x = lowpass(x, 3600)
    x = reverb(x)
    # 取中间一遍：开头带着上一遍的余音，结尾自然接回开头 → 无缝循环
    a, b = int(LOOP * SR), int(2 * LOOP * SR)
    seg = x[a:b]
    seg /= np.max(np.abs(seg)) / 0.7  # 峰值 ≈ -3 dBFS（成片里再按人声压低）
    tmp = OUT / "_bed.wav"
    write_wav(tmp, seg)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-c:a", "aac", "-b:a", "128k", str(OUT / "bed.m4a")],
        check=True,
    )
    tmp.unlink()
    print("bed.m4a", f"{LOOP:.2f}s")


def swipe():
    dur = 0.34
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # 带通 1.6–6 kHz
    nfft = 1 << (n - 1).bit_length()
    f = np.fft.rfftfreq(nfft, 1 / SR)
    h = np.exp(-(((np.log(f + 1) - np.log(3200)) / 0.55) ** 2))
    y = np.fft.irfft(np.fft.rfft(noise, nfft) * h, nfft)[:n]
    # 纸面纤维的颗粒感：慢速随机起伏
    grain = np.interp(t, np.linspace(0, dur, 40), rng.uniform(0.55, 1.0, 40))
    env = np.minimum(1, t / 0.035) * np.clip((dur - t) / 0.12, 0, 1) ** 1.5
    y = y * env * grain
    y /= np.max(np.abs(y)) / 0.5
    write_wav(OUT / "swipe.wav", y)
    print("swipe.wav")


def paper():
    dur = 0.42
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    nfft = 1 << (n - 1).bit_length()
    f = np.fft.rfftfreq(nfft, 1 / SR)
    h = np.exp(-(((np.log(f + 1) - np.log(1400)) / 0.8) ** 2))
    y = np.fft.irfft(np.fft.rfft(noise, nfft) * h, nfft)[:n]
    env = np.minimum(1, t / 0.02) * np.exp(-t / 0.09)
    y = y * env
    # 贴上去的一下闷声
    k = int(0.16 * SR)
    tt = t[k:] - t[k]
    y[k:] += 0.6 * np.sin(2 * np.pi * 95 * tt) * np.exp(-tt / 0.035) * np.minimum(1, tt / 0.004)
    y /= np.max(np.abs(y)) / 0.5
    write_wav(OUT / "paper.wav", y)
    print("paper.wav")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    bed()
    swipe()
    paper()
