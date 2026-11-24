# -*- coding: utf-8 -*-
"""审稿独立重算（2026-10-06）：不看 numbers.py 的代码，只按方案 §4.2 / 分镜表 §1 写明的假设，逐 0.001 小时欧拉积分。
运行：D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe 审稿_独立重算.py（约 1 分钟；只读 numbers.json，不写任何文件）

沙漏 S：醒着 dS/dt = (1-S)/18.2，睡着 dS/dt = -S/4.2（方案：指数趋近上限 / 只有睡觉能倒空）
潮水 C：两种写法
  C1 = 审稿自己按方案文字搭的光滑不对称波（谷 05:00、峰 21:00、15:00 浅坑），范围 0.36–0.86
  C2 = numbers.json 里画面实际用的潮水采样（只读数据，线性插值），用来核对稿子上的数
"""
import os
import sys

# 本目录有个 numbers.py，会顶掉标准库的 numbers 模块，导致 numpy 导入失败；先把本目录移出搜索路径
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _HERE]

import json  # noqa: E402
import math  # noqa: E402

import numpy as np  # noqa: E402

DT = 0.001
TW, TS = 18.2, 4.2
NUMBERS_JSON = r"D:\desk\claudex\24\video-engine\public\v3\nightowl\numbers.json"


def integrate(t0, t1, S_init, asleep):
    """asleep(t)->bool；返回时间轴和 S。欧拉法逐 0.001 h。"""
    n = int(round((t1 - t0) / DT))
    t = t0 + DT * np.arange(n + 1)
    S = np.empty(n + 1)
    S[0] = S_init
    for i in range(n):
        if asleep(t[i]):
            S[i + 1] = S[i] - S[i] / TS * DT
        else:
            S[i + 1] = S[i] + (1 - S[i]) / TW * DT
    return t, S


def at(arr, tt, h):
    return float(np.interp(h, tt, arr))


def hm(h):
    d = 1 if h < 24 else 2
    m = int(round((h % 24) * 60))
    return f"第{d}天 {m // 60:02d}:{m % 60:02d}"


# 1) 平时作息稳态（08:00 醒、24:00 睡）：从 S=0 起跑 30 天，取最后一个早上 8 点
t, S = integrate(0, 24 * 30 + 8, 0.0, lambda x: (x % 24) < 8)
S0 = S[-1]
a, b = math.exp(-16 / TW), math.exp(-8 / TS)
S0_an = (1 - a) * b / (1 - a * b)
print(f"稳态早 8 点 S0：积分 {S0:.4f}，解析 {S0_an:.4f}（稿子 0.093）")

# 2) 主长卷：第1天 08:00 醒，一直不睡到第2天 20:00（=44）
t, S = integrate(8, 44, S0, lambda x: False)
for h, ref in [(8, .093), (21, .556), (23, .602), (24, .623), (29, .714), (32, .757), (39, .835), (44, .874)]:
    print(f"  S({h:>2}h) = {at(S, t, h):.3f}   稿子 {ref}")


# 3) 潮水
def C1(h):
    h = h % 24
    low, amp = 0.36, 0.50
    if 5 <= h < 21:
        x = (1 - math.cos(math.pi * (h - 5) / 16)) / 2
    else:
        hh = h - 21 if h >= 21 else h + 3
        x = (1 + math.cos(math.pi * hh / 8)) / 2
    dip = 0.09 * math.exp(-0.5 * ((h - 15) / 0.9) ** 2)
    return low + amp * x - dip


J = json.load(open(NUMBERS_JSON, encoding="utf-8"))
mt, mC = np.array(J["main"]["t"]), np.array(J["main"]["C"])


def C2(h):
    hh = h
    while hh < 8:
        hh += 24
    while hh > 44:
        hh -= 24
    return float(np.interp(hh, mt, mC))


