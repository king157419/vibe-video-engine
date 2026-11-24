"""measure.py <video> [--ref]：按审片口径复测
- 亮于 50 / 120 的像素面积（每 0.5 s 一帧，480×270 灰度）：全片中位、序段（0–24 s）中位、几乎空（>50 面积 < 0.05%）的秒数
- 「像幻灯片」：每 0.5 s 变化（|差| > 3）的像素 < 0.15%、持续 ≥ 4 s 的段落
- 单帧跳变：30 fps 下相邻帧平均差 > 1.2 且该帧前后 3 帧的局部中位数 < 0.15（生硬出现）
"""
import subprocess
import sys

import numpy as np


def grab(video, fps, w, h):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', video, '-vf', f'fps={fps},scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)


def runs(mask, dt, min_len):
    out, st = [], None
    for i, v in enumerate(list(mask) + [False]):
        if v and st is None:
            st = i
        if not v and st is not None:
            if (i - st) * dt >= min_len:
                out.append((round(st * dt, 1), round(i * dt, 1)))
            st = None
    return out


video = sys.argv[1]
a = grab(video, 2, 480, 270)
t = np.arange(len(a)) * 0.5
b50 = (a > 50).mean(axis=(1, 2)) * 100
b120 = (a > 120).mean(axis=(1, 2)) * 100
lum = a.mean(axis=(1, 2))
print(f'帧数 {len(a)}  平均亮度 {lum.mean():.1f}  最亮 {lum.max():.1f} @ {t[lum.argmax()]:.1f}s')
print(f'>50 面积 中位 {np.median(b50):.2f}%  均值 {b50.mean():.2f}%   >120 中位 {np.median(b120):.2f}%')
pro = t < 24
print(f'序段 0–24 s：>50 中位 {np.median(b50[pro]):.2f}%  最小 {b50[pro].min():.2f}%')
print(f'几乎空（>50 < 0.05%）：{0.5 * (b50 < 0.05).sum():.1f} s', runs(b50 < 0.05, 0.5, 1.5))
chg = (np.abs(np.diff(a, axis=0)) > 3).mean(axis=(1, 2)) * 100
print('每 0.5 s 变化 < 0.15% 且 ≥ 4 s：', runs(chg < 0.15, 0.5, 4.0))
# 单帧跳变
f = grab(video, 30, 240, 135)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
pops = []
for i in range(3, len(d) - 3):
    loc = np.median(np.r_[d[i - 3:i], d[i + 1:i + 4]])
    if d[i] > 1.2 and loc < 0.15:
        pops.append((i + 1, round((i + 1) / 30, 2), round(float(d[i]), 2), round(float(loc), 3)))
print('单帧跳变（帧, 秒, 帧差, 局部中位）：', pops[:30])
for s0, s1 in [(0, 25), (25, 33), (190, 200)]:
    sel = (t >= s0) & (t < s1)
    print(f'{s0}-{s1}s  >50 {np.round(b50[sel], 2).tolist()}')
