"""《弱关系》片中所有读数的来源。运行：D:\\conda\\envs\\d2l\\python.exe ties_numbers.py
输出 ties_numbers.json（同目录），制作时 TS 端用同一个 mulberry32 和同一套步骤复现，结果必须逐位一致。

一、小世界模型（Watts–Strogatz 1998 的做法，代码真算）
  - N = 2000 个人排成一圈，每人认识左右各 K/2 = 10 个人（K = 20）。
  - 重连：按 WS 原文的顺序，外层 j = 1..K/2（第 j 圈邻居），内层 i = 0..N-1；
    对边 (i, i+j)，若 rng() < p，就把它的另一端换成 floor(rng()*N)（不许自环、不许重边，撞了就再抽）。
  - rng = mulberry32(SEED)，与 video-engine/src/v4/kit/util.ts 的 mulberry32 完全相同。
  - 「你」= 0 号，「TA」= 1000 号（圈上正对面）。
二、格兰诺维特 1973：54 人 = 常见 16.7% / 偶尔 55.6% / 很少 27.8%。
三、米尔格拉姆（Travers & Milgram 1969）：296 位寄信人，64 封到达，到达链平均 5.2 个中间人。
四、第二版（审稿后）新增：
  - flood：从「你」出发的 BFS 分层人数（1998 章满屏奇观「光的洪水」、2:38 纯环爬行都按它画）；
  - greedy：只看本地信息的「交给离目标最近的熟人」走法要几步（事实核查用：说明片里的 5 步是「存在的最短路」，不是「信能找到的路」）；
  - band_layout：开头 / 3:04 / 结尾那条星带的坐标规则，含 4 个手摆的路径点。
"""
from __future__ import annotations

import json
import math
from collections import Counter, deque
from pathlib import Path

import numpy as np

N, K, P = 2000, 20, 0.01
YOU, THEM = 0, 1000


def mulberry32(seed: int):
    a = seed & 0xFFFFFFFF

    def imul(x, y):
        return (x * y) & 0xFFFFFFFF

    def r():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF
        t &= 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return r


