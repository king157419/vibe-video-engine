# -*- coding: utf-8 -*-
"""
《沙漏与潮水》（工程代号 nightowl，Composition V3Night）——片中所有数字的唯一来源。

运行（项目 Python，只需要 numpy）：
    D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe numbers.py

做三件事：
  1. 按方案 §4.2 / §4.13 的假设，搭一个“示意”双过程模型：
       沙漏 S（睡意，醒着按指数往上限靠近，睡着按指数往下倒）
       潮水 C（清醒信号，按钟点涨落：峰约 21 点，谷约 5 点，下午 14–16 点一个浅坑）
       困 = S − C（两者之间的“缝”，>0 才画淡红斜线）
     并算出片中用到的每一个钟点、时长和比较结论；每个结论都有 assert，模型一改坏就报错。
  2. 把曲线采样和关键数字写进 video-engine/public/v3/nightowl/numbers.json，画面代码只读这一份。
  3. 如果 subs.json 已存在，检查字幕里出现的每个数字都在本文件算出的“允许数字表”里。

重要说明（和方案不一致处，以本文件计算为准）：
  - 方案 §4.7 ⑭“过了午夜，潮水开始退”：按方案自己的假设（潮水峰约 21 点），潮水从 21 点就开始退，
    缝在 23 点前后就露出来。字幕改为“入夜潮水退下，缝露了出来”。
  - 方案 §4.7 ㉔“伦敦凌晨 3 点醒来很精神（北京上午 11 点）”：算术没错，但本片的结论是“最困的时刻跟着挪”，
    改用潮水谷底：伦敦晚上 9 点 = 北京凌晨 5 点（潮水谷底）。和第一天“晚上 9 点很精神”正好对照。
    依据 Roach & Sargent 2019 对“向西飞 8 小时”的同构例子（谷底落到当地晚上，傍晚犯困、早醒）。
  - 方案 §4.7 ㉖“沙漏倒掉一截，晚上 11 点就睡不着了”：模型算出不补觉时缝在 22:54 打开，
    补觉后推迟到 23:39（约 45 分钟，见 H 段），所以字幕写“到了11点，还不困”，不写“睡不着”。
  - 方案 §4.9“天亮前最难熬”：模型最困在 05:27；按 N 段的日出计算，北京约 9 月中到次年 4 月中成立，
    夏季日出更早。片中不写月份，天色带按 10 月中旬（日出 06:23、日落 17:37）画，所以开头 20:00 窗外是夜色。
  - 方案 §4.7 ㉘“夜猫子能晚两三个小时”：Baehr 等 2000 的实测是体温谷底早型 03:50、晚型 06:01，
    相差约 2 小时 11 分，字幕改为“晚约 2 小时”。
  - 方案 §4.7 ㉙“连熬两晚，天亮也缓不过来”：没找到“第二个早晨回升变弱”的直接证据，
    加法模型里天亮的回升幅度也不变（只是整体更高），改成“缓的那口气不是恢复：通宵后别开车”。
  - 犯困车祸只用 Horne & Reyner 1995 摘要里的三个峰值钟点（2 点、6 点、16 点），
    原文按小时的柱高拿不到，画面不画柱状图，只在时间轴上钉三个点。
"""
from __future__ import annotations

import json
import math
import os
import re
import sys

# 本文件名 numbers.py 会遮住标准库的 numbers 模块（numpy 导入时要用它），
# 所以先把本目录从 sys.path 里拿掉，再导入 numpy。
_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:] = [p for p in sys.path if os.path.abspath(p or os.getcwd()) != _HERE]

import numpy as np  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = r"D:\desk\claudex\24\video-engine"
OUT_JSON = os.path.join(ENGINE, "public", "v3", "nightowl", "numbers.json")
SUBS_JSON = os.path.join(ENGINE, "public", "v3", "nightowl", "subs.json")

LINES: list[str] = []


def say(s: str = "") -> None:
    LINES.append(s)
    print(s)


def hhmm(h: float) -> str:
    """把“从第一天 0 点起的小时数”写成 第N天 HH:MM。"""
    day = int(math.floor(h / 24.0)) + 1
    m = int(round((h - 24.0 * (day - 1)) * 60.0))
    if m >= 24 * 60:
        day += 1
        m -= 24 * 60
    return f"第{day}天 {m // 60:02d}:{m % 60:02d}"


