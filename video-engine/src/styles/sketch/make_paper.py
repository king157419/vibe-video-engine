"""生成「手绘框架」样式的纸张底图（一次性离线生成，结果放在 public/styles/sketch/paper.jpg）。

暖白素描纸 #FAFAF7：极轻的低频明暗 + 细颗粒 + 少量纸纤维 + 很淡的暗角。
刻意做得很克制——白板讲解要干净，纹理只在放大时才看得出。固定随机种子，可重复生成。
用法（需要 numpy + Pillow）：
    D:/conda/envs/d2l/python.exe src/styles/sketch/make_paper.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
BASE = np.array([0xFA, 0xFA, 0xF7], np.float32)
OUT = Path(__file__).resolve().parents[3] / "public" / "styles" / "sketch" / "paper.jpg"

rng = np.random.default_rng(20260930)


def smooth_noise(gw: int, gh: int, amp: float) -> np.ndarray:
    n = rng.standard_normal((gh, gw)).astype(np.float32)
    n = (n - n.min()) / (n.max() - n.min()) * 255
    img = Image.fromarray(n.astype(np.uint8), "L").resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(radius=max(W / gw / 2, 1)))
    a = np.asarray(img, np.float32) / 255.0 - 0.5
    return a / (np.abs(a).max() + 1e-6) * amp


lum = np.zeros((H, W), np.float32)
lum += smooth_noise(7, 12, 2.2)  # 大块、很轻的明暗
lum += smooth_noise(60, 106, 0.8)
grain = rng.standard_normal((H, W)).astype(np.float32)
g_img = Image.fromarray(np.clip(grain * 40 + 128, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.6))
lum += (np.asarray(g_img, np.float32) - 128) / 40 * 1.6

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
lum += (np.asarray(fib, np.float32) - 128) / 16 * 2.2

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx = (xx - W / 2) / (W / 2)
dy = (yy - H / 2) / (H / 2)
dist = np.sqrt(dx * dx * 0.85 + dy * dy)
vig = np.clip((dist - 0.75) / 0.7, 0, 1) ** 1.6 * 6.0

rgb = BASE[None, None, :] + lum[..., None] - vig[..., None] * np.array([1.0, 1.05, 1.3], np.float32)
rgb = np.clip(rgb, 0, 255).astype(np.uint8)
OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(rgb, "RGB").save(OUT, quality=90, optimize=True)
print("wrote", OUT, rgb.mean(axis=(0, 1)))
