# -*- coding: utf-8 -*-
"""第二轮审稿独立重算（2026-10-07）。

不看 numbers.py 的代码，也不沿用第一轮审稿脚本（审稿_独立重算.py，欧拉法）的写法：
  - 沙漏 S：四阶龙格-库塔，步长 1 秒（1/3600 小时）；稳态用“连续模拟 30 天”求，再和闭式解对照。
  - 潮水 C 三条：
      CP  = 自己用 numbers.json 里的 13 个控制点（model.cPoints，模型输入）做周期 PCHIP 重建；
      CS  = numbers.json 里画面实际用的 5 分钟采样（main.C），线性插值；
      CD  = 第三条独立潮水：Daan 1984 双过程模型阈值用的 5 次谐波偏斜正弦（原波形升 8 h、降 16 h），
            时间反转后正好“峰 21:00 → 降 8 h → 谷 05:00 → 升 16 h”，范围 0.36–0.86，
            再减一个 15:00 的高斯浅坑（深 0.09，σ 1.2 h）。和第一轮的“半余弦 + 浅坑”不同，入夜后下降更缓。
  - 字幕规则、段落长度、镜头与钉子的时间：直接读 subs.json / beats.json 重新核。
运行：D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe 审稿2_独立重算.py （只读，不写任何文件，约 10 秒）
"""
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path = [p for p in sys.path if os.path.abspath(p or ".") != _HERE]  # 本目录 numbers.py 会顶掉标准库

import json  # noqa: E402
import math  # noqa: E402

import numpy as np  # noqa: E402

PUB = r"D:\desk\claudex\24\video-engine\public\v3\nightowl"
TW, TS = 18.2, 4.2
H = 1.0 / 3600.0  # 1 秒

with open(os.path.join(PUB, "numbers.json"), encoding="utf-8") as f:
    NJ = json.load(f)
with open(os.path.join(PUB, "subs.json"), encoding="utf-8") as f:
    SUBS = json.load(f)
with open(os.path.join(PUB, "beats.json"), encoding="utf-8") as f:
    BEATS = json.load(f)


def hm(x):
    x = x % 24
    m = int(round(x * 60))
    return f"{m // 60:02d}:{m % 60:02d}"


# ---------------- 沙漏：RK4，1 秒一步 ----------------
def rk4(S, t0, t1, asleep):
    """从 t0 积到 t1（小时），asleep(t) 决定方向。返回逐秒数组。"""
    n = int(round((t1 - t0) / H))
    out = np.empty(n + 1)
    out[0] = S
    t = t0
    for i in range(n):
        def f(tt, s):
            return -s / TS if asleep(tt) else (1 - s) / TW
        k1 = f(t, S)
        k2 = f(t + H / 2, S + H / 2 * k1)
        k3 = f(t + H / 2, S + H / 2 * k2)
        k4 = f(t + H, S + H * k3)
        S = S + H / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        t += H
        out[i + 1] = S
    return out


def regular_asleep(t):
    return (t % 24) < 8.0  # 平时 0:00–8:00 睡


# 稳态：从 S=0.5 开始连续模拟 30 天平时作息（只要每天 8 点的值）
S = 0.5
for day in range(30):
    seg = rk4(S, 8.0 + 24 * day, 8.0 + 24 * (day + 1), regular_asleep)
    S = seg[-1]
S0_sim = S
a, b = math.exp(-16 / TW), math.exp(-8 / TS)
S0_closed = b * (1 - a) / (1 - a * b)

# 通宵：第 1 天 08:00 醒，一直醒到第 2 天 20:00（44 h）
T_MAIN = 8.0 + np.arange(int(round(36 / H)) + 1) * H
S_MAIN = rk4(S0_sim, 8.0, 44.0, lambda t: False)


def S_closed_awake(hours, s0=S0_closed):
    return 1 - (1 - s0) * math.exp(-hours / TW)


# ---------------- 潮水三条 ----------------
CP_PTS = NJ["model"]["cPoints"]
LOW, AMP = NJ["model"]["cLow"], NJ["model"]["cAmp"]