def clock(h: float) -> str:
    m = int(round((h % 24.0) * 60.0)) % (24 * 60)
    return f"{m // 60:02d}:{m % 60:02d}"


# ---------------------------------------------------------------------------
# A. 长卷与开头时钟（方案 §4.3、§4.5）
# ---------------------------------------------------------------------------
SCROLL_T0 = 8.0    # 第一天 08:00 醒来，长卷左端
SCROLL_T1 = 44.0   # 第二天 20:00，长卷右端
OPEN_T0 = 20.0     # 开头：第一天 20:00 开始熬
OPEN_T1 = 42.0     # 开头：第二天 18:00（“第二天傍晚”）停钟

# 开头 15 秒里左上角纸签的关键帧（视频秒 → 故事钟点，按方案 §4.5 逐秒表）
OPEN_CLOCK_KEYS = [
    (0.0, 20.0), (0.5, 20.0), (2.0, 21.0), (3.6, 23.0), (4.0, 24.0), (5.6, 26.0),
    (6.0, 27.0), (7.6, 29.0), (8.0, 31.0), (8.6, 36.0), (9.3, 42.0),
]

# ---------------------------------------------------------------------------
# B. 沙漏 S（睡眠稳态过程）
# 常用参数：醒时上升时间常数 18.2 h，睡时下降 4.2 h（Daan, Beersma & Borbély 1984）。
# 归一化：上限 1，下限 0。只用于示意形状。
# ---------------------------------------------------------------------------
TAU_WAKE = 18.2
TAU_SLEEP = 4.2
WAKE_HOURS_NORMAL = 16.0   # 平时 08:00 醒、24:00 睡
SLEEP_HOURS_NORMAL = 8.0


def s_wake(s0: float, dt: float) -> float:
    return 1.0 - (1.0 - s0) * math.exp(-dt / TAU_WAKE)


def s_sleep(s0: float, dt: float) -> float:
    return s0 * math.exp(-dt / TAU_SLEEP)


def steady_state_s0() -> float:
    """平时作息（醒 16 h、睡 8 h）反复多天后，早上 8 点醒来时的 S。"""
    s = 0.1
    for _ in range(200):
        s = s_sleep(s_wake(s, WAKE_HOURS_NORMAL), SLEEP_HOURS_NORMAL)
    return s


S0 = steady_state_s0()


def s_awake_since(t: np.ndarray | float, t_wake: float, s_at_wake: float = None):
    s_at = S0 if s_at_wake is None else s_at_wake
    return 1.0 - (1.0 - s_at) * np.exp(-(np.asarray(t) - t_wake) / TAU_WAKE)


# ---------------------------------------------------------------------------
# C. 潮水 C（生物钟的清醒信号）
# 形状按方案 §4.13：峰约 21:00（睡前 1–3 h 的“睡眠禁区”），谷约 05:00，
# 下午 14–16 点一个浅坑（午后低谷），21→23 点快速回落（入睡门）。
# 用周期性单调三次插值（Fritsch–Carlson / PCHIP）穿过下面的控制点，极值正好落在控制点上。
# ---------------------------------------------------------------------------
C_POINTS = [  # (钟点, 0–1 的相对高度)
    (0.0, 0.26), (2.0, 0.09), (5.0, 0.00), (7.0, 0.10), (9.0, 0.38),
    (11.0, 0.58), (12.5, 0.63), (15.0, 0.45), (17.5, 0.66), (19.5, 0.90),
    (21.0, 1.00), (22.0, 0.84), (23.0, 0.45),
]
C_LOW = 0.36    # 潮水谷底在纵轴上的高度
C_AMP = 0.50    # 潮水的起伏幅度（峰 = 0.86）


