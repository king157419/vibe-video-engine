# -*- coding: utf-8 -*-
"""审稿用的独立重算（不读 numbers.py，换一种写法：逐时间步数值积分）。

只用来核对稿子和 numbers.json，片中数字仍然只以 numbers.py 为准。
运行：D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe 审稿_独立重算.py
"""
DT = 1e-4  # 时间步长（秒）；改成 1e-3 可看收敛情况


def sim(v0_kmh, a, t_react, dt=DT, tmax=8.0):
    """反应期间匀速，之后以减速度 a 匀减速到停。返回 [(t, x, v_kmh)]。"""
    v = v0_kmh / 3.6
    x = t = 0.0
    rec = [(0.0, 0.0, v0_kmh)]
    while t < tmax and v > 0:
        acc = -a if t >= t_react - 1e-12 else 0.0
        vn = max(0.0, v + acc * dt)
        step = dt if v + acc * dt >= 0 else v / a
        x += (v + vn) / 2 * step
        v, t = vn, t + step
        rec.append((t, x, v * 3.6))
    return rec


def first(rec, cond):
    for r in rec:
        if cond(r):
            return r
    return None


def at_time(rec, tq):
    return first(rec, lambda r: r[0] >= tq - DT / 2) or rec[-1]


def main():
    D = 35.0
    print("== 主场景：反应 1.5 s，7 m/s²，人在 35 m ==")
    for v0 in (50, 60):
        rec = sim(v0, 7.0, 1.5)
        hit = first(rec, lambda r: r[1] >= D)
        stop = rec[-1]
        react = v0 / 3.6 * 1.5
        print(f"{v0} 码：反应段 {react:.3f} m，离人 {D - react:.3f} m 开始刹；停在 {stop[1]:.3f} m",
              f"；撞线 {hit[2]:.2f} 码，刹了 {hit[0] - 1.5:.3f} s" if hit else "；没撞上")
        pts = []
        for k in range(11):
            t, x, v = at_time(rec, 1.5 + 0.2 * k)
            if x > D + 0.05:
                break
            pts.append(f"{x:.2f}m/{v:.1f}")
        print("   刹车段的点（每 0.2 s）：", " ".join(pts))

    print("== 50 码刹车段细节 ==")
    rec = [(t - 1.5, x - 50 / 3.6 * 1.5, v) for t, x, v in sim(50, 7.0, 1.5) if t >= 1.5]
    L, T = rec[-1][1], rec[-1][0]
    mid = first(rec, lambda r: r[1] >= L / 2)
    q3 = first(rec, lambda r: r[1] >= 0.75 * L)
    m1 = first(rec, lambda r: r[1] >= 1.0)
    mlast = first(rec, lambda r: r[1] >= L - 1.0)
    print(f"刹车路 {L:.3f} m，用时 {T:.3f} s；中点 {mid[2]:.2f} 码（前半 {mid[0]:.3f} s，后半 {T - mid[0]:.3f} s）")
    print(f"走完 3/4：{q3[2]:.2f} 码，{q3[0]:.3f} s；第一米 {m1[0]:.3f} s；最后一米 {T - mlast[0]:.3f} s")
    print(f"0–35 米 50→0 那根灰线在刹车段中点（{50 / 3.6 * 1.5 + L / 2:.2f} m）读数："
          f"{50 * (1 - (50 / 3.6 * 1.5 + L / 2) / 35):.1f} 码")

    print("== 雨天 3.5 m/s²，50 码 ==")
    rec = sim(50, 3.5, 1.5)
    hit = first(rec, lambda r: r[1] >= D)
    print(f"撞线 {hit[2]:.2f} 码，刹了 {hit[0] - 1.5:.3f} s")

    print("== 抛球（9.8 m/s，g = 9.8，不计空气阻力） ==")
    v, h, t, H = 9.8, 0.0, 0.0, 9.8 ** 2 / (2 * 9.8)
    while h < 0.75 * H:
        vn = v - 9.8 * DT
        h += (v + vn) / 2 * DT
        v, t = vn, t + DT
    print(f"到达 3/4 高度用时 {t:.3f} s（上升总时间 1.000 s）")

    print("== 反应段占停车距离的比例 ==")
    for v0 in (30, 50, 60, 76, 100):
        m = v0 / 3.6
        R, B = m * 1.5, m * m / 14
        print(f"{v0} 码：{100 * R / (R + B):.1f}%")

    print("== 留题：30 码刚好停住，换 40 码 ==")
    for tr in (1.5, 1.0):
        m = 30 / 3.6
        d = m * tr + m * m / 14
        hit = first(sim(40, 7.0, tr), lambda r: r[1] >= d)
        print(f"反应 {tr} s：孩子在 {d:.2f} m，撞上 {hit[2]:.2f} 码")

    print("== 其他 ==")
    print(f"看手机 2 s @60 码：{60 / 3.6 * 2:.2f} m；电动车 (35/25)^2 = {(35 / 25) ** 2:.2f}")
    m = 50 / 3.6
    d = m * 1.5 + m * m / 14
    hit = first(sim(60, 7.0, 1.5), lambda r: r[1] >= d)
    print(f"方案原口径（人在 {d:.2f} m）：60 码撞上 {hit[2]:.2f} 码")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    main()
