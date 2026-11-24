"""lab/fable 的离线素材：横屏纸张底图 + 铅笔沙沙声循环。全部固定随机种子，可重复生成。
用法：D:/conda/envs/d2l/python.exe src/lab/fable/make_assets.py
输出：public/lab/fable/paper.jpg、public/lab/fable/pen.wav
"""
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
BASE = np.array([0xFA, 0xF8, 0xF2], np.float32)  # 暖白
OUT = Path(__file__).resolve().parents[3] / "public" / "lab" / "fable"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20260930)


def smooth_noise(gw: int, gh: int, amp: float) -> np.ndarray:
    n = rng.standard_normal((gh, gw)).astype(np.float32)
    n = (n - n.min()) / (n.max() - n.min()) * 255
    img = Image.fromarray(n.astype(np.uint8), "L").resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(radius=max(W / gw / 2, 1)))
    a = np.asarray(img, np.float32) / 255.0 - 0.5
    return a / (np.abs(a).max() + 1e-6) * amp


lum = np.zeros((H, W), np.float32)
lum += smooth_noise(12, 7, 2.4)
lum += smooth_noise(106, 60, 0.9)
grain = rng.standard_normal((H, W)).astype(np.float32)
g_img = Image.fromarray(np.clip(grain * 40 + 128, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.6))
lum += (np.asarray(g_img, np.float32) - 128) / 40 * 1.5

fib = Image.new("L", (W, H), 128)
d = ImageDraw.Draw(fib)
for _ in range(2600):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    ang = rng.uniform(0, np.pi)
    length = rng.uniform(10, 40)
    steps = int(rng.integers(4, 8))
    pts = [(x, y)]
    for _s in range(steps):
        ang += rng.normal(0, 0.3)
        x += np.cos(ang) * length / steps
        y += np.sin(ang) * length / steps
        pts.append((x, y))
    v = int(128 - rng.uniform(6, 16)) if rng.random() < 0.5 else int(128 + rng.uniform(6, 14))
    d.line(pts, fill=v, width=1)
fib = fib.filter(ImageFilter.GaussianBlur(0.8))
lum += (np.asarray(fib, np.float32) - 128) / 16 * 2.0

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx = (xx - W / 2) / (W / 2)
dy = (yy - H / 2) / (H / 2)
dist = np.sqrt(dx * dx + dy * dy * 0.85)
vig = np.clip((dist - 0.72) / 0.7, 0, 1) ** 1.6 * 7.0

rgb = BASE[None, None, :] + lum[..., None] - vig[..., None] * np.array([1.0, 1.05, 1.3], np.float32)
rgb = np.clip(rgb, 0, 255).astype(np.uint8)
Image.fromarray(rgb, "RGB").save(OUT / "paper.jpg", quality=90, optimize=True)
print("wrote paper.jpg", rgb.mean(axis=(0, 1)))

# ---- 铅笔沙沙声：带通噪声 + 不规则的颗粒调制，2 秒循环 ----
SR = 44100
DUR = 2.0
n = int(SR * DUR)
noise = rng.standard_normal(n).astype(np.float32)
# 简单带通：先做一阶高通去低频，再做移动平均压高频
hp = np.zeros_like(noise)
a = 0.985
for i in range(1, n):
    hp[i] = a * (hp[i - 1] + noise[i] - noise[i - 1])
k = 6
lp = np.convolve(hp, np.ones(k, np.float32) / k, mode="same")
# 颗粒感：随机的短促脉冲让纸纹“硌”一下
env = np.ones(n, np.float32) * 0.55
t = np.arange(n) / SR
env += 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * 7.3 * t + 1.1)) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.1 * t))
for _ in range(90):
    p = int(rng.integers(0, n - 400))
    env[p : p + 400] += rng.uniform(0.3, 0.9) * np.hanning(400)
sig = lp * env
# 首尾交叉淡化，保证循环无缝
fade = int(SR * 0.05)
ramp = np.linspace(0, 1, fade, dtype=np.float32)
sig[:fade] *= ramp
sig[-fade:] *= ramp[::-1]
sig = sig / (np.abs(sig).max() + 1e-6) * 0.6
pcm = (sig * 32767).astype(np.int16)
with wave.open(str(OUT / "pen.wav"), "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote pen.wav", n / SR, "s")