def _pchip_periodic(points, period=24.0):
    xs = np.array([p[0] for p in points], dtype=float)
    ys = np.array([p[1] for p in points], dtype=float)
    n = len(xs)
    xe = np.concatenate([[xs[-1] - period], xs, [xs[0] + period]])
    ye = np.concatenate([[ys[-1]], ys, [ys[0]]])
    h = np.diff(xe)
    d = np.diff(ye) / h
    m = np.zeros(n)
    for k in range(n):
        d0, d1 = d[k], d[k + 1]
        h0, h1 = h[k], h[k + 1]
        if d0 * d1 <= 0:
            m[k] = 0.0
        else:
            w1 = 2 * h1 + h0
            w2 = h1 + 2 * h0
            m[k] = (w1 + w2) / (w1 / d0 + w2 / d1)

    def f(t):
        t = np.asarray(t, dtype=float)
        u = np.mod(t, period)
        idx = np.searchsorted(xs, u, side="right") - 1  # -1 表示落在最后一点之后（跨午夜）
        x0 = np.where(idx >= 0, xs[np.clip(idx, 0, n - 1)], xs[-1] - period)
        y0 = np.where(idx >= 0, ys[np.clip(idx, 0, n - 1)], ys[-1])
        m0 = np.where(idx >= 0, m[np.clip(idx, 0, n - 1)], m[-1])
        j = np.where(idx >= 0, idx + 1, 0)
        x1 = np.where(j < n, xs[np.clip(j, 0, n - 1)], xs[0] + period)
        y1 = np.where(j < n, ys[np.clip(j, 0, n - 1)], ys[0])
        m1 = np.where(j < n, m[np.clip(j, 0, n - 1)], m[0])
        uu = np.where(idx >= 0, u, u)  # u 已在 [0, 24)
        hh = x1 - x0
        s = (uu - x0) / hh
        h00 = 2 * s**3 - 3 * s**2 + 1
        h10 = s**3 - 2 * s**2 + s
        h01 = -2 * s**3 + 3 * s**2
        h11 = s**3 - s**2
        return h00 * y0 + h10 * hh * m0 + h01 * y1 + h11 * hh * m1

    return f


_C_BASE = _pchip_periodic(C_POINTS)


def tide(t, clock_offset: float = 0.0):
    """潮水高度。clock_offset：身体钟比当地钟快几小时（倒时差用）。"""
    return C_LOW + C_AMP * _C_BASE(np.asarray(t, dtype=float) + clock_offset)


def first_crossing(t: np.ndarray, g: np.ndarray, start: float) -> float:
    """g 从 ≤0 变成 >0 的第一个时刻（线性插值）。"""
    mask = t >= start
    tt, gg = t[mask], g[mask]
    for i in range(1, len(tt)):
        if gg[i - 1] <= 0 < gg[i]:
            return float(tt[i - 1] + (tt[i] - tt[i - 1]) * (-gg[i - 1]) / (gg[i] - gg[i - 1]))
    return float("nan")


def at(t: np.ndarray, y: np.ndarray, x: float) -> float:
    return float(np.interp(x, t, y))


DT = 1.0 / 60.0  # 1 分钟分辨率

# ---------------------------------------------------------------------------
# 计算开始
# ---------------------------------------------------------------------------
say("=" * 72)
say("《沙漏与潮水》numbers.py 输出（所有数字都由这里算出；曲线为示意，非实测）")
say("=" * 72)

say("\n[A] 长卷与开头时钟")
scroll_hours = SCROLL_T1 - SCROLL_T0
open_hours = OPEN_T1 - OPEN_T0
say(f"  长卷：{hhmm(SCROLL_T0)} → {hhmm(SCROLL_T1)}，共 {scroll_hours:.0f} 小时")
say(f"  开头快转：{hhmm(OPEN_T0)} → {hhmm(OPEN_T1)}（“从晚上 8 点，一直熬到第二天傍晚”），共 {open_hours:.0f} 小时")
say("  开头纸签关键帧（视频秒 → 纸签时间）：")
for sec, h in OPEN_CLOCK_KEYS:
    say(f"    {sec:4.1f}s → {clock(h)}")
assert scroll_hours == 36 and open_hours == 22

say("\n[B] 沙漏 S（τ醒 = 18.2 h，τ睡 = 4.2 h；归一化 0–1）")
say(f"  平时作息（醒 16 h / 睡 8 h）稳态：早上醒来 S0 = {S0:.3f}")

t_main = np.arange(SCROLL_T0, SCROLL_T1 + 1e-9, DT)
S_main = s_awake_since(t_main, SCROLL_T0)
C_main = tide(t_main)
G_main = S_main - C_main

for h in [8, 21, 23, 24, 29, 32, 39, 44]:
    say(f"  {hhmm(h)}：醒了 {h - 8:>2.0f} h，S = {at(t_main, S_main, h):.3f}")