def pchip_periodic(pts, period=24.0):
    xs = [p[0] for p in pts] + [pts[0][0] + period]
    ys = [p[1] for p in pts] + [pts[0][1]]
    # 周期延拓一格以求两端斜率
    xs2 = [pts[-1][0] - period] + xs + [pts[1][0] + period]
    ys2 = [pts[-1][1]] + ys + [pts[1][1]]
    n = len(xs2)
    h = [xs2[k + 1] - xs2[k] for k in range(n - 1)]
    d = [(ys2[k + 1] - ys2[k]) / h[k] for k in range(n - 1)]
    m = [0.0] * n
    for k in range(1, n - 1):
        if d[k - 1] * d[k] <= 0:
            m[k] = 0.0
        else:
            w1, w2 = 2 * h[k] + h[k - 1], h[k] + 2 * h[k - 1]
            m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k])

    def f(x):
        x = xs2[1] + ((x - xs2[1]) % period)
        k = 1
        while x > xs2[k + 1]:
            k += 1
        s = (x - xs2[k]) / h[k]
        return ((2 * s**3 - 3 * s**2 + 1) * ys2[k] + (s**3 - 2 * s**2 + s) * h[k] * m[k]
                + (-2 * s**3 + 3 * s**2) * ys2[k + 1] + (s**3 - s**2) * h[k] * m[k + 1])
    return f


_cp = pchip_periodic(CP_PTS)


def CP(t):
    return LOW + AMP * _cp(t)


_ct = np.array(NJ["main"]["t"])
_cc = np.array(NJ["main"]["C"])


def CS(t):
    while t < 8.0:
        t += 24.0
    while t > 44.0:
        t -= 24.0
    return float(np.interp(t, _ct, _cc))


def _daan_raw(t, phi):
    w = 2 * math.pi / 24
    x = w * (t - phi)
    return (0.97 * math.sin(x) + 0.22 * math.sin(2 * x) + 0.07 * math.sin(3 * x)
            + 0.03 * math.sin(4 * x) + 0.001 * math.sin(5 * x))


_grid = np.arange(0, 24, 1 / 60)
_raw = np.array([_daan_raw(25.0 - t, 0) for t in _grid])  # 原波形峰在 04:00、谷在 20:00；25−t 反转后峰 21:00、谷 05:00
_rmin, _rmax = _raw.min(), _raw.max()


def CD(t):
    base = LOW + AMP * (_daan_raw(25.0 - t, 0) - _rmin) / (_rmax - _rmin)
    tt = t % 24
    return base - 0.09 * math.exp(-((tt - 15.0) ** 2) / (2 * 1.2 ** 2))


CDarr = np.array([CD(t) for t in _grid])

# ---------------- 关键量 ----------------
def analyse(C, name):
    step = 60  # 每分钟取一次
    tt = T_MAIN[::step]
    ss = S_MAIN[::step]
    cc = np.array([C(t) for t in tt])
    g = ss - cc
    r = {}
    r["name"] = name
    r["g21"] = g[np.searchsorted(tt, 21.0)]
    i_open = np.argmax((g > 0) & (tt > 21))
    r["open"] = tt[i_open]
    night = (tt >= 24) & (tt <= 34)
    i_max = np.where(night)[0][g[night].argmax()]
    r["max"] = (tt[i_max], g[i_max])
    w90 = np.where(night & (g >= 0.9 * g[i_max]))[0]
    r["w90"] = (tt[w90[0]], tt[w90[-1]])
    day = (tt >= 30) & (tt <= 38.5)
    i_rel = np.where(day)[0][g[day].argmin()]
    r["relief"] = (tt[i_rel], g[i_rel], g[i_rel] / g[i_max])
    aft = (tt >= tt[i_rel]) & (tt <= 42)
    i_aft = np.where(aft)[0][g[aft].argmax()]
    r["aft"] = (tt[i_aft], g[i_aft], g[i_aft] / g[i_rel] - 1)
    d2 = (tt >= 24) & (tt <= 44)
    r["median_d2"] = float(np.median(g[(tt >= 24) & (tt <= 44)]))
    r["crash"] = {h: float(g[np.searchsorted(tt, 24 + h)]) for h in (2, 6, 16)}
    wide = d2 & (g >= 0.20)
    segs, start = [], None
    for k in range(len(tt)):
        if wide[k] and start is None:
            start = tt[k]
        if (not wide[k]) and start is not None:
            segs.append((start, tt[k - 1]))
            start = None
    r["wide20"] = segs
    # 第一天对照
    r["d1"] = {h: float(g[np.searchsorted(tt, h)]) for h in (9, 12, 15)}
    # 斜率：06:00、16:00 那一刻缝在变宽还是收窄
    r["slope"] = {h: float(g[np.searchsorted(tt, 24 + h) + 1] - g[np.searchsorted(tt, 24 + h) - 1]) for h in (2, 6, 16)}
    # 留题：21→23 点两股各变了多少
    r["quiz"] = (S_closed_awake(15) - S_closed_awake(13), C(23) - C(21))
    # 没有午后浅坑时下午还会不会“再塌”（只对 CD 有意义：把浅坑拿掉）
    return r


