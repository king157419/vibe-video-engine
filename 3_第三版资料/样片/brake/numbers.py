"""样片一《最后几米》（brake）——片中所有数字的唯一来源。

用法：
    D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe numbers.py          # 打印全部数字表
    D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe numbers.py --json    # 另外写出 public/v3/brake/numbers.json 给画面代码用

只用标准库。所有物理都是“反应段匀速 + 刹车段匀减速”，公式 v² = v0² − 2·a·x。

【和方案 §2.2 的差异（以计算为准）】
方案把“人到车的距离”默认取 34.6 米（= 50 码的停车距离），旁白却说“35 米”，两者差 0.4 米，
导致 60 码撞线速度一会儿是 43（按 34.6），一会儿是 42（按 35）。本片统一取：

    人在 35.0 米处（旁白、画面、计算都用这一个数）

于是：
  * 50 码那辆停在 34.6 米处，离人还有 0.4 米 —— “刚好停住”成立；
  * 60 码那辆开始刹车时离人正好 10.0 米（方案写 9.6），撞上时 42 码（方案写 43），
    刹了 0.70 秒（方案写 0.67，方案一句话里写的 0.7 反而对上了）；
  * 60 码到人跟前时，用掉了自己刹车路的 50%（方案写 48%）；
  * 押注卡 A 的算法“同样 35 米、减掉同样的 50 码”现在正好得 10 码，不再依赖 34.6 这个数。
其余数字（雨天 35 码、半程 35 码、留题 38 码、反应 1.0 秒时 40 码、不算反应 33 码）与方案一致。
方案原来的 34.6 米口径也在 §6 里算出来（43 码），作为对照。
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

KMH = 3.6  # 1 m/s = 3.6 km/h（“码”）

# ───────────────────────── 0. 全片唯一的一组假设 ─────────────────────────
T_REACT = 1.5      # s   反应时间（突发、从侧面闯入：Green 2000 的最佳估计）
A_DRY = 7.0        # m/s² 干燥沥青紧急制动减速度（示意；约 0.71 g）
A_WET = 3.5        # m/s² 雨天湿路（示意；= 干路的一半，即刹车段长度翻倍）
D_PERSON = 35.0    # m   看见人的那一刻，车头到人的距离
DOT_DT = 0.2       # s   漆点间隔（路面版“打点计时器”）
V_SLOW, V_FAST = 50.0, 60.0  # 码（km/h）

# 画面比例（方案 §2.3：约 34 像素 = 1 米；斑马线在画面约 3/4 处）
PX_PER_M = 34.0
X_PERSON_PX = 1440.0
X0_PX = X_PERSON_PX - D_PERSON * PX_PER_M  # “看见人”那一刻车头所在的屏幕 x


def ms(kmh: float) -> float:
    return kmh / KMH


def kmh(v: float) -> float:
    return v * KMH


def braking_distance(v0_kmh: float, a: float) -> float:
    return ms(v0_kmh) ** 2 / (2 * a)


def speed_after(v0_kmh: float, a: float, x: float) -> float:
    """刹车段走了 x 米后的速度（码）；停住后为 0。"""
    v2 = ms(v0_kmh) ** 2 - 2 * a * x
    return kmh(math.sqrt(v2)) if v2 > 0 else 0.0


def scenario(v0_kmh: float, a: float = A_DRY, t_react: float = T_REACT, d: float = D_PERSON) -> dict:
    v0 = ms(v0_kmh)
    react = v0 * t_react
    remain = d - react
    sb = braking_distance(v0_kmh, a)
    stops = sb <= remain + 1e-9
    if remain <= 0:
        v_hit, t_brake = v0_kmh, 0.0
    elif stops:
        v_hit, t_brake = 0.0, v0 / a
    else:
        v_hit = speed_after(v0_kmh, a, remain)
        t_brake = (v0 - ms(v_hit)) / a
    return {
        "v0": v0_kmh, "a": a, "t_react": t_react, "d": d,
        "react": react, "remain": remain, "brake_dist": sb, "stop_dist": react + sb,
        "stops": stops, "gap": remain - sb if stops else None,
        "v_hit": v_hit, "t_brake": t_brake, "t_total_brake": v0 / a,
        "frac_used": (min(remain, sb) / sb) if sb > 0 else 0.0,
    }


def dots(v0_kmh: float, a: float = A_DRY, t_react: float = T_REACT, d: float = D_PERSON, dt: float = DOT_DT) -> list[dict]:
    """漆点：时钟以“踩下刹车”为 0，向前（反应段）、向后（刹车段）每 dt 秒一个点。
    x = 离“看见人”那一刻的距离（米）；到人或停住为止。"""
    v0 = ms(v0_kmh)
    out = []
    k = -int(math.floor(t_react / dt + 1e-9))
    if abs(k * dt + t_react) < 1e-9:  # 反应时间正好是 dt 的整数倍时，第一个点就是“看见”那一刻
        pass
    t_stop = v0 / a
    while True:
        tb = round(k * dt, 6)
        if tb < -t_react - 1e-9:
            k += 1
            continue
        if tb <= 0:
            x = v0 * (t_react + tb)
            v = v0
            phase = "反应"
        else:
            tt = min(tb, t_stop)
            x = v0 * t_react + v0 * tt - 0.5 * a * tt * tt
            v = max(0.0, v0 - a * tt)
            phase = "刹车"
        if x > d + 1e-9:
            break
        out.append({"tb": tb, "t": round(t_react + tb, 6), "x": x, "to_person": d - x, "v": kmh(v), "phase": phase})
        if phase == "刹车" and tb >= t_stop - 1e-9:
            break
        k += 1
    return out


def fmt(x: float, n: int = 1) -> str:
    return f"{x:.{n}f}"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    J: dict = {"assumptions": {"t_react": T_REACT, "a_dry": A_DRY, "a_wet": A_WET, "d_person": D_PERSON,
                               "dot_dt": DOT_DT, "px_per_m": PX_PER_M, "x0_px": X0_PX, "x_person_px": X_PERSON_PX}}
    P = print

    P("=" * 72)
    P("§0 假设（右下角角标）")
    P(f"  反应 {T_REACT} 秒 · 干燥沥青 · 刹车每秒少 {fmt(kmh(A_DRY))} 码（{A_DRY} m/s²）· 人在 {D_PERSON} 米外 · 计算示意")
    P(f"  每个漆点（{DOT_DT} 秒）少 {fmt(kmh(A_DRY) * DOT_DT, 2)} 码 → 画面写“少 5 码”")
    P(f"  雨天示意：{A_WET} m/s²，每秒少 {fmt(kmh(A_WET))} 码，每个漆点少 {fmt(kmh(A_WET) * DOT_DT, 2)} 码")

    # ── §1 主场景 ──
    P("=" * 72)
    P("§1 主场景：两辆一样的车，人在 35 米外")
    S = {v: scenario(v) for v in (V_SLOW, V_FAST)}
    rows = [
        ("反应 1.5 秒里冲出去", "react", "米"),
        ("开始刹车时离人还有", "remain", "米"),
        ("自己刹停需要的刹车距离", "brake_dist", "米"),
        ("总停车距离（反应+刹车）", "stop_dist", "米"),
        ("到人跟前时已经刹了", "t_brake", "秒"),
        ("到人跟前时的速度", "v_hit", "码"),
    ]
    P(f"  {'':24s}{'50 码':>10s}{'60 码':>10s}")
    for name, key, unit in rows:
        a, b = S[V_SLOW][key], S[V_FAST][key]
        P(f"  {name:22s}{fmt(a, 2):>10s}{fmt(b, 2):>10s}  {unit}")
    P(f"  50 码：停住，车头离人还有 {fmt(S[V_SLOW]['gap'], 2)} 米（“刚好停住”）")
    extra = S[V_FAST]["react"] - S[V_SLOW]["react"]
    P(f"  60 码比 50 码在反应段多冲出去 {fmt(extra, 2)} 米 → 画面“多冲 4.2 米”")
    P(f"  60 码撞上时 {fmt(S[V_FAST]['v_hit'], 2)} 码 → 红色读数“42”；少掉了 {fmt(V_FAST - S[V_FAST]['v_hit'], 2)} 码")
    P(f"  60 码到人跟前时，用掉了自己刹车路的 {fmt(S[V_FAST]['frac_used'] * 100, 1)}%（{fmt(S[V_FAST]['remain'], 1)} / {fmt(S[V_FAST]['brake_dist'], 1)} 米）")
    P(f"  50 码刹停用时 {fmt(S[V_SLOW]['t_total_brake'], 3)} 秒；60 码若不撞要 {fmt(S[V_FAST]['t_total_brake'], 3)} 秒")
    P(f"  从看见人到撞上：60 码 {fmt(T_REACT + S[V_FAST]['t_brake'], 2)} 秒；50 码从看见到停住 {fmt(T_REACT + S[V_SLOW]['t_total_brake'], 2)} 秒")
    J["main"] = {str(int(v)): S[v] for v in S}

    # ── §2 漆点 ──
    P("=" * 72)
    P("§2 漆点表（tb=以踩刹车为 0 的时刻；x=离“看见人”那一刻的距离；px=俯视画面横坐标）")
    J["dots"] = {}
    for v in (V_SLOW, V_FAST):
        ds = dots(v)
        J["dots"][str(int(v))] = ds
        P(f"  —— {int(v)} 码 ——")
        prev = None
        for d in ds:
            gap = "" if prev is None else f"  间距 {fmt(d['x'] - prev, 2)} 米"
            P(f"   {d['phase']} tb={d['tb']:+.1f}s  x={d['x']:6.2f} m  离人 {d['to_person']:5.2f} m  "
              f"v={d['v']:5.2f}（读数 {round(d['v'])}）  px={X0_PX + d['x'] * PX_PER_M:7.1f}{gap}")
            prev = d["x"]
        if v == V_FAST:
            s = S[V_FAST]
            P(f"   到人  tb=+{s['t_brake']:.3f}s  x={D_PERSON:6.2f} m  v={s['v_hit']:.2f}（读数 {round(s['v_hit'])}，红色）  px={X_PERSON_PX:.1f}")
        else:
            s = S[V_SLOW]
            P(f"   停住  tb=+{s['t_total_brake']:.3f}s  x={s['stop_dist']:6.2f} m  离人 {s['gap']:.2f} m")
    n_fast_brake = sum(1 for d in J["dots"]["60"] if d["phase"] == "刹车" and d["tb"] > 0)
    P(f"  60 码踩下刹车后到撞上，只滴了 {n_fast_brake} 个点（55/50/45）")

    # ── §3 押注卡 A 的算法与卡点 ──
    P("=" * 72)
    P("§3 押注卡 A（约 10 码）：“同样 35 米、同样的刹车，就减掉同样多的速度”= 速度按米均匀掉")
    loss_per_m = V_SLOW / D_PERSON
    a_pred = V_FAST - loss_per_m * D_PERSON
    a_stop = V_FAST / loss_per_m
    P(f"  50 码在 35 米里减掉 50 码 → 每米 {fmt(loss_per_m, 3)} 码；60 码同样 35 米也减掉 50 码 → 剩 {fmt(a_pred, 2)} 码（= 卡 A）")
    P(f"  这个想法等价于：60 码的停车距离 = {fmt(a_stop, 1)} 米 = 50 码的 {fmt(a_stop / D_PERSON, 2)} 倍（“只长两成”）")
    P(f"  画面灰线：白道 50→0 跨 0–35 米；黄道 60→10 跨 0–35 米（两条平行线 = 每米少得一样多）")
    s50 = S[V_SLOW]
    half = s50["brake_dist"] / 2
    v_half = speed_after(V_SLOW, A_DRY, half)
    t_half = (ms(V_SLOW) - ms(v_half)) / A_DRY
    P("  卡点（只看 50 码踩下刹车之后那一段，给误解最公平的检验）：")
    P(f"    刹车路 {fmt(s50['brake_dist'], 2)} 米，一半 = {fmt(half, 2)} 米（离看见点 {fmt(s50['react'] + half, 2)} 米）")
    P(f"    按米均匀掉：一半处应剩 {fmt(V_SLOW / 2, 1)} 码；实际 {fmt(v_half, 2)} 码 → 小旗“该剩 25｜实际 35”")
    P(f"    前一半路少了 {fmt(V_SLOW - v_half, 2)} 码，用时 {fmt(t_half, 3)} 秒；后一半路少了 {fmt(v_half, 2)} 码，用时 {fmt(s50['t_total_brake'] - t_half, 3)} 秒")
    ds50 = J["dots"]["50"]
    brake_dots = [d for d in ds50 if d["phase"] == "刹车" or d["tb"] == 0]
    first = [d for d in brake_dots if d["x"] - s50["react"] <= half + 1e-9]
    second = [d for d in brake_dots if d["x"] - s50["react"] > half + 1e-9]
    P(f"    刹车段的点：前一半路 {len(first)} 个（{', '.join(str(round(d['v'])) for d in first)}），"
      f"后一半路 {len(second)} 个（{', '.join(str(round(d['v'])) for d in second)}；最后一个是停住处）")
    v_1m = speed_after(V_SLOW, A_DRY, 1.0)
    v_last1 = speed_after(V_SLOW, A_DRY, s50["brake_dist"] - 1.0)
    P(f"    刹车第一米少 {fmt(V_SLOW - v_1m, 2)} 码；最后一米少 {fmt(v_last1, 2)} 码（按米看极不均匀）")
    t_first1 = (ms(V_SLOW) - ms(v_1m)) / A_DRY
    t_last1 = ms(v_last1) / A_DRY
    P(f"    刹车第一米用时 {fmt(t_first1, 3)} 秒；最后一米用时 {fmt(t_last1, 3)} 秒（{fmt(t_last1 / t_first1, 1)} 倍）→ “最后几米，每一米都更费时间”")
    v_2m = speed_after(V_SLOW, A_DRY, 2.0)
    v_last2 = speed_after(V_SLOW, A_DRY, s50["brake_dist"] - 2.0)
    P(f"    刹车头 2 米用时 {fmt((ms(V_SLOW) - ms(v_2m)) / A_DRY, 3)} 秒；最后 2 米用时 {fmt(ms(v_last2) / A_DRY, 3)} 秒")
    P(f"    匀速段（反应段）：50 码每米用时 {fmt(1 / ms(50), 3)} 秒、每 0.2 秒走 {fmt(ms(50) * DOT_DT, 2)} 米，处处相同 → “匀速时，米和秒是一回事”")
    J["per_meter_time"] = {"first_1m": t_first1, "last_1m": t_last1}
    spacing_first = ds50[[d['tb'] for d in ds50].index(0.2)]["x"] - s50["react"]
    P(f"    刹车段第一段点距 {fmt(spacing_first, 2)} 米；反应段点距 50 码 {fmt(ms(50) * DOT_DT, 2)} 米、60 码 {fmt(ms(60) * DOT_DT, 2)} 米")
    J["card_a"] = {"pred": a_pred, "loss_per_m": loss_per_m, "stop_60_a": a_stop,
                   "half_x": half, "v_half": v_half, "t_half": t_half, "v_half_naive": V_SLOW / 2}
    # 对照：把反应段算对、刹车段按米均匀减、刹车距离与车速成正比（≈ 卡 B 的量级）
    sb60_lin = s50["brake_dist"] * V_FAST / V_SLOW
    rem60 = S[V_FAST]["remain"]
    v_b = V_FAST * (1 - rem60 / sb60_lin)
    P(f"  对照（只在说明文件里用）：反应段算对 + 刹车段按米均匀 → 60 码刹车路 {fmt(sb60_lin, 1)} 米，撞上 {fmt(v_b, 1)} 码（≈ 卡 B 的量级）")
    J["card_b_like"] = v_b

    # ── §4 规则 ──
    P("=" * 72)
    P("§4 规则：刹车路走完四分之三，速度还剩一半（v ∝ √剩余距离）")
    for v in (V_SLOW, V_FAST):
        sb = braking_distance(v, A_DRY)
        P(f"  {int(v)} 码：刹车路 {fmt(sb, 2)} 米，走完 3/4（{fmt(0.75 * sb, 2)} 米）时 {fmt(speed_after(v, A_DRY, 0.75 * sb), 2)} 码 = 初速的一半；"
          f"前一半时间走了 {fmt(0.75 * sb, 2)} 米 = 3/4 的路")
    x34 = s50["react"] + 0.75 * s50["brake_dist"]
    P(f"  画面：50 码曲线上的 3/4 标记 x = {fmt(x34, 2)} 米 → {fmt(X0_PX + x34 * PX_PER_M, 1)} px，高度 = 25 码")
    last_q = [d for d in J["dots"]["50"] if d["phase"] == "刹车" and d["x"] >= x34 - 1e-9]
    P(f"  50 码最后 1/4 刹车路（{fmt(0.75 * s50['brake_dist'], 2)}–{fmt(s50['brake_dist'], 2)} 米）用时 {fmt(s50['t_total_brake'] / 2, 3)} 秒 = 刹车时间的一半；"
      f"其中的点：tb = {last_q[0]['tb']}…{last_q[-1]['tb']} 秒，共 {len(last_q)} 个（含停住处）")
    curve = [{"x": s50["react"] + i / 20 * s50["brake_dist"], "v": speed_after(V_SLOW, A_DRY, i / 20 * s50["brake_dist"])} for i in range(21)]
    J["curve_50"] = curve
    J["rule_marker_50"] = {"x": x34, "px": X0_PX + x34 * PX_PER_M, "v": V_SLOW / 2}
    P("  （曲线采样点已写入 numbers.json 的 curve_50）")

    # ── §5 敏感性 ──
    P("=" * 72)
    P("§5 敏感性（简介里用）：情景都定义为“50 码刚好停在人面前”，即人放在 50 码的停车距离处")
    sens = []
    for tr in (1.5, 1.0, 0.0):
        d = scenario(V_SLOW, t_react=tr)["stop_dist"]
        s = scenario(V_FAST, t_react=tr, d=d)
        sens.append({"t_react": tr, "a": A_DRY, "d": d, "v_hit": s["v_hit"]})
        P(f"  反应 {tr} 秒，减速度 {A_DRY}：人在 {fmt(d, 2)} 米，60 码撞上 {fmt(s['v_hit'], 2)} 码")
    for a in (6.0, 8.0, 9.0):
        d = scenario(V_SLOW, a=a)["stop_dist"]
        s = scenario(V_FAST, a=a, d=d)
        sens.append({"t_react": T_REACT, "a": a, "d": d, "v_hit": s["v_hit"]})
        P(f"  反应 {T_REACT} 秒，减速度 {a}：人在 {fmt(d, 2)} 米，60 码撞上 {fmt(s['v_hit'], 2)} 码")
    P("  另一种口径：人固定在 35 米，只换减速度（刹车更好的车，50 码会提前停住，60 码撞上时也更慢）")
    for a in (6.0, 8.0, 9.0):
        s5, s6 = scenario(V_SLOW, a=a), scenario(V_FAST, a=a)
        gap = f"停住，离人 {fmt(s5['gap'], 2)} 米" if s5["stops"] else f"撞上 {fmt(s5['v_hit'], 1)} 码"
        P(f"  人在 35 米，减速度 {a}：50 码{gap}；60 码撞上 {fmt(s6['v_hit'], 2)} 码")
        sens.append({"t_react": T_REACT, "a": a, "d": D_PERSON, "v_hit": s6["v_hit"], "fixed_d": True})
    s346 = scenario(V_FAST, d=S[V_SLOW]["stop_dist"])
    P(f"  方案原口径（人在 {fmt(S[V_SLOW]['stop_dist'], 2)} 米）：60 码离人 {fmt(s346['remain'], 2)} 米开始刹，"
      f"刹 {fmt(s346['t_brake'], 3)} 秒，撞上 {fmt(s346['v_hit'], 2)} 码，用掉刹车路 {fmt(s346['frac_used'] * 100, 1)}%")
    J["sensitivity"] = sens

    # ── §6 雨天 ──
    P("=" * 72)
    P("§6 近迁移：雨天（示意 3.5 m/s²）同一辆 50 码、同样 35 米")
    w = scenario(V_SLOW, a=A_WET)
    P(f"  反应段 {fmt(w['react'], 2)} 米，离人 {fmt(w['remain'], 2)} 米开始刹；雨天刹车路需要 {fmt(w['brake_dist'], 2)} 米（干路 {fmt(S[V_SLOW]['brake_dist'], 2)} 米的 {fmt(w['brake_dist'] / S[V_SLOW]['brake_dist'], 2)} 倍）")
    P(f"  撞上时 {fmt(w['v_hit'], 2)} 码（读数 {round(w['v_hit'])}），已刹 {fmt(w['t_brake'], 3)} 秒；雨天总停车距离 {fmt(w['stop_dist'], 2)} 米")
    wd = dots(V_SLOW, a=A_WET)
    P("  雨天漆点：" + "，".join(f"{round(d['v'])}" for d in wd if d["phase"] == "刹车" or d["tb"] == 0))
    J["rain"] = {**w, "dots": wd}

    # ── §7 远迁移：上抛球 ──
    P("=" * 72)
    G, V_BALL, BALL_DT = 9.8, 9.8, 0.1
    T_up = V_BALL / G
    H = V_BALL ** 2 / (2 * G)
    P(f"§7 远迁移：竖直上抛（不计空气阻力），初速 {V_BALL} m/s（≈{fmt(kmh(V_BALL))} 码），每 {BALL_DT} 秒一个点")
    P(f"  上升用时 {fmt(T_up, 2)} 秒，最高 {fmt(H, 2)} 米；每个点速度少 {fmt(G * BALL_DT, 2)} m/s（≈{fmt(kmh(G * BALL_DT), 2)} 码）")
    ball = []
    for i in range(int(round(T_up / BALL_DT)) + 1):
        t = i * BALL_DT
        h = V_BALL * t - 0.5 * G * t * t
        ball.append({"t": round(t, 2), "h": h, "v": V_BALL - G * t})
        P(f"   t={t:.1f}s  h={h:5.3f} m  v={V_BALL - G * t:4.2f} m/s")
    top_q = 0.75 * H
    t_q = (V_BALL - math.sqrt(V_BALL ** 2 - 2 * G * top_q)) / G
    n_top = sum(1 for b in ball if b["h"] >= top_q - 1e-9)
    P(f"  最上面 1/4 高度（{fmt(top_q, 3)} 米以上）从 t={fmt(t_q, 3)} 秒开始，占上升时间的 {fmt((T_up - t_q) / T_up * 100, 1)}%；"
      f"里面有 {n_top} 个点（共 {len(ball)} 个）")
    J["ball"] = {"v0": V_BALL, "g": G, "dt": BALL_DT, "T_up": T_up, "H": H, "points": ball, "t_top_quarter": t_q}

    # ── §8 小卡 ──
    P("=" * 72)
    P("§8 落地小卡")
    r = (35 / 25) ** 2
    P(f"  电动车 25→35 码：刹车段长度比 (35/25)² = {fmt(r, 2)}（刹车能力不变时）；反应段比 35/25 = {fmt(35 / 25, 2)}")
    for v in (60, 50, 40):
        P(f"  看手机 2 秒：{v} 码 = 盲开 {fmt(ms(v) * 2, 1)} 米")
    for v in (30, 50, 60, 100):
        s = scenario(v)
        P(f"  {v} 码：反应段 {fmt(s['react'], 2)} 米，刹车段 {fmt(s['brake_dist'], 2)} 米，反应段占 {fmt(s['react'] / s['stop_dist'] * 100, 0)}%")
    J["cards"] = {"ebike_ratio": r, "phone_60_2s": ms(60) * 2,
                  "low_30": {"react": scenario(30)["react"], "brake": scenario(30)["brake_dist"]},
                  # 画面代码用（边界卡 2、卡 3）：刹车段长度、反应段/刹车段分段条
                  "ebike_brake": {"25": braking_distance(25, A_DRY), "35": braking_distance(35, A_DRY)},
                  "split": {str(v): {"react": scenario(v)["react"], "brake": scenario(v)["brake_dist"],
                                     "share": scenario(v)["react"] / scenario(v)["stop_dist"]} for v in (30, 50, 60)},
                  "phone_dots": 11}

    # ── §9 留题 ──
    P("=" * 72)
    P("§9 结尾留题：30 码刚好停在孩子面前，换成 40 码")
    q = []
    for tr in (1.5, 1.0):
        d = scenario(30, t_react=tr)["stop_dist"]
        s = scenario(40, t_react=tr, d=d)
        q.append({"t_react": tr, "d": d, "v_hit": s["v_hit"], "remain": s["remain"]})
        P(f"  反应 {tr} 秒：孩子在 {fmt(d, 2)} 米；40 码开始刹车时离孩子 {fmt(s['remain'], 2)} 米，撞上 {fmt(s['v_hit'], 2)} 码")
    P(f"  40 码在反应段多冲出去 {fmt(ms(10) * 1.5, 2)} 米；30 码整段刹车路只有 {fmt(braking_distance(30, A_DRY), 2)} 米 → 答案 C（将近 40）")
    J["quiz"] = q
    # 画面代码用：留题迷你场景里 30 码那条道的漆点（40 码那条只画起点和“?”，不泄露答案）
    d_kid = scenario(30)["stop_dist"]
    J["quiz_dots"] = {"30": dots(30, d=d_kid), "40": dots(40, d=d_kid), "d_kid": d_kid}

    # ── §10 画面时长参考 ──
    P("=" * 72)
    P("§10 画面时长参考（物理时间 → 屏幕时间）")
    for slow in (0.6,):
        P(f"  白车刹车段 {fmt(S[V_SLOW]['t_total_brake'], 3)} 秒 ÷ {slow} = {fmt(S[V_SLOW]['t_total_brake'] / slow, 2)} 秒屏幕时间")
        P(f"  黄车刹车段 {fmt(S[V_FAST]['t_brake'], 3)} 秒 ÷ {slow} = {fmt(S[V_FAST]['t_brake'] / slow, 2)} 秒屏幕时间")
    P(f"  60 码整条停车路 {fmt(S[V_FAST]['stop_dist'], 1)} 米 → 屏幕 x = {fmt(X0_PX + S[V_FAST]['stop_dist'] * PX_PER_M, 0)} px（画面宽 1920）")
    P(f"  雨天 50 码整条停车路 {fmt(w['stop_dist'], 1)} 米 → 屏幕 x = {fmt(X0_PX + w['stop_dist'] * PX_PER_M, 0)} px")

    if "--json" in sys.argv:
        out = Path(__file__).resolve().parents[3] / "video-engine" / "public" / "v3" / "brake" / "numbers.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(J, ensure_ascii=False, indent=1), encoding="utf-8")
        P(f"\n已写出 {out}")


if __name__ == "__main__":
    main()