say("\n[C] 潮水 C（周期 24 h；纵轴 谷 {:.2f} → 峰 {:.2f}）".format(C_LOW, C_LOW + C_AMP))
t_day = np.arange(0.0, 24.0, DT)
c_day = tide(t_day)
peak_h = float(t_day[np.argmax(c_day)])
trough_h = float(t_day[np.argmin(c_day)])
aft = (t_day >= 13.0) & (t_day <= 17.0)
dip_h = float(t_day[aft][np.argmin(c_day[aft])])
noon_max_h = float(t_day[(t_day >= 10) & (t_day <= 14)][np.argmax(c_day[(t_day >= 10) & (t_day <= 14)])])
say(f"  峰：{clock(peak_h)}　谷：{clock(trough_h)}　午后浅坑底：{clock(dip_h)}（坑前小峰 {clock(noon_max_h)}）")
dip_depth = float(np.max(c_day[(t_day >= 10) & (t_day <= 14)]) - np.min(c_day[aft]))
say(f"  午后浅坑深度 = {dip_depth:.3f}（全幅 {C_AMP:.2f} 的 {dip_depth / C_AMP * 100:.0f}%）")
assert abs(peak_h - 21.0) < 0.05 and abs(trough_h - 5.0) < 0.05 and 14.0 <= dip_h <= 16.0

say("\n[D] 主长卷：困 = S − C（>0 才是“缝”）")
g21 = at(t_main, G_main, 21)
open_h = first_crossing(t_main, G_main, 12.0)
imax = int(np.argmax(G_main))
max_h, max_g = float(t_main[imax]), float(G_main[imax])
wide = t_main[G_main >= 0.9 * max_g]
wide_lo, wide_hi = float(wide.min()), float(wide.max())
g = {h: at(t_main, G_main, h) for h in [21, 23, 24, 26, 29, 30, 32, 35, 36.5, 39, 42, 44]}
d2_noon = (t_main >= 34) & (t_main <= 37.5)
relief_min_h = float(t_main[d2_noon][np.argmin(G_main[d2_noon])])
relief_min_g = float(np.min(G_main[d2_noon]))
d2_aft = (t_main >= 37) & (t_main <= 41)
aft_max_h = float(t_main[d2_aft][np.argmax(G_main[d2_aft])])
aft_max_g = float(np.max(G_main[d2_aft]))
d1_eve = (t_main >= 17) & (t_main <= 23)
d1_most_alert_h = float(t_main[d1_eve][np.argmin(G_main[d1_eve])])

say(f"  第一天 21:00（醒了 13 h）：S − C = {g21:+.3f} → 缝为负，很精神")
say(f"  对照：第一天 09:00 {at(t_main, G_main, 9):+.3f}，12:00 {at(t_main, G_main, 12):+.3f}，"
    f"15:00 {at(t_main, G_main, 15):+.3f}（午后浅坑，但沙漏还低，不出缝）")
say(f"  第一天傍晚到夜里（17:00–23:00）最精神的时刻：{hhmm(d1_most_alert_h)}")
say(f"  缝第一次打开：{hhmm(open_h)}")
say(f"  缝最宽（最困）：{hhmm(max_h)}，S − C = {max_g:+.3f}")
say(f"  缝 ≥ 最宽 90% 的时段：{clock(wide_lo)}–{clock(wide_hi)}（字幕“天亮前”，画面钉“最困”在 {clock(max_h)}）")
for h, v in g.items():
    say(f"    {hhmm(h)}：S − C = {v:+.3f}")
say(f"  天亮后回升最好的时刻：{hhmm(relief_min_h)}，S − C = {relief_min_g:+.3f}（是最宽时的 {relief_min_g / max_g * 100:.0f}%）")
say(f"  第二天下午缝又变宽，局部最宽：{hhmm(aft_max_h)}，S − C = {aft_max_g:+.3f}（比回升最好时宽 {(aft_max_g / relief_min_g - 1) * 100:.0f}%）")
say(f"  第二天 20:00（长卷尽头）：S − C = {g[44]:+.3f}（缝收窄但还在）")

assert g21 < -0.2, "21 点必须很精神"
assert abs(d1_most_alert_h - 21.0) < 0.6, "第一天傍晚到夜里最精神应在 21 点前后"
assert at(t_main, G_main, 15) < 0, "第一天下午沙漏还低，不应出缝"
assert 22.5 <= open_h <= 23.5, "缝应在 23 点前后打开"
assert 28.0 <= max_h <= 30.5, "最困应在凌晨 4–6 点半（天亮前）"
assert relief_min_g < 0.6 * max_g, "天亮后要明显缓一口气"
assert 38.0 <= aft_max_h <= 40.0 and aft_max_g > relief_min_g * 1.3, "下午 2–4 点要再塌一次"
assert g[44] > 0, "长卷尽头沙漏仍高于潮水"

