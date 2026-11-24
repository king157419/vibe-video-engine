"""生成「读书笔记」样式的纸张底图（一次性离线生成，结果提交到 public/styles/notes/paper.jpg）。

纸色 #F4EDE1 + 低频斑驳 + 细颗粒 + 纸纤维 + 柔和暗角。固定随机种子，可重复生成。
用法（需要 numpy + Pillow）：
    D:/conda/envs/d2l/python.exe src/styles/notes/make_paper.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
OUT = Path(__file__).resolve().parents[3] / "public" / "styles" / "notes" / "paper.jpg"

rng = np.random.default_rng(20260929)


def smooth_noise(gw: int, gh: int, amp: float) -> np.ndarray:
    """低分辨率噪声双三次放大 -> 平滑的大块明暗变化"""
    n = rng.standard_normal((gh, gw)).astype(np.float32)
    n = (n - n.min()) / (n.max() - n.min()) * 255
    img = Image.fromarray(n.astype(np.uint8), "L").resize((W, H), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(radius=max(W / gw / 2, 1)))
    a = np.asarray(img, np.float32) / 255.0 - 0.5
    return a / (np.abs(a).max() + 1e-6) * amp


lum = np.zeros((H, W), np.float32)
lum += smooth_noise(9, 16, 4.0)  # 大块斑驳
lum += smooth_noise(54, 96, 1.4)  # 中频
# 细颗粒
grain = rng.standard_normal((H, W)).astype(np.float32)
g_img = Image.fromarray(np.clip(grain * 40 + 128, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.55))
lum += (np.asarray(g_img, np.float32) - 128) / 40 * 3.0

# 纸纤维：大量短曲线，少数偏深、多数偏浅
fib = Image.new("L", (W, H), 128)
d = ImageDraw.Draw(fib)
for _ in range(7500):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    ang = rng.uniform(0, np.pi)
    length = rng.uniform(8, 46)
    steps = int(rng.integers(4, 9))
    pts = [(x, y)]
    for _s in range(steps):
        ang += rng.normal(0, 0.35)
        x += np.cos(ang) * length / steps
        y += np.sin(ang) * length / steps
        pts.append((x, y))
    dark = rng.random() < 0.42
    v = int(128 - rng.uniform(8, 22)) if dark else int(128 + rng.uniform(8, 20))
    d.line(pts, fill=v, width=1)
fib = fib.filter(ImageFilter.GaussianBlur(0.7))
lum += (np.asarray(fib, np.float32) - 128) / 22 * 5.0

# 暗角（椭圆），边缘略偏暖
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx = (xx - W / 2) / (W / 2)
dy = (yy - H / 2) / (H / 2)
dist = np.sqrt(dx * dx * 0.9 + dy * dy * 1.0)
t = np.clip((dist - 0.55) / (1.35 - 0.55), 0, 1)
vig = t * t * (3 - 2 * t)

base = np.array([244, 237, 225], np.float32)
rgb = np.empty((H, W, 3), np.float32)
for c in range(3):
    rgb[..., c] = base[c] + lum
# 暗角：整体压暗 + 蓝通道多压一点（暖）
rgb[..., 0] *= 1 - 0.085 * vig
rgb[..., 1] *= 1 - 0.105 * vig
rgb[..., 2] *= 1 - 0.14 * vig

OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB").save(OUT, quality=90, subsampling=0, optimize=True)
print("wrote", OUT, OUT.stat().st_size // 1024, "KB")