def ring(n=N, k=K):
    adj = [set() for _ in range(n)]
    for i in range(n):
        for j in range(1, k // 2 + 1):
            a, b = i, (i + j) % n
            adj[a].add(b)
            adj[b].add(a)
    return adj


def rewire(seed: int, p=P, n=N, k=K):
    adj = ring(n, k)
    r = mulberry32(seed)
    chords = []
    for j in range(1, k // 2 + 1):
        for i in range(n):
            b = (i + j) % n
            if b not in adj[i]:
                continue  # 这条边已经在前面被换走了
            if r() < p:
                while True:
                    c = int(r() * n)
                    if c != i and c not in adj[i]:
                        break
                adj[i].discard(b)
                adj[b].discard(i)
                adj[i].add(c)
                adj[c].add(i)
                chords.append((i, b, c))
    return adj, chords


def bfs(adj, s):
    d = [-1] * len(adj)
    pre = [-1] * len(adj)
    d[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in sorted(adj[u]):
            if d[v] < 0:
                d[v] = d[u] + 1
                pre[v] = u
                q.append(v)
    return d, pre


def path(pre, t):
    out = [t]
    while pre[out[-1]] >= 0:
        out.append(pre[out[-1]])
    return out[::-1]


def avg_len(adj):
    tot, cnt = 0, 0
    for s in range(len(adj)):
        d, _ = bfs(adj, s)
        d = np.array(d)
        tot += d[d > 0].sum()
        cnt += (d > 0).sum()
    return tot / cnt


def clustering(adj):
    cs = []
    for u in range(len(adj)):
        nb = list(adj[u])
        kk = len(nb)
        if kk < 2:
            cs.append(0.0)
            continue
        links = sum(1 for a in range(kk) for b in range(a + 1, kk) if nb[b] in adj[nb[a]])
        cs.append(links / (kk * (kk - 1) / 2))
    return float(np.mean(cs))


def milgram_chains(seed=1967, n=64, total=333, lo=1, hi=9):
    """64 条到达的链，每条中间人 1–9 个（链长 2–10 段，格兰诺维特 1973 转述的范围），总数 333 → 平均 5.20。
    先按以 5 为中心的权重抽，再随机 ±1 微调到总数；全程用 mulberry32，TS 端可复现。"""
    r = mulberry32(seed)
    w = [1, 3, 6, 9, 10, 8, 5, 3, 1]  # 1..9 个中间人的权重（示意形状）
    cum = np.cumsum(w) / sum(w)
    xs = [int(np.searchsorted(cum, r())) + lo for _ in range(n)]
    while sum(xs) != total:
        i = int(r() * n)
        if sum(xs) < total and xs[i] < hi:
            xs[i] += 1
        elif sum(xs) > total and xs[i] > lo:
            xs[i] -= 1
    return xs


def ring_dist(a, b, n=N, k=K):
    g = min(abs(a - b), n - abs(a - b))
    return -(-g // (k // 2))


def ring_gap(a, b, n=N):
    g = abs(a - b)
    return min(g, n - g)


def greedy(adj, s, t):
    """米尔格拉姆式的本地转交：每个人只知道自己的熟人，把信交给「在圈上离目标最近」的那一个。
    返回步数；走不动（没有更近的熟人）返回 None。"""
    cur, steps = s, 0
    while cur != t:
        nxt = min(adj[cur], key=lambda v: (ring_gap(v, t), v))
        if ring_gap(nxt, t) >= ring_gap(cur, t):
            return None
        cur, steps = nxt, steps + 1
    return steps


def count_shortest(adj, s, t):
    d, _ = bfs(adj, s)
    cnt = [0] * len(adj)
    cnt[s] = 1
    for v in sorted(range(len(adj)), key=lambda x: d[x]):
        for u in adj[v]:
            if d[u] == d[v] + 1:
                cnt[u] += cnt[v]
    return cnt[t]


# ---- 星带布局（开头 0:00–0:35、3:04 回扣、4:04 结尾）
BAND_C, BAND_A, BAND_B, BAND_TH0 = (960, 470), 700, 330, 155.0
# 路径上的 4 个点不用随机抖动，手摆（只是构图）：角度仍按编号算，径向系数固定，
# 让每一短跳 ≥ 70 px、方向一直朝着目标，序号标签互不重叠。
HAND_F = {5: 0.88, 15: 0.74, 1016: 0.74, 1006: 0.88}


def band_xy(i, f=1.0, dth=0.0):
    th = math.radians(BAND_TH0 + 360 * i / N + dth)
    return [round(BAND_C[0] + BAND_A * f * math.cos(th), 1), round(BAND_C[1] + BAND_B * f * math.sin(th), 1)]


def band_layout(seed=2026):
    """第一遍：i = 0..1999 每个点都抽两次（径向系数 f、角度抖动 dθ），0 号和 1000 号也抽，但抽完丢掉、不抖动。
    第二遍（TS 端画星时接着抽，这里不用）：每个点再抽三次：半径 1.6–3.2 px、亮度 0.25–0.6、闪烁相位。
    最后用 HAND_F 覆盖 4 个路径点。"""
    r = mulberry32(seed)
    pos = []
    for i in range(N):
        f = 1 + 0.32 * (r() - 0.5)
        dth = (r() - 0.5) * 1.2
        pos.append(band_xy(i, f, dth))
    for i in (YOU, THEM):
        pos[i] = band_xy(i)
    for i, f in HAND_F.items():
        pos[i] = band_xy(i, f)
    return pos


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "scan":
        # 看看不同种子下「你 → TA」的距离分布（只用来挑一个有代表性的种子，不改模型）
        for seed in range(1, 41):
            adj, ch = rewire(seed)
            d, pre = bfs(adj, YOU)
            pth = path(pre, THEM)
            longs = sum(1 for a, b in zip(pth, pth[1:]) if ring_dist(a, b) > 1)
            print(seed, len(ch), d[THEM], longs, pth)
        sys.exit()

    SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    lat = ring()
    d0, _ = bfs(lat, YOU)
    L0 = avg_len(lat)
    C0 = clustering(lat)
    adj, chords = rewire(SEED)
    d1, pre1 = bfs(adj, YOU)
    pth = path(pre1, THEM)
    L1 = avg_len(adj)
    C1 = clustering(adj)
    hops = [{"from": a, "to": b, "ring_steps": ring_dist(a, b), "long": ring_dist(a, b) > 1} for a, b in zip(pth, pth[1:])]
    # 纯环上「你 → TA」的逐步路径：每步走到 +10（朝 TA 的方向）
    lattice_path = [min(YOU + 10 * s, THEM) for s in range(d0[THEM] + 1)]

    # 第二版新增：BFS 分层（光的洪水）
    c1 = Counter(d1)
    flood_layers = [c1[k] for k in range(max(d1) + 1)]
    c0 = Counter(d0)
    lattice_layers = [c0[k] for k in range(max(d0) + 1)]
    # 本地转交（米尔格拉姆式）对照：你 → TA，以及 300 对随机点
    g_you_them = greedy(adj, YOU, THEM)
    rr = mulberry32(777)
    g_tot = sp_tot = g_n = g_stuck = 0
    while g_n + g_stuck < 300:
        a, b = int(rr() * N), int(rr() * N)
        if a == b:
            continue
        g = greedy(adj, a, b)
        if g is None:
            g_stuck += 1
            continue
        da, _ = bfs(adj, a)
        g_tot, sp_tot, g_n = g_tot + g, sp_tot + da[b], g_n + 1
    band = band_layout()
    key_nodes = [YOU, 5, 15, 1016, 1006, THEM]
    band_key = {str(i): band[i] for i in key_nodes}
    hop_px = [round(math.dist(band[a], band[b]), 1) for a, b in zip(key_nodes, key_nodes[1:])]

    # 格兰诺维特 1973（N = 54）
    gran = {"N": 54, "often": round(54 * 0.167), "occasionally": round(54 * 0.556), "rarely": round(54 * 0.278)}
    gran["check_sum"] = gran["often"] + gran["occasionally"] + gran["rarely"]
    gran["pct"] = {k: round(100 * gran[k] / 54, 1) for k in ("often", "occasionally", "rarely")}
    gran["occ_or_rare_pct"] = round(100 * (gran["occasionally"] + gran["rarely"]) / 54, 1)

    out = {
        "model": {"N": N, "K": K, "p": P, "seed": SEED, "you": YOU, "them": THEM},
        "edges_total": N * K // 2,
        "rewired": len(chords),
        "rewired_pct": round(100 * len(chords) / (N * K // 2), 2),
        "lattice": {"d_you_them": d0[THEM], "avg_len": round(L0, 2), "clustering": round(C0, 4)},
        "rewired_graph": {"d_you_them": d1[THEM], "avg_len": round(L1, 2), "clustering": round(C1, 4)},
        "clustering_kept_pct": round(100 * C1 / C0, 1),
        "avg_len_ratio_pct": round(100 * L1 / L0, 1),
        "path_you_them": pth,
        "path_hops": hops,
        "intermediaries": len(pth) - 2,
        "lattice_path": lattice_path,
        "chords": [{"i": i, "old": b, "new": c} for i, b, c in chords],
        "granovetter": gran,
        "milgram": {"starters": 296, "arrived": 64, "lost": 296 - 64, "arrived_pct": round(100 * 64 / 296, 1),
                    "mean_intermediaries": 5.2, "chains_intermediaries": milgram_chains(),
                    "chains_mean": round(sum(milgram_chains()) / 64, 2)},
        "facebook_2016": {"users_billion": 1.59, "avg_distance": 4.57, "degrees": 3.57},
        "facebook_2011": {"users_million": 721, "avg_distance": 4.74, "degrees": 3.74},
        # ---- 第二版新增
        "flood_layers_from_you": flood_layers,          # 重连后：第 k 层有多少人（第 0 层是你自己）
        "flood_steps_to_everyone": len(flood_layers) - 1,
        "lattice_layers_head": lattice_layers[:12],      # 纯环：每层 20 人
        "lattice_steps_to_them": d0[THEM],
        "bfs_dist_from_you": d1,                         # 每个人离你几步（洪水按它分层点亮）
        "n_shortest_paths_you_them": count_shortest(adj, YOU, THEM),
        "greedy": {"you_them": g_you_them, "pairs": g_n, "stuck": g_stuck,
                   "avg_steps": round(g_tot / g_n, 1), "avg_shortest": round(sp_tot / g_n, 2)},
        "band_layout": {"seed": 2026, "center": BAND_C, "axes": [BAND_A, BAND_B], "theta0_deg": BAND_TH0,
                        "hand_placed_f": {str(k): v for k, v in HAND_F.items()},
                        "key_nodes_xy": band_key, "path_hop_px": hop_px},
    }
    Path(__file__).with_name("ties_numbers.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    skip = {"chords", "lattice_path", "bfs_dist_from_you"}
    print(json.dumps({k: v for k, v in out.items() if k not in skip}, ensure_ascii=False)[:4000])