def nap_case(C):
    """平时 08:00 醒，18:00–19:00 补睡 1 小时；不补觉对照。返回（倒掉比例，不补开始困，补了开始困，23:00 两者 S−C）"""
    s_no = rk4(S0_sim, 8.0, 32.0, lambda t: False)
    s_nap = rk4(S0_sim, 8.0, 32.0, lambda t: 18.0 <= t < 19.0)
    tt = 8.0 + np.arange(len(s_no)) * H
    i18, i19 = int(round(10 / H)), int(round(11 / H))
    drop = 1 - s_nap[i19] / s_nap[i18]
    res = []
    for s in (s_no, s_nap):
        g = np.array([s[k] - C(tt[k]) for k in range(0, len(tt), 60)])
        t_ = tt[::60]
        ok = (g > 0) & (t_ > 19.5)
        res.append(t_[np.argmax(ok)] if ok.any() else float("nan"))
    g23 = [float(s[int(round(15 / H))] - C(23.0)) for s in (s_no, s_nap)]
    return drop, s_nap[i18], s_nap[i19], res[0], res[1], g23


def london_case(C):
    """伦敦 07:00 醒（=北京 15:00），伦敦 21:00 = 北京 05:00；对照：北京 07:00 醒、21:00。"""
    s14 = S_closed_awake(14)
    return s14 - C(21.0 + 8.0), s14 - C(21.0)


def sun_noaa_alt(day_of_year, lat=39.90, lon=116.40, tz=8):
    """第三种日出算法：Wikipedia“Sunrise equation”（儒略日写法），和前两轮（NOAA 简化式 / Spencer）不同。"""
    # 2026 年
    jd_noon = 2461041.5 + day_of_year - 1 + 0.5  # 2026-01-01 00:00 UT 的 JD = 2461041.5
    n = math.ceil(jd_noon - 2451545.0 + 0.0008)
    Jstar = n - lon / 360.0
    M = (357.5291 + 0.98560028 * Jstar) % 360
    Mr = math.radians(M)
    Cc = 1.9148 * math.sin(Mr) + 0.02 * math.sin(2 * Mr) + 0.0003 * math.sin(3 * Mr)
    lam = math.radians((M + Cc + 180 + 102.9372) % 360)
    Jtransit = 2451545.0 + Jstar + 0.0053 * math.sin(Mr) - 0.0069 * math.sin(2 * lam)
    dec = math.asin(math.sin(lam) * math.sin(math.radians(23.4397)))
    cosw = (math.sin(math.radians(-0.833)) - math.sin(math.radians(lat)) * math.sin(dec)) / (
        math.cos(math.radians(lat)) * math.cos(dec))
    w = math.degrees(math.acos(cosw))
    rise, set_ = Jtransit - w / 360, Jtransit + w / 360

    def to_local(jd):
        frac = (jd + 0.5) % 1.0
        return (frac * 24 + tz) % 24
    return to_local(rise), to_local(set_)


