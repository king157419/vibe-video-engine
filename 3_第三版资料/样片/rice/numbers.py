"""样片二《煮不死的种子》(rice / V3Rice) —— 片中所有数字的唯一来源。

运行：D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe numbers.py
      （加 --json 另存 numbers.json，给动画读）

分两类数字：
  A. 模型算出来的示意数字（画面标“示意”）：菌数、翻倍次数、到达产毒门槛的时刻、毒素曲线、
     “日历时间 vs 室温秒表”。假设沿用方案 §3.2，只补了两条方案里没写、但画面需要的假设（见 ASSUMPTIONS 里标 [新增] 的）。
  B. 引用的事实数字（不是算的，来源见 事实核查.md）：121°C、80 分钟、10⁵ 门槛、一小时内进冰箱、一天内吃完等。
     放在 FACTS 里，只是为了让画面、字幕、简介都从这一处取值。

和方案的差异（以计算为准）：
  1. 方案写“约第 4.3 小时开始明显产毒”“6 小时约每克 180 万个”——计算得 4.27 小时、178 万，一致。
  2. 方案旁白写“数量到了几十万、上百万，它开始往饭里放毒素”。模型的产毒门槛是每克 10 万（10⁵），
     画面上品红雾从 10⁵ 开始出现；旁白若说“几十万”，会和画面差半个数量级。改成“每克多到十万以上”。
     来源（FSAI、新西兰 MPI、香港食安中心）都写的是 >10⁵。
  3. 方案只有一个共用时钟。但“隔夜”这个误解的要害是：冰箱那碗日历上过了 23 小时，室温秒表只走了 1 小时。
     所以这里多算一组“日历时间 / 室温秒表”给 K4 末尾和 K7 用。
  4. 方案写“再加热：两边活菌计数归零”。这和要素①矛盾：芽孢煮不死，炒也炒不死。
     改成：长出来的细菌（繁殖体）死光；没发芽的芽孢还在。见 [4]。
  5. 25 分钟翻一倍是“快的那一端”：熟米饭里实测 30°C 约 49 分钟、24°C 约 40 分钟（事实核查 #3）。
     数字不改（方案假设），旁白从“大约每二三十分钟”改成“快的时候，二三十分钟就翻一倍”，
     并用 [7] 敏感性分析说明：参数取慢的一端时，6 小时不一定过 10⁵，所以只说“更容易吃坏肚子”。
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

# ---------------------------------------------------------------- 假设（示意）
ASSUMPTIONS = {
    "N0_per_g": 1000,          # 煮熟后每克饭里活下来的芽孢数（方案）。真实米饭差别很大，见敏感性分析
    "room_C": 30,              # 左碗：夏天桌上 30°C（方案）
    "fridge_C": 4,             # 右碗：冰箱 4°C（方案）
    "lag_h": 1.5,              # 发芽 + 出芽的迟滞期，小时（方案）
    "doubling_min": 25,        # 迟滞期过后，每 25 分钟翻一倍（方案；旁白说“快的时候，二三十分钟”，熟米饭实测更慢，见敏感性分析）
    "toxin_threshold_per_g": 1e5,  # 每克 10⁵ 个以上开始明显产毒（方案）
    "left_start": "12:00",     # 左碗：中午 12 点剩下（方案：中午剩的）
    "left_end": "18:00",       # 放到傍晚 6 点（方案）
    "right_dinner": "19:00",   # [新增] 右碗：昨晚 7 点吃完
    "right_room_h": 1.0,       # 右碗：饭后在室温里放了 1 小时进冰箱（方案）
    "right_end_nextday": "18:00",  # [新增] 第二天傍晚 6 点和左碗一起回锅
    "residual_spore_frac": 0.01,   # [新增] 左碗里始终没发芽的芽孢占 1%（示意，只用来画回锅后剩下的几颗青点）
}

# ---------------------------------------------------------------- 引用的事实数字（来源见 事实核查.md）
FACTS = {
    "cereulide_stable_C": 121,        # 呕吐毒素在 121°C……
    "cereulide_stable_min": 80,       # ……加热 80 分钟仍稳定（NZ MPI/ESR 2015 数据表，引 Rajkovic 2014；UF/IFAS FS269）→ 旁白“一个多小时”
    "cereulide_stable_min_fda": 30,   # FDA Bad Bug Book：121°C 30 分钟后仍稳定（更保守的那条）
    "spore_kill_C": 121,              # 香港食安中心：芽孢要 121°C、3 分钟这类高温才能消灭 → 旁白“煮饭的热杀不死”
    "spore_kill_min": 3,
    "toxin_count_low": 1e5,           # 产毒/致病相关菌量下限（FSAI、MPI、香港食安中心）
    "toxin_count_high": 1e8,
    "fridge_within_h_FSA": 1,         # 英国 FSA：米饭最好 1 小时内冷却进冰箱
    "fridge_within_h_USDA": 2,        # USDA FSIS：2 小时内（气温 >32°C 时 1 小时）
    "usda_hot_day_C": 32,
    "rice_fridge_max_days": 1,        # 英国 FSA：米饭冷藏不超过 1 天
    "reheat_times_max": 1,            # 英国 FSA、香港食安中心：只回热一次
    "emetic_min_growth_C": 10,        # 呕吐型菌株 10°C 以下不长（Carlin 2006；NZ MPI）
    "doubling_range_min": (20, 30),   # 旁白“二三十分钟”：FSIS 通用“快则 20 分钟”；PMP 模型 30°C 约 22 分钟
}


def hhmm(h: float) -> str:
    """小时数 -> 'HH:MM'（四舍五入到分钟）"""
    m = round(h * 60)
    return f"{m // 60:02d}:{m % 60:02d}"


def clock_add(start: str, h: float) -> str:
    sh, sm = map(int, start.split(":"))
    m = (sh * 60 + sm + round(h * 60)) % (24 * 60)
    return f"{m // 60:02d}:{m % 60:02d}"


def count_at(t_h: float, n0: float, lag_h: float, td_min: float) -> float:
    """室温下第 t 小时每克菌数：迟滞期内不变，之后指数翻倍（示意，不封顶；6 小时内远未到 10⁸ 的平台）"""
    if t_h <= lag_h:
        return n0
    return n0 * 2 ** ((t_h - lag_h) * 60 / td_min)


def t_reach(target: float, n0: float, lag_h: float, td_min: float) -> float:
    if target <= n0:
        return 0.0
    return lag_h + math.log2(target / n0) * td_min / 60


def toxin_integral(t_h: float, n0, lag_h, td_min, thr) -> float:
    """毒素量（示意，相对单位）：菌数过门槛后，产毒速度 ∝ 菌数 → 毒素 ∝ ∫ N dt（从过门槛起）。"""
    t0 = t_reach(thr, n0, lag_h, td_min)
    if t_h <= t0:
        return 0.0
    k = math.log(2) * 60 / td_min           # 每小时的指数速率
    return (count_at(t_h, n0, lag_h, td_min) - count_at(t0, n0, lag_h, td_min)) / k


def sci(x: float) -> str:
    e = int(math.floor(math.log10(x)))
    return f"{x / 10 ** e:.2f}×10^{e}"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    A = ASSUMPTIONS
    n0, lag, td, thr = A["N0_per_g"], A["lag_h"], A["doubling_min"], A["toxin_threshold_per_g"]
    sh, eh = (int(A["left_start"][:2]), int(A["left_end"][:2]))
    T_left = eh - sh                                   # 6 小时
    out = {"assumptions": A, "facts": {k: v for k, v in FACTS.items()}}

    print("=" * 64)
    print("样片二《煮不死的种子》数字表（示意数字全部由本脚本算出）")
    print("=" * 64)

    # ---------------- 1. 左碗：桌上 30°C
    doublings = (T_left - lag) * 60 / td
    n_end = count_at(T_left, n0, lag, td)
    t_thr = t_reach(thr, n0, lag, td)
    print("\n[1] 左碗 A：中午剩的，桌上 30°C，放到傍晚")
    print(f"  放置时长            {A['left_start']} → {A['left_end']} = {T_left} 小时   （旁白“6个小时”）")
    print(f"  迟滞期（发芽）      {lag} 小时 = {hhmm(lag)}，钟面 {clock_add(A['left_start'], lag)}   （旁白“一两个小时”，审稿改：熟米饭实测 2.1–2.5 小时）")
    print(f"  翻倍时间            {td} 分钟   （旁白“快的时候，二三十分钟就翻一倍”）")
    print(f"  翻倍次数            ({T_left} - {lag}) × 60 / {td} = {doublings:.2f} 次")
    print(f"  起始菌数            {n0:,} 个/克   （旁白“1000个”）")
    print(f"  6 小时菌数          {n0:,} × 2^{doublings:.2f} = {n_end:,.0f} 个/克 ≈ {n_end / 1e4:.0f} 万   （旁白“一百多万个”）")
    print(f"  到达 10⁵（产毒门槛） 第 {t_thr:.2f} 小时 = 已放置 {hhmm(t_thr)}，钟面 {clock_add(A['left_start'], t_thr)}   （旁白“每克多到十万以上”）")
    print(f"  过门槛后到 6 小时    {T_left - t_thr:.2f} 小时 = {hhmm(T_left - t_thr)}，菌数再涨 {n_end / thr:.1f} 倍")
    out["left"] = {
        "hours": T_left, "doublings": round(doublings, 3), "n_end": round(n_end),
        "t_threshold_h": round(t_thr, 4), "t_threshold_hhmm": hhmm(t_thr),
        "clock_threshold": clock_add(A["left_start"], t_thr), "clock_lag_end": clock_add(A["left_start"], lag),
    }

    # ---------------- 2. 右碗：1 小时后进冰箱
    rr = A["right_room_h"]
    n_right = count_at(rr, n0, lag, td)
    cal_h = (24 - int(A["right_dinner"][:2])) + int(A["right_end_nextday"][:2])
    print("\n[2] 右碗 B：昨晚剩的，饭后 1 小时进冰箱（4°C）")
    print(f"  室温时间            {rr} 小时 < 迟滞期 {lag} 小时 → 芽还没发出来（还差 {lag - rr:.1f} 小时）")
    print(f"  进冰箱后            4°C < 呕吐型菌株最低生长温度 {FACTS['emetic_min_growth_C']}°C → 不长（示意：计为 0 增长）")
    print(f"  菌数                始终 {n_right:,.0f} 个/克   （旁白“还是1000个”）")
    print(f"  日历时间            昨晚 {A['right_dinner']} → 今天 {A['right_end_nextday']} = {cal_h} 小时")
    print(f"  室温秒表            {rr:.0f} 小时（{hhmm(rr)}）")
    print(f"  冷藏时长            {cal_h - rr:.0f} 小时 ≤ 英国 FSA 的 {FACTS['rice_fridge_max_days']} 天上限 → 场景本身合规")
    out["right"] = {"n": n_right, "calendar_h": cal_h, "room_h": rr, "fridge_h": cal_h - rr}

    # ---------------- 3. 日历 vs 室温秒表（K4 末尾、K7）
    print("\n[3] 日历时间 vs 室温秒表（K7 两根横条）")
    print(f"  A 桌上那碗          日历 {T_left} 小时 ｜ 室温秒表 {T_left} 小时")
    print(f"  B 冰箱那碗          日历 {cal_h} 小时 ｜ 室温秒表 {rr:.0f} 小时")
    print(f"  按日历排：B 是 A 的 {cal_h / T_left:.1f} 倍；按室温秒表排：A 是 B 的 {T_left / rr:.0f} 倍 → 排序正好反过来")
    out["stopwatch"] = {"A": {"calendar_h": T_left, "room_h": T_left}, "B": {"calendar_h": cal_h, "room_h": rr}}

    # ---------------- 4. 回锅（K6 论点帧）
    resid = n0 * A["residual_spore_frac"]
    tox_end = toxin_integral(T_left, n0, lag, td, thr)
    print("\n[4] 回锅炒透（K6）")
    print(f"  左碗菌数            {n_end:,.0f} → 约 {resid:.0f} 个/克（长出来的细菌死光；剩少量没发芽的芽孢，示意）")
    print(f"  左碗下降            约 {math.log10(n_end / resid):.1f} 个数量级")
    print(f"  右碗菌数            {n_right:,.0f} → {n_right:,.0f}（都是没发芽的芽孢，炒不死；示意）")
    print(f"  左碗毒素            回锅前 = 回锅后 = 1.00（相对单位，一点不变）")
    print(f"  右碗毒素            0（没过 10⁵ 门槛）")
    out["reheat"] = {"left_after": resid, "right_after": n_right, "toxin_left": 1.0, "toxin_right": 0.0}

    # ---------------- 5. 动画用的逐 15 分钟表
    print("\n[5] 逐 15 分钟读数（动画插值用；毒素按 6 小时时 = 1 归一）")
    print("  已放置   钟面    左碗 个/克        log10   左碗毒素   右碗 个/克")
    rows = []
    for k in range(0, T_left * 4 + 1):
        t = k / 4
        n = count_at(t, n0, lag, td)
        tox = toxin_integral(t, n0, lag, td, thr) / tox_end
        nr = count_at(min(t, rr), n0, lag, td)
        rows.append({"t_h": t, "clock": clock_add(A["left_start"], t), "left": round(n), "log10_left": round(math.log10(n), 3),
                     "toxin_left": round(tox, 4), "right": round(nr)})
        print(f"  {hhmm(t)}   {clock_add(A['left_start'], t)}   {n:>14,.0f}   {math.log10(n):5.2f}   {tox:7.3f}    {nr:>8,.0f}")
    out["table_15min"] = rows

    # ---------------- 6. 终局卡“时间 × 温度”格（只有片中讲过的两行）
    print("\n[6] 终局卡“时间 × 温度”示意格（状态：睡=迟滞期 / 长=翻倍中 / 毒=过 10⁵）")
    cols = [1, 2, 3, 4, 5, 6]
    print("  温度      " + "".join(f"{c}h".rjust(5) for c in cols))
    grid = {}
    for name, temp in (("桌上30°C", 30), ("冰箱 4°C", 4)):
        cells = []
        for c in cols:
            if temp < FACTS["emetic_min_growth_C"]:
                s = "停"
            else:
                n = count_at(c, n0, lag, td)
                s = "睡" if c <= lag else ("毒" if n >= thr else "长")
            cells.append(s)
        grid[name] = cells
        print(f"  {name}  " + "".join(s.rjust(4) for s in cells))
    out["grid"] = {"cols_h": cols, "rows": grid}

    # ---------------- 7. 敏感性：假设变了，结论还在不在
    print("\n[7] 敏感性分析：6 小时时是否已过 10⁵ 门槛（结论是否依赖示意参数）")
    print("  起始/克  迟滞h  翻倍min   到10⁵(h)   6h菌数/克        6h过门槛?")
    sens = []
    for n0_ in (100, 1000):
        for lag_ in (1.5, 2.1):
            for td_ in (25, 30, 40):
                tt = t_reach(thr, n0_, lag_, td_)
                n6 = count_at(6, n0_, lag_, td_)
                ok = "是" if n6 >= thr else "否"
                sens.append({"n0": n0_, "lag_h": lag_, "td_min": td_, "t_thr_h": round(tt, 2), "n6": round(n6), "over": n6 >= thr})
                print(f"  {n0_:>6}  {lag_:>5}  {td_:>6}    {tt:7.2f}    {n6:>14,.0f}     {ok}")
    # 审稿补：熟米饭里的实测参数（不是肉汤），见事实核查 #3
    print("  —— 熟米饭实测参数（审稿补）——")
    for n0_, lag_, td_, src in ((1000, 2.1, 49, "McElroy 2000，熟米饭 30°C"),
                                (1000, 2.5, 42.3, "Vessoni 2002，熟米饭 33°C")):
        tt = t_reach(thr, n0_, lag_, td_)
        n6 = count_at(6, n0_, lag_, td_)
        ok = "是" if n6 >= thr else "否"
        sens.append({"n0": n0_, "lag_h": lag_, "td_min": td_, "t_thr_h": round(tt, 2), "n6": round(n6), "over": n6 >= thr, "src": src})
        print(f"  {n0_:>6}  {lag_:>5}  {td_:>6}    {tt:7.2f}    {n6:>14,.0f}     {ok}   ← {src}")
    out["sensitivity"] = sens
    print("  注：25 min 翻倍、1.5 h 迟滞是肉汤/预测模型里的快端；熟米饭实测更慢（见事实核查 #3）。")
    print("      按熟米饭实测参数，6 小时约 3 万个/克，到不了 10⁵；要 7.2–7.5 小时才过门槛。")
    print("      所以片中 6 小时的菌数和毒素是“按快的算”的示意：旁白说“快的时候……照这个速度”，")
    print("      画面标“示意 · 按偏快速度”；结论只说“更容易吃坏肚子”，不说“6 小时一定产毒”。")

    # ---------------- 9. 越热越快（B41a。审片后改写旁白：“同样的时间，天越热，菌长得越快”）
    # 熟白米饭实测（Vessoni 2002，事实核查 N13）：25°C 迟滞 8 小时、翻倍 59.0 分钟；33°C 迟滞 2.5 小时、翻倍 42.3 分钟。
    # 画面：两只秒表同步走到 33°C 过 10⁵ 的那一刻（时间相同），比两边的菌数（示意）。
    print("\n[9] 越热越快（B41a 两只秒表，熟米饭实测参数，示意）")
    hot = {}
    for name, (lag_, td_) in (("C25", (8.0, 59.0)), ("C33", (2.5, 42.3))):
        tt = t_reach(thr, n0, lag_, td_)
        hot[name] = {"lag_h": lag_, "td_min": td_, "t_thr_h": round(tt, 2)}
        print(f"  {name[1:]}°C  迟滞 {lag_} h，翻倍 {td_} min → 从 {n0:,} 到 10⁵ 要 {tt:.2f} 小时")
    ratio = hot["C25"]["t_thr_h"] / hot["C33"]["t_thr_h"]
    hot["ratio"] = round(ratio, 3)
    print(f"  33°C 比 25°C 快 {ratio:.2f} 倍")
    t_same = hot["C33"]["t_thr_h"]
    n25 = count_at(t_same, n0, 8.0, 59.0)
    n33 = count_at(t_same, n0, 2.5, 42.3)
    print(f"  同样放 {t_same:.2f} 小时（{hhmm(t_same)}）：25°C {n25:,.0f} 个/克（还在迟滞期），33°C {n33:,.0f} 个/克（到门槛）")
    print("  （审片后旁白“同样的时间，天越热，菌长得越快”；画面两只秒表同步走到这一刻，读数 1,000 对 10 万）")
    hot["same_h"] = t_same
    hot["n25_at_same"] = round(n25)
    hot["n33_at_same"] = round(n33)
    out["hotter"] = hot

    # ---------------- 8. 旁白/画面里出现的全部数字清单
    print("\n[8] 片中出现的全部数字 → 出处")
    listing = [
        ("30度 / 30°C", "假设 room_C", A["room_C"]),
        ("4°C", "假设 fridge_C", A["fridge_C"]),
        ("6个小时（两次）", "12:00→18:00", T_left),
        ("中午 12:00 / 傍晚 18:00", "假设 left_start/left_end", f"{A['left_start']}/{A['left_end']}"),
        ("一两个小时（发芽）", "假设 lag_h；熟米饭实测 2.1–2.5 h", lag),
        ("二三十分钟（翻一倍）", "假设 doubling_min=25，事实范围 20–30", td),
        ("1000个（起始、右碗）", "假设 N0", n0),
        ("一百多万个（6 小时）", "计算", round(n_end)),
        ("十万以上（产毒）", "假设=事实 10⁵", int(thr)),
        ("已放置 04:16（雾开始出现）", "计算", hhmm(t_thr)),
        ("一小时内（进冰箱）", "假设 right_room_h；事实 FSA 1 h / USDA 2 h", rr),
        ("日历 23 小时 vs 室温 1 小时", "计算", f"{cal_h}/{rr:.0f}"),
        ("121度加热一个多小时（毒素不坏）", "事实 MPI/FS269 80 min", f"{FACTS['cereulide_stable_C']}°C/{FACTS['cereulide_stable_min']}min"),
        ("一天内吃完", "事实 FSA", FACTS["rice_fridge_max_days"]),
        ("只热一次（终局卡）", "事实 FSA/香港食安中心", FACTS["reheat_times_max"]),
        ("对数刻度 10 / 10³ / 10⁶", "HUD 刻度", "10,1e3,1e6"),
        ("回锅后左碗约 10 个/克（不念，只画）", "假设 residual_spore_frac", resid),
        ("25°C / 33°C 两只秒表同走 07:11，菌数 1,000 对 10 万（只画）", "事实 Vessoni 2002 → [9] 计算", f"{hot['C33']['t_thr_h']} h：{hot['n25_at_same']:,}/{hot['n33_at_same']:,}"),
        ("毒素条“约 4 小时起产毒”（只画）", "计算，同“已放置 04:16”", f"{t_thr:.2f} h"),
    ]
    for a, b, c in listing:
        print(f"  {a:<28} {b:<36} = {c}")
    out["listing"] = [{"text": a, "source": b, "value": str(c)} for a, b, c in listing]

    if "--json" in sys.argv:
        p = Path(__file__).with_name("numbers.json")
        p.write_text(json.dumps(out, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
        print(f"\n已写出 {p}")


if __name__ == "__main__":
    main()
