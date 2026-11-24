"""v4 卡顿扫描：逐帧找「画面在动时突然停住」和「单帧跳变」。

用户 2026-10-12 反馈《弱关系》2:56、《赫布》3:08「卡了一下」：都是高潮后硬静音那一刻，
画面单帧跳变或停两帧，配上突然没声，看着像播放器卡了。

用法：python tools/v4_stutter.py video.mp4 [--from 0] [--to 999]
  FREEZE  画面本来在动（前后 1 秒的中位运动量 > 0.3），却连续 ≥2 帧几乎不变 → 看起来像卡顿
  POP     单帧变化量 > 6 倍局部中位数且 > 3.0 → 跳变（有意的硬切也会被列出，要在自检里说明理由）
"""
import argparse
import subprocess
import sys

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("--from", dest="t0", type=float, default=0.0)
ap.add_argument("--to", dest="t1", type=float, default=99999.0)
a = ap.parse_args()

W, H, FPS = 240, 135, 30
cmd = ["ffmpeg", "-v", "error", "-ss", str(a.t0), "-i", a.video, "-t", str(a.t1 - a.t0),
       "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
n = W * H
prev = None
diffs = []
while True:
    buf = p.stdout.read(n)
    if len(buf) < n:
        break
    f = np.frombuffer(buf, np.uint8).astype(np.int16)
    if prev is not None:
        diffs.append(float(np.abs(f - prev).mean()))
    prev = f
p.wait()
d = np.array(diffs)
if len(d) == 0:
    sys.exit("no frames decoded")


def local_median(i, half=FPS):
    lo, hi = max(0, i - half), min(len(d), i + half + 1)
    return float(np.median(d[lo:hi]))


events = []
i = 0
while i < len(d):
    if d[i] < 0.02:
        j = i
        while j < len(d) and d[j] < 0.02:
            j += 1
        run = j - i
        around = np.concatenate([d[max(0, i - FPS):i], d[j:j + FPS]])
        ctx = float(np.median(around)) if len(around) else 0.0
        if run >= 2 and ctx > 0.3:
            events.append((a.t0 + (i + 1) / FPS, "FREEZE", f"{run} 帧不动，前后运动量 {ctx:.2f}"))
        i = j
        continue
    m = local_median(i)
    if d[i] > max(6 * m, 3.0):
        events.append((a.t0 + (i + 1) / FPS, "POP", f"变化量 {d[i]:.1f}，局部中位数 {m:.2f}"))
    i += 1

dur = len(d) / FPS
print(f"扫描 {a.video}  {a.t0:.1f}–{a.t0 + dur:.1f}s，{len(d) + 1} 帧，中位运动量 {np.median(d):.3f}")
if not events:
    print("没有发现卡顿或跳变")
for t, kind, msg in events:
    print(f"{int(t // 60)}:{t % 60:05.2f}  ({t:7.2f}s)  {kind:6s} {msg}")