say("\n[E] 开头三张便签的小曲线（横轴 第一天 20:00 → 第二天 18:00）")
t_card = np.arange(OPEN_T0, OPEN_T1 + 1e-9, 0.25)
card_A = s_awake_since(t_card, SCROLL_T0)  # A：只算沙漏
card_B = s_awake_since(t_card, SCROLL_T0) - tide(t_card)  # B：正解
# C：午夜最高、之后一路往下（错误直觉，“熬过 12 点就越来越清醒”）——人为构造，不来自模型
card_C = np.where(t_card <= 24.0, (t_card - OPEN_T0) / 4.0, 1.0 - (t_card - 24.0) / (OPEN_T1 - 24.0) * 0.85)


def norm01(y):
    y = np.asarray(y, dtype=float)
    return (y - y.min()) / (y.max() - y.min())


cA, cB, cC = norm01(card_A), norm01(card_B), norm01(card_C)
b_peak = float(t_card[np.argmax(cB)])
say(f"  A 单调上升：{bool(np.all(np.diff(cA) > 0))}")
say(f"  B 顶点：{hhmm(b_peak)}；B 在 {hhmm(relief_min_h)} 回落到 {np.interp(relief_min_h, t_card, cB):.2f}，"
    f"在 {hhmm(aft_max_h)} 又涨到 {np.interp(aft_max_h, t_card, cB):.2f}")
say(f"  C 顶点：{hhmm(float(t_card[np.argmax(cC)]))}")
assert np.all(np.diff(cA) > 0)
assert 28.0 <= b_peak <= 30.5

say("\n[F] 旁证：英国犯困车祸的三个高峰（Horne & Reyner 1995，BMJ；679 起）")
ACC_PEAKS = [2.0, 6.0, 16.0]
d2 = (t_main >= 24) & (t_main <= 44)
q50 = float(np.median(G_main[d2]))
for p in ACC_PEAKS:
    v = at(t_main, G_main, 24 + p)
    say(f"  {clock(p)}：主长卷上 S − C = {v:+.3f}（第二天 00:00–20:00 的中位数 {q50:+.3f}）→ {'落在缝宽处' if v > q50 else '不在缝宽处'}")
    assert v > q50

say("\n[G] 迁移一：冬天北京 → 伦敦")
TZ_BJ, TZ_LDN_WINTER, TZ_LDN_SUMMER = 8, 0, 1
diff_winter = TZ_BJ - TZ_LDN_WINTER
diff_summer = TZ_BJ - TZ_LDN_SUMMER
say(f"  时差：冬令时 {diff_winter} 小时，夏令时 {diff_summer} 小时 → 字幕写“冬天”“时差 8 小时”")
ldn_eve = 21.0
bj_at = (ldn_eve + diff_winter) % 24
say(f"  伦敦 {clock(ldn_eve)} = 北京 {clock(bj_at)}（潮水谷底 {clock(trough_h)}）")
assert diff_winter == 8 and abs(bj_at - 5.0) < 1e-9
# 示意情景：到伦敦第一天，伦敦 07:00 醒（S 同平时），潮水还按北京走
t_l = np.arange(7.0, 24.0 + 1e-9, DT)
S_l = s_awake_since(t_l, 7.0)
C_l = tide(t_l, clock_offset=diff_winter)
G_l = S_l - C_l
C_home = tide(t_l)
G_home_eq = s_awake_since(t_l, 7.0) - C_home
g_l21 = at(t_l, G_l, 21.0)
l_max_h = float(t_l[np.argmax(G_l)])
say(f"  伦敦第一天（07:00 醒）：伦敦 21:00 的 S − C = {g_l21:+.3f}；同样醒 14 h、在北京家里 21:00 的 S − C = {at(t_l, G_home_eq, 21.0):+.3f}")
say(f"  伦敦这一天（07:00–24:00）最困：伦敦 {clock(l_max_h)}")
assert g_l21 > 0.15 and at(t_l, G_home_eq, 21.0) < 0
# 附：伦敦凌晨 3 点 = 北京 11 点（方案原句，片中已不用）
say(f"  （附）伦敦 03:00 = 北京 {clock((3 + diff_winter) % 24)}，方案原句，片中不用")
CDC_WEST_RATE = 1.5
say(f"  CDC：向西每天平均调 {CDC_WEST_RATE} 小时 → 8 小时约需 {diff_winter / CDC_WEST_RATE:.1f} 天（只写进简介）")

