# -*- coding: utf-8 -*-
"""
第二轮审稿 · 独立重算（不读 numbers.py，也不读第一轮的 审稿_独立重算.py）

两种和 numbers.py（解析式）不同的写法：
  方法 T：按时间逐步积分（前向欧拉：先用旧速度挪位置，再减速度），步长 0.001 s，再用 0.0001 s 看收敛；
  方法 S：按距离逐步积分（每走 dx = 0.0005 m，花 dt = dx / v 秒，速度减 a·dt），完全不用时间网格。
只用来核对，片中数字仍只以 numbers.py → numbers.json 为准。
运行：D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe 审稿_第二轮_独立重算.py
"""
import json, os, sys

KMH = 3.6
A_DRY, A_WET, T_REACT, D_PERSON, DOT = 7.0, 3.5, 1.5, 35.0, 0.2


def run_T(v0_kmh, a, t_react, d_person, dt, dot_dt=DOT, stop_at_person=True):
    """前向欧拉逐步积分。返回 dict：撞线速度/时间、停住距离、漆点列表等。"""
    v = v0_kmh / KMH
    x = t = 0.0
    dots, nxt = [], dot_dt
    hit = None
    eps = 1e-9
    while True:
        braking = t >= t_react - eps
        acc = -a if braking else 0.0
        # 前向欧拉：位置用旧速度
        x_new = x + v * dt
        v_new = max(0.0, v + acc * dt)
        t_new = t + dt
        if hit is None and x_new >= d_person and x < d_person:
            f = (d_person - x) / (x_new - x)
            hit = dict(v=(v + f * (v_new - v)) * KMH, t=t + f * dt, tb=t + f * dt - t_react)
            if stop_at_person and v > 0:
                pass
        while t_new >= nxt - eps and nxt <= 6.0:
            f = (nxt - t) / dt
            dots.append(dict(t=round(nxt, 3), x=x + f * (x_new - x), v=(v + f * (v_new - v)) * KMH))
            nxt = round(nxt + dot_dt, 6)
        x, v, t = x_new, v_new, t_new
        if v <= 0 and braking:
            break
        if t > 20:
            break
    return dict(stop_x=x, stop_t=t, hit=hit, dots=dots)


def run_S(v0_kmh, a, t_react, d_person, dx=0.0005):
    """按距离逐步积分：每走 dx，用当前速度算花了多少时间，再按时间扣速度。"""
    v = v0_kmh / KMH
    x = t = 0.0
    hit = None
    marks = {}
    while v > 1e-6:
        if t < t_react:
            dt = dx / v
            if t + dt > t_react:  # 正好跨过“踩刹车”那一刻
                dt = t_react - t
                x += v * dt
                t = t_react
                marks['brake_x'] = x
                continue
            x += dx
            t += dt
        else:
            # 半隐式：用这一小段的平均速度近似（v 与 v-a·dt 的平均），解 dx = (v - a dt/2) dt
            # 速度太小时直接用剩余能量收尾
            disc = v * v - 2 * a * dx
            if disc <= 0:
                t += v / a
                x += v * v / (2 * a)
                v = 0.0
                break
            # 这里仍是“逐步”的：dt 由当前 v 和 dx 决定（取 dx/v 的一阶近似 + 迭代 3 次修正）
            dt = dx / v
            for _ in range(3):
                dt = dx / (v - a * dt / 2)
            v -= a * dt
            x += dx
            t += dt
        if hit is None and x >= d_person:
            hit = dict(v=v * KMH, t=t, tb=t - t_react)
    return dict(stop_x=x, stop_t=t, hit=hit, brake_x=marks.get('brake_x'))


def brake_only_profile(v0_kmh, a, dt):
    """只看刹车段（从踩下刹车起），前向欧拉，记录 (t, x, v)。"""
    v = v0_kmh / KMH
    x = t = 0.0
    out = [(0.0, 0.0, v)]
    while v > 0:
        x += v * dt
        v = max(0.0, v - a * dt)
        t += dt
        out.append((t, x, v))
    return out


