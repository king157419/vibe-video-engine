"""白板共用素材 → public/wb/
- paper.jpg / pencil.wav / tick.wav / whoosh.wav：直接沿用 opus 样片的素材（public/lab/opus/，由 src/lab/opus/tools/make_assets.py 生成）
- pop.wav   轻「啵」：联想栏弹出、卡片出现
- stamp.wav 印章落下的闷响
- erase.wav 橡皮擦两下
- page.wav  翻页（整页掀过去）
全部固定种子合成，纯 Python（不需要 numpy），可复现。
用法（在 video-engine 下）：D:\\conda\\miniconda3\\python.exe tools/wb_assets.py
"""
import math
import random
import shutil
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "public/lab/opus"
OUT = ROOT / "public/wb"
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
rng = random.Random(20260930)

for name in ["paper.jpg", "pencil.wav", "tick.wav", "whoosh.wav"]:
    shutil.copyfile(LAB / name, OUT / name)


def save(name: str, x: list[float]):
    peak = max(1e-9, max(abs(v) for v in x))
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v / peak * 0.5)) * 32767)) for v in x))


def noise(n: int) -> list[float]:
    return [rng.uniform(-1, 1) for _ in range(n)]


def onepole(x: list[float], a: float) -> list[float]:
    """一阶低通（a 越大越闷）"""
    y, out = 0.0, []
    for v in x:
        y = a * y + (1 - a) * v
        out.append(y)
    return out


def hp(x: list[float], a: float) -> list[float]:
    lp = onepole(x, a)
    return [v - l for v, l in zip(x, lp)]


# pop：短促的正弦下滑 + 一点气声
n = int(SR * 0.14)
pop = []
for i in range(n):
    t = i / SR
    f = 900 - 500 * t / 0.14
    pop.append(math.sin(2 * math.pi * f * t) * math.exp(-t * 38))
air = hp(noise(n), 0.6)
pop = [p + a * 0.15 * math.exp(-(i / SR) * 60) for i, (p, a) in enumerate(zip(pop, air))]
save("pop.wav", pop)

# stamp：低频闷响 + 纸面拍击
n = int(SR * 0.3)
st = []
thump = onepole(noise(n), 0.97)
for i in range(n):
    t = i / SR
    st.append(math.sin(2 * math.pi * 95 * t) * math.exp(-t * 22) * 0.8 + thump[i] * 6 * math.exp(-t * 30))
slap = hp(noise(n), 0.3)
st = [s + sl * 0.25 * math.exp(-(i / SR) * 90) for i, (s, sl) in enumerate(zip(st, slap))]
save("stamp.wav", st)

# erase：两下来回擦（带通噪声 × 两个包络）
n = int(SR * 0.5)
er = hp(onepole(noise(n), 0.55), 0.92)
env = []
for i in range(n):
    t = i / SR
    e = 0.0
    for c, d in [(0.1, 0.16), (0.32, 0.16)]:
        u = (t - c + d / 2) / d
        if 0 <= u <= 1:
            e += math.sin(math.pi * u) ** 1.5
    env.append(e)
save("erase.wav", [v * e for v, e in zip(er, env)])

# page：翻页（噪声扫频 + 结尾轻拍）
n = int(SR * 0.6)
base = noise(n)
pg, y = [], 0.0
for i, v in enumerate(base):
    t = i / SR
    a = 0.9 - 0.6 * min(1, t / 0.45)
    y = a * y + (1 - a) * v
    pg.append(y * math.sin(math.pi * min(1, t / 0.5)) ** 2)
tail = hp(noise(n), 0.4)
pg = [p + (tl * 0.3 * math.exp(-((i / SR) - 0.48) * 50) if i / SR > 0.48 else 0) for i, (p, tl) in enumerate(zip(pg, tail))]
save("page.wav", pg)

print("ok", sorted(p.name for p in OUT.iterdir()))