say("\n[H] 迁移二：傍晚补觉")
NAP_START, NAP_LEN = 18.0, 1.0
t_n = np.arange(8.0, 26.0 + 1e-9, DT)
S_no = s_awake_since(t_n, 8.0)
s_before = s_wake(S0, NAP_START - 8.0)
s_after = s_sleep(s_before, NAP_LEN)
S_nap = np.where(
    t_n < NAP_START, S_no,
    np.where(t_n < NAP_START + NAP_LEN, s_before * np.exp(-(t_n - NAP_START) / TAU_SLEEP),
             1.0 - (1.0 - s_after) * np.exp(-(t_n - NAP_START - NAP_LEN) / TAU_WAKE)))
C_n = tide(t_n)
G_no, G_nap = S_no - C_n, S_nap - C_n
open_no = first_crossing(t_n, G_no, 20.0)
open_nap = first_crossing(t_n, G_nap, 20.0)
say(f"  平时 08:00 醒；{clock(NAP_START)} 补睡 {NAP_LEN:.0f} 小时：S {s_before:.3f} → {s_after:.3f}（倒掉 {(1 - s_after / s_before) * 100:.0f}%）")
say(f"  23:00：不补觉 S − C = {at(t_n, G_no, 23):+.3f}；补了觉 S − C = {at(t_n, G_nap, 23):+.3f}")
say(f"  缝打开（开始困）：不补觉 {clock(open_no)}，补了觉 {clock(open_nap)}，推迟 {(open_nap - open_no) * 60:.0f} 分钟")
assert at(t_n, G_no, 23) > 0 > at(t_n, G_nap, 23), "11 点：不补觉已经困，补了觉还不困"
assert open_nap - open_no > 0.5

say("\n[I] 边界：每个人的潮水早晚不同（Baehr, Revelle & Eastman 2000，体温谷底）")
TMIN_M, TMIN_N, TMIN_E = 3 + 50 / 60, 5 + 2 / 60, 6 + 1 / 60
dm = TMIN_E - TMIN_M
say(f"  早型 {clock(TMIN_M)}，中间型 {clock(TMIN_N)}，晚型 {clock(TMIN_E)} → 晚型比早型晚 {int(dm)} 小时 {round((dm - int(dm)) * 60)} 分 → 字幕“约 2 小时”")
say(f"  模型潮水谷底 {clock(trough_h)} 与中间型 {clock(TMIN_N)} 相差 {abs(trough_h - TMIN_N) * 60:.0f} 分钟")
assert round(dm) == 2

say("\n[J] 留题：考前 9 点就睡，翻到 11 点")
t_q = np.arange(8.0, 26.0, DT)
G_q = s_awake_since(t_q, 8.0) - tide(t_q)
say(f"  平时 21:00：S − C = {at(t_q, G_q, 21):+.3f}（傍晚到夜里最精神）；23:00：{at(t_q, G_q, 23):+.3f}；缝在 {clock(first_crossing(t_q, G_q, 20.0))} 打开")
say("  答案：潮水（睡前两三个小时正在最高处，研究里叫“睡眠禁区”）")
assert at(t_q, G_q, 21) < 0

say("\n[K] 第三天早上（只用于核对边界措辞，片中不出现）")
g48 = float(s_awake_since(48.0, 8.0) - tide(48.0))
say(f"  若连熬两晚，第三天 08:00 S − C = {g48:+.3f}；第二天 08:00 = {g[32]:+.3f}；"
    f"天亮回升幅度两天都是潮水的 {(tide(36.5) - tide(29.0)) :.3f}（加法模型里回升幅度不变）")

say("\n[N] 天色带的钟点：北京日出日落（NOAA 简化太阳位置公式，39.90°N 116.40°E，UTC+8）")
BJ_LAT, BJ_LON, BJ_TZ = 39.9042, 116.4074, 8.0


