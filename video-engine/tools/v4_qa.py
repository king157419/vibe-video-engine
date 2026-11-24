"""v4 成片自检：印样 + 和参考片并排 + 亮度/细节密度 + 静止检测 + 响度。

用 D:\\conda\\envs\\d2l\\python.exe 运行（需要 numpy、PIL）：
  python tools/v4_qa.py out/v4/peak/draft.mp4 out/v4/peak/qa
产出（在 outdir 下）：
  sheet_XX.jpg       每 5 秒一帧、6 列的印样（每张 30 帧 = 150 秒）
  vs_reference.jpg   左：本片每 10 秒一帧；右：参考片《信息论》同样间隔（前 3 分钟），用来回答「像不像同一个类型」
  metrics.json       平均亮度、细节密度（和 类型语法.md 附录 B 同一算法）、静止段、响度
标准（类型语法 §6）：平均亮度 ≤ 41（建议 8–20）；细节密度 ≤ 4.0%（参考中位数 2.85%）；静止 > 8 秒要有理由。
"""
import json
sys_stdout_fix = None
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

REF = r"D:\desk\claudex\24\3_第三版资料\参考视频\BV1GXav6iEWh.mp4"


def frames(video, step, outdir, scale=480):
    os.makedirs(outdir, exist_ok=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", video, "-vf", f"fps=1/{step},scale={scale}:-2",
                    os.path.join(outdir, "f_%04d.jpg")], check=True)
    return sorted(os.path.join(outdir, f) for f in os.listdir(outdir) if f.startswith("f_"))


def metrics(path):
    g = np.asarray(Image.open(path).convert("L").resize((480, 270), Image.BILINEAR), dtype=np.float32)
    dx = np.abs(np.diff(g, axis=1))[:-1, :]
    dy = np.abs(np.diff(g, axis=0))[:, :-1]
    return float(g.mean()), float(np.mean((dx + dy) > 48))


def sheet(paths, cols, out, step, label=None):
    if not paths:
        return
    w, h = Image.open(paths[0]).size
    rows = (len(paths) + cols - 1) // cols
    im = Image.new("RGB", (cols * w, rows * h + (28 if label else 0)), (20, 20, 20))
    d = ImageDraw.Draw(im)
    oy = 28 if label else 0
    if label:
        d.text((8, 6), label, fill=(240, 220, 120))
    for i, p in enumerate(paths):
        x, y = (i % cols) * w, (i // cols) * h + oy
        im.paste(Image.open(p), (x, y))
        t = i * step
        d.text((x + 6, y + 4), f"{t // 60}:{t % 60:02d}", fill=(255, 230, 0))
    im.save(out, quality=88)


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    video, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="v4qa_", dir=r"D:\tmp")
    f5 = frames(video, 5, os.path.join(tmp, "f5"))
    for k in range(0, len(f5), 30):
        sheet(f5[k:k + 30], 6, os.path.join(outdir, f"sheet_{k // 30 + 1:02d}.jpg"), 5)
    # 并排对照
    mine10 = frames(video, 10, os.path.join(tmp, "m10"), scale=320)[:18]
    ref10 = frames(REF, 10, os.path.join(tmp, "r10"), scale=320)[:18]
    a = os.path.join(tmp, "a.jpg")
    b = os.path.join(tmp, "b.jpg")
    sheet(mine10, 3, a, 10, "THIS FILM (every 10s)")
    sheet(ref10, 3, b, 10, "REFERENCE 信息论 (every 10s)")
    A, B = Image.open(a), Image.open(b)
    vs = Image.new("RGB", (A.width + B.width + 16, max(A.height, B.height)), (60, 60, 60))
    vs.paste(A, (0, 0))
    vs.paste(B, (A.width + 16, 0))
    vs.save(os.path.join(outdir, "vs_reference.jpg"), quality=88)
    # 指标
    m = [metrics(p) for p in f5]
    lum = [x[0] for x in m]
    edge = [x[1] for x in m]
    # 运动：每 0.5 秒一帧、192x108 灰度，相邻帧亮度差 > 4 的像素占比；连续 > 8 秒低于 0.02% 视为「静止」
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", video, "-vf", "fps=2,scale=192:108,format=gray", "-f", "rawvideo", "-"],
                         capture_output=True).stdout
    arr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 108, 192).astype(np.int16)
    chg = (np.abs(np.diff(arr, axis=0)) > 4).mean(axis=(1, 2))
    freezes, run = [], 0
    for i, c in enumerate(list(chg) + [1.0]):
        if c < 0.0002:
            run += 1
        else:
            if run * 0.5 > 8:
                freezes.append(((i - run) * 0.5, run * 0.5))
            run = 0
    au = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"],
                        capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    summ = au[au.rfind("Summary:"):] if "Summary:" in au else ""

    def grab(k):
        mm = re.search(k + r":\s+(-?[\d.]+)", summ)
        return float(mm.group(1)) if mm else None

    res = {
        "video": video,
        "frames_every_5s": len(f5),
        "lum_mean": round(float(np.mean(lum)), 1),
        "lum_max_frame": round(float(np.max(lum)), 1),
        "edge_mean_pct": round(100 * float(np.mean(edge)), 2),
        "edge_median_pct": round(100 * float(np.median(edge)), 2),
        "edge_frames_over_4pct": [i * 5 for i, e in enumerate(edge) if e > 0.04],
        "freezes_over_8s": [(round(float(s), 1), round(float(d), 1)) for s, d in freezes],
        "motion_mean_pct": round(100 * float(chg.mean()), 3),
        "loudness_I": grab("I"),
        "loudness_LRA": grab("LRA"),
        "true_peak": grab("Peak"),
        "pass_lum": float(np.mean(lum)) <= 41,
        "pass_edge": float(np.mean(edge)) <= 0.04,
    }
    json.dump(res, open(os.path.join(outdir, "metrics.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