if __name__ == "__main__":
    print("=" * 72)
    print("一、沙漏 S（RK4，1 秒一步）")
    print(f"  稳态早 8 点 S0：连续模拟 30 天 = {S0_sim:.5f}；闭式解 = {S0_closed:.5f}")
    for h in (8, 21, 23, 24, 29, 32, 39, 44):
        i = int(round((h - 8) / H))
        print(f"  {'第1天' if h < 24 else '第2天'} {hm(h)}：醒 {h - 8:>2} h  RK4 = {S_MAIN[i]:.4f}  闭式 = {S_closed_awake(h - 8):.4f}")
    print(f"  13 = 21 − 8；醒 14 h（伦敦 07→21）S = {S_closed_awake(14):.4f}")

    print("\n二、潮水三条的形状")
    for nm, C in (("CP 控制点重建", CP), ("CS 画面采样", CS), ("CD Daan 谐波 + 浅坑", CD)):
        vals = np.array([C(t) for t in _grid])
        print(f"  {nm:<16} 峰 {hm(_grid[vals.argmax()])} ({vals.max():.3f})  谷 {hm(_grid[vals.argmin()])} ({vals.min():.3f})")
    print(f"  CP 与 CS 最大差 = {max(abs(CP(t) - CS(t)) for t in np.arange(8, 44, 0.01)):.4f}（验证 CP 就是画面曲线）")

    print("\n三、主长卷（困 = S − C）")
    rows = [analyse(C, nm) for nm, C in (("CS 画面", CS), ("CP 重建", CP), ("CD 独立", CD))]
    hdr = "  项目".ljust(22) + "".join(r["name"].ljust(26) for r in rows)
    print(hdr)

    def line(lbl, f):
        print("  " + lbl.ljust(20) + "".join(f(r).ljust(26) for r in rows))
    line("第1天 21:00 S−C", lambda r: f"{r['g21']:+.3f}")
    line("缝第一次打开", lambda r: hm(r["open"]) + ("（次日）" if r["open"] >= 24 else ""))
    line("最困", lambda r: f"{hm(r['max'][0])} {r['max'][1]:+.3f}")
    line("≥90% 时段", lambda r: f"{hm(r['w90'][0])}–{hm(r['w90'][1])}")
    line("缓一口气（最窄）", lambda r: f"{hm(r['relief'][0])} {r['relief'][1]:+.3f} ({r['relief'][2]:.0%})")
    line("下午局部最宽", lambda r: f"{hm(r['aft'][0])} {r['aft'][1]:+.3f} (+{r['aft'][2]:.0%})")
    line("第2天中位数", lambda r: f"{r['median_d2']:+.3f}")
    line("02/06/16 S−C", lambda r: " / ".join(f"{r['crash'][h]:+.3f}" for h in (2, 6, 16)))
    line("02/06/16 变宽?", lambda r: " / ".join("宽" if r["slope"][h] > 0 else "窄" for h in (2, 6, 16)))
    line("S−C≥0.20 的段", lambda r: "，".join(f"{hm(a)}–{hm(b)}" for a, b in r["wide20"]))
    line("第1天 09/12/15", lambda r: " / ".join(f"{r['d1'][h]:+.3f}" for h in (9, 12, 15)))
    line("留题 21→23 ΔS/ΔC", lambda r: f"{r['quiz'][0]:+.3f} / {r['quiz'][1]:+.3f}")

    print("\n  把 CD 的午后浅坑拿掉，第二天下午还会不会“再塌”：")
    def CD_nodip(t):
        return CD(t) + 0.09 * math.exp(-(((t % 24) - 15.0) ** 2) / (2 * 1.2 ** 2))
    r0 = analyse(CD_nodip, "CD 无浅坑")
    print(f"    缓一口气 {hm(r0['relief'][0])} {r0['relief'][1]:+.3f}；之后到 18:00 局部最宽 {hm(r0['aft'][0])} {r0['aft'][1]:+.3f}"
          f"（比最窄 +{r0['aft'][2]:.0%}）")
    # 画面潮水：把 15:00 浅坑填平（控制点 12.5→17.5 线性），看下午还塌不塌
    pts2 = [p for p in CP_PTS if p[0] != 15.0]
    _cp2 = pchip_periodic(pts2)
    r1 = analyse(lambda t: LOW + AMP * _cp2(t), "CP 无浅坑")
    print(f"    画面潮水去掉 15:00 控制点：缓一口气 {hm(r1['relief'][0])} {r1['relief'][1]:+.3f}；"
          f"之后局部最宽 {hm(r1['aft'][0])} {r1['aft'][1]:+.3f}（比最窄 +{r1['aft'][2]:.0%}）")

    print("\n四、迁移")
    for nm, C in (("CS 画面", CS), ("CD 独立", CD)):
        lo, home = london_case(C)
        drop, s18, s19, o_no, o_nap, g23 = nap_case(C)
        print(f"  [{nm}] 伦敦 21:00 S−C = {lo:+.3f}；北京家里 21:00 = {home:+.3f}")
        print(f"  [{nm}] 补觉：S {s18:.3f} → {s19:.3f}（倒掉 {drop:.0%}）；开始困 {hm(o_no)} → {hm(o_nap)}"
              f"（推迟 {round((o_nap - o_no) * 60)} 分钟）；23:00 不补 {g23[0]:+.3f} / 补 {g23[1]:+.3f}")
    # 补觉相当于把沙漏“往回拨”了几小时
    s19 = S_closed_awake(10) * math.exp(-1 / TS)
    t_eq = -TW * math.log((1 - s19) / (1 - S0_closed))
    print(f"  补完觉 19:00 的沙漏 = 平常 {hm(8 + t_eq)} 的沙漏（往回拨了 {19 - 8 - t_eq:.1f} 小时）")
    print(f"  时型：06:01 − 03:50 = {(6 + 1 / 60) - (3 + 50 / 60):.3f} h；06:01 − 05:02 = {(6 + 1 / 60) - (5 + 2 / 60):.3f} h")
    print(f"  CDC 向西 1.5 h/天：8 / 1.5 = {8 / 1.5:.2f} 天")

    print("\n五、北京日出日落（第三种算法：Sunrise equation）")
    import datetime as _dt
    for mth in range(1, 13):
        doy = _dt.date(2026, mth, 15).timetuple().tm_yday
        r_, s_ = sun_noaa_alt(doy)
        print(f"  {mth:>2} 月 15 日：日出 {hm(r_)}  日落 {hm(s_)}  {'日出晚于 05:27' if r_ > 5.45 else '日出早于 05:27'}")

    print("\n六、字幕规则与段落（读 subs.json / beats.json）")
    bad = 0
    for i, s in enumerate(SUBS):
        n = len(s["zh"])
        dur = s["t1"] - s["t0"]
        lim = n / 4 + 1.2
        gap = s["t0"] - SUBS[i - 1]["t1"] if i else None
        flag = []
        if n > 18:
            flag.append("超18字")
        if dur < lim - 1e-9:
            flag.append(f"停留不足 {dur:.2f}<{lim:.2f}")
        if gap is not None and not (0.4 - 1e-9 <= gap <= 1.0 + 1e-9):
            flag.append(f"句间 {gap:.2f}")
        if flag:
            bad += 1
            print(f"  #{i + 1} {s['zh']}：{'，'.join(flag)}")
    tot = sum(len(s["zh"]) for s in SUBS)
    print(f"  共 {len(SUBS)} 句 {tot} 字，违规 {bad} 句；最后一句止 {SUBS[-1]['t1']}s；beats.durationSec = {BEATS['durationSec']}；"
          f"平均 {tot / BEATS['durationSec']:.2f} 字/秒")
    for sec in BEATS["sections"]:
        L = sec["t1"] - sec["t0"]
        print(f"  {sec['id']:<4} {sec['name']:<14} {sec['t0']:>7.2f}–{sec['t1']:>7.2f}  {L:5.2f}s {'超 25 秒!' if L > 25 else ''}")

    print("\n七、镜头与钉子（用 beats.json 的 scroll 关键帧，单调三次插值）")
    sk = [(c[0], c[2]) for c in BEATS["camera"] if c[1] == "scroll"]
    xs, ys = [a for a, _ in sk], [b for _, b in sk]
    # 自写 Fritsch–Carlson（与画面代码同一种插值，用来反算 playhead 到某钟点的时刻）
    n = len(xs)
    hh = [xs[k + 1] - xs[k] for k in range(n - 1)]
    dd = [(ys[k + 1] - ys[k]) / hh[k] for k in range(n - 1)]
    mm = [0.0] * n
    for k in range(1, n - 1):
        if dd[k - 1] * dd[k] > 0:
            w1, w2 = 2 * hh[k] + hh[k - 1], hh[k] + 2 * hh[k - 1]
            mm[k] = (w1 + w2) / (w1 / dd[k - 1] + w2 / dd[k])

    def P(x):
        if x <= xs[0]:
            return ys[0]
        if x >= xs[-1]:
            return ys[-1]
        k = max(i for i in range(n - 1) if xs[i] <= x)
        s = (x - xs[k]) / hh[k]
        return ((2 * s**3 - 3 * s**2 + 1) * ys[k] + (s**3 - 2 * s**2 + s) * hh[k] * mm[k]
                + (-2 * s**3 + 3 * s**2) * ys[k + 1] + (s**3 - s**2) * hh[k] * mm[k + 1])

    def reach(hour):
        for k in range(int(xs[0] * 100), int(xs[-1] * 100) + 1):
            if P(k / 100) >= hour:
                return k / 100
        return None
    for p in BEATS["pins"]:
        print(f"  钉“{p['text']}”@{hm(p['hour'])}：beats showAt {p['showAt']}s，复算 playhead 到达 {reach(p['hour'])}s")
    for nm, hour in (("缝打开 22:54", NJ["keys"]["gapOpen"]), ("日出（天色转粉）", NJ["sky"]["sunrise"] + 24),
                     ("潮水谷底 05:00", 29.0), ("车祸峰 06:00", 30.0)):
        print(f"  playhead 到 {nm}：{reach(hour)}s")
    ev = {e[0]: e[1] for e in BEATS["events"]}
    k_open = [k for k in ev if k.startswith("缝第一次打开")][0]
    print(f"  beats 事件“缝第一次打开”写的是 {ev[k_open]}s")
    for i, s in enumerate(SUBS[8:15], start=9):
        print(f"  字幕 #{i} 出现 {s['t0']:>6.2f}s 时 playhead = {hm(P(s['t0']))}；结束 {s['t1']:>6.2f}s 时 = {hm(P(s['t1']))}  {s['zh']}")