def sun_times(doy: int, lat=BJ_LAT, lon=BJ_LON, tz=BJ_TZ):
    gam = 2 * math.pi / 365.0 * (doy - 1)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(gam) - 0.032077 * math.sin(gam)
                    - 0.014615 * math.cos(2 * gam) - 0.040849 * math.sin(2 * gam))
    decl = (0.006918 - 0.399912 * math.cos(gam) + 0.070257 * math.sin(gam) - 0.006758 * math.cos(2 * gam)
            + 0.000907 * math.sin(2 * gam) - 0.002697 * math.cos(3 * gam) + 0.00148 * math.sin(3 * gam))
    la = math.radians(lat)
    ha = math.degrees(math.acos(math.cos(math.radians(90.833)) / (math.cos(la) * math.cos(decl))
                                - math.tan(la) * math.tan(decl)))
    rise = (720 - 4 * (lon + ha) - eqt) / 60.0 + tz
    sset = (720 - 4 * (lon - ha) - eqt) / 60.0 + tz
    return rise, sset


MONTH_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]  # 每月 15 日
max_clock = max_h % 24.0
ok_months = []
for mo, doy in enumerate(MONTH_DOY, start=1):
    rise, sset = sun_times(doy)
    flag = rise > max_clock
    if flag:
        ok_months.append(mo)
    say(f"  {mo:>2} 月 15 日：日出 {clock(rise)}，日落 {clock(sset)}　{'最困时刻在日出前' if flag else '日出早于最困时刻'}")
say(f"  模型最困 {clock(max_clock)}：北京每月 15 日日出晚于它的月份 = {ok_months}（约 9 月中到次年 4 月中是“天亮前”；"
    f"5–8 月日出更早，严格说是“天刚亮”，片中不写月份，天色带按 10 月画）")
SKY_DOY = 288  # 10 月 15 日：片子的季节（与“冬天飞伦敦”不冲突，长卷不写日期）
sky_rise, sky_set = sun_times(SKY_DOY)
say(f"  天色带按 10 月中旬北京：日出 {clock(sky_rise)}，日落 {clock(sky_set)} → 开头 20:00 窗外已是夜色，18:00 停钟时是傍晚余晖")
assert sky_rise > max_clock

# ---------------------------------------------------------------------------
# 允许出现在字幕/画面里的数字（含来源数字）
# ---------------------------------------------------------------------------
ALLOWED = {
    "8": "早上 8 点醒 / 晚上 8 点开熬 / 时差 8 小时",
    "9": "晚上 9 点（潮水峰）/ 留题 9 点睡",
    "13": "醒了 13 小时（21 − 8）",
    "2": "车祸高峰凌晨 2 点 / 下午 2 到 4 点 / 夜猫子晚约 2 小时",
    "4": "下午 2 到 4 点 / 车祸高峰下午 4 点",
    "6": "车祸高峰 6 点 / 傍晚 6 点补觉",
    "5": "北京凌晨 5 点（潮水谷底）",
    "1": "补睡 1 小时",
    "11": "晚上 11 点（补觉后还不困）/ 留题翻到 11 点",
    "1995": "Horne & Reyner 1995",
    "679": "Horne & Reyner 1995 的样本量",
    "36": "长卷 36 小时",
}
# 画面上的钟点（纸签、刻度、钉子）都来自上面的计算或钟面本身：
SCREEN_CLOCKS = {
    "纸签/刻度": "整点 HH:00，由故事时间直接换算",
    "最困钉子": clock(max_h), "缓一口气钉子": clock(relief_min_h), "下午再塌钉子": clock(aft_max_h),
    "车祸高峰": "02:00 / 06:00 / 16:00", "伦敦小卷": "伦敦 21:00 = 北京 05:00",
    "补觉小卷": f"18:00 补睡 1 小时；23:00 对照；缝打开 {clock(open_no)} → {clock(open_nap)}",
    "时型": f"早型谷底 {clock(TMIN_M)} / 晚型 {clock(TMIN_E)}",
}

say("\n[L] 允许出现在字幕/画面上的数字")
for k, v in ALLOWED.items():
    say(f"  {k:>5}：{v}")
say("  画面钟点：")
for k, v in SCREEN_CLOCKS.items():
    say(f"    {k}：{v}")