for name, C in [("C1 审稿自搭光滑不对称波", C1), ("C2 画面用的潮水", C2)]:
    print(f"\n==== {name} ====")
    Cv = np.array([C(x) for x in t])
    G = S - Cv
    print(f"  第一天 21:00 S-C = {at(G, t, 21):+.3f}（稿子 -0.304）")
    i_open = np.argmax((G > 0) & (t > 20))
    print(f"  缝第一次打开 {hm(t[i_open])}（稿子 22:54）")
    m = (t >= 24) & (t <= 34)
    i = np.argmax(np.where(m, G, -9))
    gmax = G[i]
    print(f"  最宽 {hm(t[i])} g={gmax:+.3f}（稿子 05:27 +0.357）")
    w = t[(G >= 0.9 * gmax) & (t > 24) & (t < 36)]
    print(f"  ≥90% 时段 {hm(w[0])}–{hm(w[-1])}（稿子 03:42–07:20）")
    m = (t >= 30) & (t <= 38)
    i2 = np.argmin(np.where(m, G, 9))
    print(f"  天亮后缝最窄 {hm(t[i2])} g={G[i2]:+.3f}，占最宽 {G[i2] / gmax:.0%}（稿子 12:09 +0.134 37%）")
    m = (t >= 37) & (t <= 42)
    i3 = np.argmax(np.where(m, G, -9))
    print(f"  下午再变宽 {hm(t[i3])} g={G[i3]:+.3f}，比最窄宽 {G[i3] / G[i2] - 1:.0%}（稿子 15:09 +0.251 +87%）")
    print(f"  第二天 20:00 g={at(G, t, 44):+.3f}（稿子 +0.042）")
    m = (t >= 24) & (t <= 44)
    med = float(np.median(G[m]))
    for h in (26, 30, 40):
        trend = "变宽" if at(G, t, h + 0.05) > at(G, t, h) else "变窄"
        print(f"  车祸峰 {h % 24:02d}:00 g={at(G, t, h):+.3f}  中位数 {med:+.3f}  此刻缝在{trend}")
    m = (t >= 20) & (t <= 42)
    print(f"  B 顶点 {hm(t[m][np.argmax(G[m])])}")
    # 伦敦：伦敦 07:00 醒（S0），伦敦时刻 L 对应北京 L+8
    tl, Sl = integrate(7, 24, S0, lambda x: False)
    Gl = Sl - np.array([C(x + 8) for x in tl])
    Gh = Sl - np.array([C(x) for x in tl])
    print(f"  伦敦 21:00 g={at(Gl, tl, 21):+.3f}（稿子 +0.220），在家同样 07:00 醒 21:00 g={at(Gh, tl, 21):+.3f}（稿子 -0.280）")
    print(f"  伦敦当天最困 {hm(tl[np.argmax(Gl)])}（稿子 21:43）")
    # 补觉：08:00 醒，18:00–19:00 睡
    tn, Sn = integrate(8, 27, S0, lambda x: 18 <= x < 19)
    tq, Sq = integrate(8, 27, S0, lambda x: False)
    print(f"  补觉前后 S {at(Sq, tq, 18):.3f} → {at(Sn, tn, 19):.3f}，倒掉 {1 - at(Sn, tn, 19) / at(Sq, tq, 18):.0%}（稿子 0.476→0.375 21%）")
    Gn = Sn - np.array([C(x) for x in tn])
    Gq = Sq - np.array([C(x) for x in tq])
    print(f"  23:00 不补 {at(Gq, tq, 23):+.3f} / 补 {at(Gn, tn, 23):+.3f}（稿子 +0.017 / -0.086）")
    on = tq[np.argmax((Gq > 0) & (tq > 20))]
    onn = tn[np.argmax((Gn > 0) & (tn > 20))]
    print(f"  缝打开 不补 {hm(on)} / 补 {hm(onn)}，推迟 {(onn - on) * 60:.0f} 分钟（稿子 22:54→23:39，45 分）")
    print(f"  留题：21→23 点 ΔS={at(S, t, 23) - at(S, t, 21):+.3f}，ΔC={C(23) - C(21):+.3f}")