def t_at_x(prof, xq):
    for (t0, x0, v0), (t1, x1, v1) in zip(prof, prof[1:]):
        if x1 >= xq:
            f = (xq - x0) / (x1 - x0) if x1 > x0 else 0
            return t0 + f * (t1 - t0), (v0 + f * (v1 - v0)) * KMH
    return prof[-1][0], 0.0


def main():
    R = {}
    for dt in (0.001, 0.0001):
        r = {}
        for v0 in (50, 60):
            r[v0] = run_T(v0, A_DRY, T_REACT, D_PERSON, dt)
        R[dt] = r
    S = {v0: run_S(v0, A_DRY, T_REACT, D_PERSON) for v0 in (50, 60)}

    print('=' * 72)
    print('主场景：反应 1.5 s，7 m/s²，人在 35 m')
    for dt in (0.001, 0.0001):
        r = R[dt]
        h60 = r[60]['hit']
        print(f'[T dt={dt}] 50码停住 x={r[50]["stop_x"]:.3f} m（离人 {D_PERSON - r[50]["stop_x"]:.3f}）'
              f'  刹车用时 {r[50]["stop_t"] - T_REACT:.3f} s'
              f' | 60码撞线 {h60["v"]:.3f} 码，刹了 {h60["tb"]:.4f} s')
    s50, s60 = S[50], S[60]
    print(f'[S dx=0.0005] 50码停住 x={s50["stop_x"]:.3f} m，刹车用时 {s50["stop_t"] - T_REACT:.4f} s'
          f' | 60码撞线 {s60["hit"]["v"]:.3f} 码，刹了 {s60["hit"]["tb"]:.4f} s；60码刹车点 {s60["brake_x"]:.3f} m')
    r50b = 50 / KMH * T_REACT
    r60b = 60 / KMH * T_REACT
    print(f'反应段：50码 {r50b:.3f} m，60码 {r60b:.3f} m，多冲 {r60b - r50b:.3f} m；60码刹车时离人 {D_PERSON - r60b:.3f} m')

    print('\n（对照，片中不用这个网格）按“看见人”起每 0.2 s 取点，60 码刹车段：')
    for d in R[0.0001][60]['dots']:
        if T_REACT < d['t'] <= T_REACT + 0.71:
            print(f'   t={d["t"]:.1f}s  x={d["x"]:.2f} m  v={d["v"]:.2f} 码')
    print('（对照，同上网格）50 码全部点：')
    print('   ' + '  '.join(f'{d["t"]:.1f}s:{d["x"]:.2f}m/{d["v"]:.1f}' for d in R[0.0001][50]['dots'] if d['t'] <= 3.5))

    # 片中的漆点网格对齐“踩刹车”那一刻（tb = 0, ±0.2, …），反应段第一个点在看见人后 0.1 s
    print('\n按“踩刹车”对齐的漆点（dt=0.0001，tb = t - 1.5）：')
    for v0, a_ in ((50, A_DRY), (60, A_DRY), (50, A_WET)):
        rr = run_T(v0, a_, T_REACT, D_PERSON, 0.0001, dot_dt=0.1)
        sel = [d for d in rr['dots'] if abs(((d['t'] - T_REACT) / 0.2) - round((d['t'] - T_REACT) / 0.2)) < 1e-6
               and d['t'] >= T_REACT - 1e-6 and d['x'] <= D_PERSON + 1e-6]
        lab = f'{v0}码 a={a_}'
        print(f'  {lab}: ' + '  '.join(f'tb={d["t"] - T_REACT:.1f}:{d["x"]:.2f}m/{d["v"]:.2f}' for d in sel))

    # 刹车段内部的比例
    prof = brake_only_profile(50, A_DRY, 0.0001)
    D = prof[-1][1]
    T = prof[-1][0]
    th, vh = t_at_x(prof, D / 2)
    t34, v34 = t_at_x(prof, D * 0.75)
    t1, _ = t_at_x(prof, 1.0)
    tl, _ = t_at_x(prof, D - 1.0)
    print('\n50 码刹车段（只看刹车，dt=0.0001）')
    print(f'  刹车距离 {D:.3f} m，用时 {T:.4f} s')
    print(f'  走到一半（{D/2:.3f} m）：速度 {vh:.2f} 码（按米均匀应为 25）；前一半用时 {th:.3f} s，后一半 {T - th:.3f} s')
    print(f'  走完 3/4：速度 {v34:.2f} 码（应为一半 25）；用时 {t34:.3f} s = 总时间的 {t34 / T:.1%}')
    print(f'  第一米用时 {t1:.4f} s；最后一米用时 {T - tl:.4f} s；倍数 {(T - tl) / t1:.2f}')
    print(f'  前一半路的点数（tb=0.2,0.4,…≤{th:.3f}）：{int(th / 0.2 + 1e-9)}；后一半（含停住处）：{int(round(T / 0.2)) - int(th / 0.2 + 1e-9)}')

    # 押注卡
    print('\n押注卡')
    print(f'  A 相减：60-50 = 10；等价每米少 {50/35:.3f} 码，60 码在 {60/(50/35):.1f} m 停 = 50 码 35 m 的 {60/50:.2f} 倍')
    # B 类：反应段算对、刹车段按米均匀（每米少 50/13.78）
    per_m = 50 / D
    print(f'  B 类（反应对、刹车段按米均匀）：60 - {per_m:.3f}×10 = {60 - per_m * 10:.2f} 码')
    print(f'  取平均：(60+50)/2 = 55 码')
    # 只改“按米→按秒”、不算反应：人在 35 m，50 码恰好停在 35 m 需要的减速度
    a_eq = (50 / KMH) ** 2 / (2 * 35)
    v_eq = max(0, (60 / KMH) ** 2 - 2 * a_eq * 35) ** 0.5 * KMH
    print(f'  只把“按米”改“按秒”、仍不算反应（a={a_eq:.3f}）：60 码撞上 {v_eq:.2f} 码')

    # 雨天
    print('\n雨天 3.5 m/s²，50 码，人在 35 m')
    for dt in (0.001, 0.0001):
        w = run_T(50, A_WET, T_REACT, D_PERSON, dt)
        print(f'  [T dt={dt}] 撞线 {w["hit"]["v"]:.3f} 码，刹了 {w["hit"]["tb"]:.3f} s；总停车距离 {w["stop_x"]:.2f} m'
              f'（干路 {R[0.0001][50]["stop_x"]:.2f} m 的 {w["stop_x"] / R[0.0001][50]["stop_x"]:.3f} 倍）')
    w = run_T(50, A_WET, T_REACT, D_PERSON, 0.0001)
    print('  （对照，按看见人起的网格）雨天刹车段点：' + ' '.join(f'{d["v"]:.1f}' for d in w['dots'] if T_REACT - 1e-6 <= d['t'] <= T_REACT + 1.21))
    wd = (50 / KMH) ** 2 / (2 * A_WET)
    print(f'  雨天刹车路 {wd:.2f} m，到人只用了 {(D_PERSON - r50b) / wd:.1%}')

    # 雨天减速度的敏感性（事实核查第 2 条用）
    v50 = 50 / KMH
    remain = D_PERSON - r50b
    a_stop = v50 ** 2 / (2 * remain)
    dry_total = r50b + v50 ** 2 / (2 * A_DRY)
    a_hc = v50 ** 2 / (2 * (2 * dry_total - r50b))
    print(f'  雨天敏感性：50 码在 35 m 内停住所需减速度 ≥ {a_stop:.2f} m/s²（低于它就“停不住”）')
    print(f'  按 Highway Code“总停车距离至少翻倍”字面（总 {2 * dry_total:.1f} m）→ 雨天减速度 ≤ {a_hc:.2f} m/s²（每点少 {a_hc * 0.2 * KMH:.2f} 码）')
    for aw in (2.0, 3.4, 3.5, 4.0, 4.9, 5.9):
        ww = run_T(50, aw, T_REACT, D_PERSON, 0.0001)
        vv = ww['hit']['v'] if ww['hit'] else 0.0
        print(f'    a={aw}: 撞上 {vv:.1f} 码，每点少 {aw * 0.2 * KMH:.2f} 码')

    # 抛球（按 0.0001 s 前向欧拉）
    g, v = 9.8, 9.8
    h = t = 0.0
    traj = []
    while v > 0:
        traj.append((t, h, v))
        h += v * 0.0001
        v -= g * 0.0001
        t += 0.0001
    H, T_up = h, t
    t_q = next(tt for tt, hh, vv in traj if hh >= 0.75 * H)
    print(f'\n抛球：上升 {T_up:.3f} s，最高 {H:.3f} m；到 3/4 高度用时 {t_q:.3f} s → 最上面 1/4 高度占 {(T_up - t_q) / T_up:.1%} 的时间')
    print(f'  每 0.1 s 少 {g * 0.1:.2f} m/s = {g * 0.1 * KMH:.2f} 码')

    # 小卡
    print('\n小卡')
    print(f'  看手机 2 s：60 码 {60 / KMH * 2:.2f} m')
    print(f'  电动车 35/25：刹车段比 {(35 / 25) ** 2:.3f}')
    for v0 in (30, 50, 60, 100):
        rr = v0 / KMH * T_REACT
        bb = (v0 / KMH) ** 2 / (2 * A_DRY)
        print(f'  {v0} 码：反应 {rr:.2f} m，刹车 {bb:.2f} m，反应占 {rr / (rr + bb):.1%}')
    v_eq50 = 2 * A_DRY * T_REACT * KMH
    print(f'  反应段 = 刹车段 的车速：{v_eq50:.1f} 码')

    # 留题与敏感性（“慢车刚好停在人面前”口径）
    print('\n留题 / 敏感性（人放在慢车刚好停住处）')
    for (vs, vf, tr) in ((30, 40, 1.5), (30, 40, 1.0), (50, 60, 1.5), (50, 60, 1.0), (50, 60, 0.0)):
        dp = vs / KMH * tr + (vs / KMH) ** 2 / (2 * A_DRY)
        rr = run_T(vf, A_DRY, tr, dp, 0.0001)
        print(f'  {vs}→{vf} 码，反应 {tr} s：人在 {dp:.2f} m，快车撞上 {rr["hit"]["v"]:.2f} 码')

    # 和 numbers.json 对照
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'video-engine', 'public', 'v3', 'brake', 'numbers.json')
    p = os.path.normpath(p)
    if os.path.exists(p):
        J = json.load(open(p, encoding='utf-8'))
        m = J['main']
        print('\n和 numbers.json 对照（差值）')
        print(f'  60 码撞线：json {m["60"]["v_hit"]:.3f}  vs  T0.0001 {R[0.0001][60]["hit"]["v"]:.3f}  vs  S {S[60]["hit"]["v"]:.3f}')
        print(f'  60 码刹车用时：json {m["60"]["t_brake"]:.4f}  vs  {R[0.0001][60]["hit"]["tb"]:.4f}')
        print(f'  50 码离人：json {m["50"]["gap"]:.3f}  vs  {D_PERSON - R[0.0001][50]["stop_x"]:.3f}')
        print(f'  刹车段中点速度：json {J["card_a"]["v_half"]:.3f}  vs  {vh:.3f}')
        print(f'  第一/最后一米：json {J["per_meter_time"]["first_1m"]:.4f}/{J["per_meter_time"]["last_1m"]:.4f}  vs  {t1:.4f}/{T - tl:.4f}')
        print(f'  B 类：json {J["card_b_like"]:.3f}  vs  {60 - per_m * 10:.3f}')


if __name__ == '__main__':
    main()