if os.path.exists(SUBS_JSON):
    with open(SUBS_JSON, encoding="utf-8") as f:
        subs = json.load(f)
    bad = []
    for s in subs:
        for num in re.findall(r"\d+", s["zh"]):
            if num not in ALLOWED:
                bad.append((num, s["zh"]))
    say(f"\n[M] 字幕数字核对：{len(subs)} 条字幕，未登记数字 {len(bad)} 个")
    for b in bad:
        say(f"  !! {b}")
    assert not bad

# ---------------------------------------------------------------------------
# 写 numbers.json（画面代码只读这一份）
# ---------------------------------------------------------------------------
STEP = 5.0 / 60.0


def samp(t0, t1, fn):
    tt = np.round(np.arange(t0, t1 + 1e-9, STEP), 6)
    return tt, fn(tt)


tt_main = np.round(np.arange(SCROLL_T0, SCROLL_T1 + 1e-9, STEP), 6)
S_m5 = s_awake_since(tt_main, SCROLL_T0)
C_m5 = tide(tt_main)

tt_l = np.round(np.arange(7.0, 24.0 + 1e-9, STEP), 6)
tt_n = np.round(np.arange(8.0, 26.0 + 1e-9, STEP), 6)
S_n5 = np.interp(tt_n, t_n, S_nap)
S_no5 = np.interp(tt_n, t_n, S_no)


def r(a, nd=4):
    return [round(float(x), nd) for x in np.asarray(a)]


out = {
    "_说明": "由 3_第三版资料/样片/nightowl/numbers.py 生成，勿手改。时间单位：小时，从第一天 0 点算；曲线为示意，非实测。",
    "scroll": {"t0": SCROLL_T0, "t1": SCROLL_T1, "hours": scroll_hours},
    "opening": {"t0": OPEN_T0, "t1": OPEN_T1, "clockKeys": [[a, b] for a, b in OPEN_CLOCK_KEYS]},
    "model": {"tauWake": TAU_WAKE, "tauSleep": TAU_SLEEP, "S0": round(S0, 4),
              "cLow": C_LOW, "cAmp": C_AMP, "cPoints": [[a, b] for a, b in C_POINTS]},
    "main": {"step": STEP, "t": r(tt_main, 4), "S": r(S_m5), "C": r(C_m5)},
    "keys": {
        "d1_21_gap": round(g21, 4), "gapOpen": round(open_h, 4),
        "maxGap": {"t": round(max_h, 4), "g": round(max_g, 4)},
        "wide90": [round(wide_lo, 4), round(wide_hi, 4)],
        "reliefBest": {"t": round(relief_min_h, 4), "g": round(relief_min_g, 4)},
        "afternoonMax": {"t": round(aft_max_h, 4), "g": round(aft_max_g, 4)},
        "tidePeak": peak_h, "tideTrough": trough_h, "tideDip": dip_h,
    },
    "pins": [  # 钉子：钟点（主长卷时间）+ 文案
        {"t": 21.0, "text": "很精神"},
        {"t": round(max_h, 2), "text": "最困"},
        {"t": round(relief_min_h, 2), "text": "缓一口气"},
        {"t": round(aft_max_h, 2), "text": "下午再塌一次"},
    ],
    "cards": {"t": r(t_card, 3), "A": r(cA), "B": r(cB), "C": r(cC)},
    "accidents": {"source": "Horne & Reyner 1995, BMJ 310:565", "n": 679, "peaks": ACC_PEAKS,
                  "label": "英国 1995 · 679 起打瞌睡车祸"},
    "london": {"tzDiff": diff_winter, "t": r(tt_l, 4), "S": r(s_awake_since(tt_l, 7.0)),
               "C": r(tide(tt_l, clock_offset=diff_winter)), "keyLocal": ldn_eve, "keyHome": bj_at},
    "nap": {"start": NAP_START, "len": NAP_LEN, "t": r(tt_n, 4), "S": r(S_n5), "Sno": r(S_no5),
            "C": r(tide(tt_n)), "openNo": round(open_no, 4), "openNap": round(open_nap, 4)},
    "chronotype": {"M": TMIN_M, "N": TMIN_N, "E": TMIN_E, "diffH": round(dm, 3)},
    "sky": {"season": "10 月中旬北京", "sunrise": round(sky_rise, 3), "sunset": round(sky_set, 3)},
}
os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
say(f"\n已写入 {OUT_JSON}（{os.path.getsize(OUT_JSON) / 1024:.1f} KB）")
say("全部 assert 通过。")
