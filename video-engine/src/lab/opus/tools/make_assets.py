"""离线生成 opus 实验用的素材（固定种子，可复现）：
- paper.jpg   2048×2048 可无缝平铺的暖白纸（跟着镜头一起移动、缩放）
- pencil.wav  4 秒铅笔沙沙声循环（渲染时按「笔是否在纸上」开关音量）
- whoosh.wav  0.9 秒镜头大移动的风声
- tick.wav    计数时的轻点声
用法：D:/conda/envs/d2l/python.exe src/lab/opus/tools/make_assets.py
"""
import wave
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[4] / "public/lab/opus"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20260930)

# ---------------- 纸 ----------------
N = 2048


def periodic_noise(sigma_px: float) -> np.ndarray:
    """频域高斯滤波的白噪声：天然周期，可无缝平铺"""
    w = rng.standard_normal((N, N))
    f = np.fft.fftfreq(N)
    fx, fy = np.meshgrid(f, f)
    g = np.exp(-(fx**2 + fy**2) * (2 * np.pi * sigma_px) ** 2 / 2)
    out = np.real(np.fft.ifft2(np.fft.fft2(w) * g))
    return out / (np.abs(out).max() + 1e-9)


lum = periodic_noise(180) * 3.0 + periodic_noise(28) * 1.2 + periodic_noise(0.7) * 2.2
# 纤维：短弯线，按环绕坐标画
fib = np.zeros((N, N), np.float32)
for _ in range(9000):
    x, y = rng.uniform(0, N), rng.uniform(0, N)
    ang = rng.uniform(0, np.pi)
    L = rng.uniform(8, 34)
    v = rng.choice([-1.0, 1.0]) * rng.uniform(0.5, 1.0)
    for s in range(int(L)):
        ang += rng.normal(0, 0.06)
        x += np.cos(ang)
        y += np.sin(ang)
        fib[int(y) % N, int(x) % N] += v
f = np.fft.fft2(fib)
ff = np.fft.fftfreq(N)
fx, fy = np.meshgrid(ff, ff)
fib = np.real(np.fft.ifft2(f * np.exp(-(fx**2 + fy**2) * (2 * np.pi * 0.8) ** 2 / 2)))
lum += fib / (np.abs(fib).max() + 1e-9) * 5.0
base = np.array([0xF6, 0xF1, 0xE6], np.float32)
rgb = base[None, None, :] + lum[..., None] * np.array([1.0, 1.0, 1.1], np.float32)
Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(OUT / "paper.jpg", quality=90)

# ---------------- 声音 ----------------
SR = 48000


def save(name: str, x: np.ndarray):
    x = np.clip(x, -1, 1)
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def bandpass(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = ((f > lo) & (f < hi)).astype(float)
    # 柔化边缘
    m = np.convolve(m, np.hanning(301) / np.hanning(301).sum(), mode="same")
    return np.fft.irfft(X * m, len(x))


# 铅笔：带通噪声 × 笔划节奏（每 0.12–0.35 s 一笔的起伏）× 纸面颗粒，首尾相接做循环
T = 4.0
n = int(SR * T)
noise = bandpass(rng.standard_normal(n), 1800, 9000)
env = np.zeros(n)
t = 0.0
while t < T:
    d = rng.uniform(0.12, 0.35)
    a = rng.uniform(0.55, 1.0)
    i0, i1 = int(t * SR), min(n, int((t + d) * SR))
    k = np.arange(i1 - i0) / max(1, i1 - i0)
    env[i0:i1] = a * np.sin(np.pi * k) ** 0.6
    t += d + rng.uniform(0.0, 0.05)
grain = 0.6 + 0.4 * np.abs(bandpass(rng.standard_normal(n), 20, 90)) / 0.02
grain = np.clip(grain, 0.4, 1.4)
pencil = noise * env * grain
fade = int(0.05 * SR)
pencil[:fade] *= np.linspace(0, 1, fade)
pencil[-fade:] *= np.linspace(1, 0, fade)
pencil = pencil / np.abs(pencil).max() * 0.5
save("pencil.wav", pencil)

# 风声：噪声 + 从低到高再落下的带通扫频
n = int(SR * 0.9)
x = rng.standard_normal(n)
out = np.zeros(n)
seg = 2048
for i in range(0, n, seg // 2):
    u = i / n
    c = 300 + 1500 * np.sin(np.pi * u) ** 2
    chunk = x[i : i + seg]
    if len(chunk) < seg:
        break
    y = bandpass(chunk, c * 0.5, c * 1.6) * np.hanning(seg)
    out[i : i + seg] += y
e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
out = out * e
save("whoosh.wav", out / np.abs(out).max() * 0.45)

# 轻点：短促的木质敲击
n = int(SR * 0.12)
tt = np.arange(n) / SR
tick = (np.sin(2 * np.pi * 1850 * tt) * 0.6 + np.sin(2 * np.pi * 920 * tt) * 0.4) * np.exp(-tt * 60)
tick += bandpass(rng.standard_normal(n), 2000, 7000) * np.exp(-tt * 140) * 0.8
save("tick.wav", tick / np.abs(tick).max() * 0.5)
print("ok", list(p.name for p in OUT.iterdir()))
