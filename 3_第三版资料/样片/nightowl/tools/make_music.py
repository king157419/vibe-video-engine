r"""《沙漏与潮水》配乐（审片第二轮 P1-2 重做）：断续的钢琴式短音，没有任何持续铺底。

为什么重做：上一版用 tools/music_synth.py 合成，那个工具每一段都有“低音持续音 + 和弦铺底”，每个和弦 14–16 秒不变，
审片测得 20 ms 包络在 4 秒窗口里只起伏 0.2–0.6 dB——整片是一层不断的长音。用户说过“不要任何持续音”。
music_synth.py 是公用工具，不改它；本片在这里自己排音符，只借用它的混响（reverb）和段落铃（bell）。

编排（方案 §4.11 的调式、速度不变）：
  - 夜段：D 小调，60 bpm，和弦 Dm → B♭ → F → C（每个 2 小节 = 8 秒）；
  - 昼段：D 大调，66 bpm，和弦 D → Bm → G → A（每个 2 小节）；
  - 每小节第 1 拍一个低一点的和弦根音（G3–F♯4，196–370 Hz），其余拍子上是 D4–D5（294–587 Hz）的和弦音，
    每 1 拍左右一个音，每个音 1–2 秒内衰减完（钢琴式：几条泛音、高泛音衰得快、起音 4 ms）；
  - 天亮（第 14 句“天亮后潮水按时回来”出现）时 4 秒交叉淡化：按每个音的起音时刻给夜段、昼段各自的权重，音自然响完；
  - 段落切换处一声很轻的铃（方案允许；要不要也去掉，留给用户定，见自检记录）；铃前后 1 秒不放音符；
  - 押注定格：第 3 句出现 1 秒后到第 4 句前 0.4 秒完全静音（数字静音），第 4 句“是B”出现时回来；
  - 响度：归一到 −16 LUFS（审片第二轮 P2-15：另两条有旁白的样片是 −15 LUFS，连着看时不再小声 3 dB；
    纯音乐片取 −16，比旁白片低 1 LU），真峰值 ≤ −1.5 dBTP（软限幅）。
时间点全部从 subs.json / beats.json 读，不手写秒数。

输出：public/v3/nightowl/music.wav（未归一）、mix.wav（终版音轨）

用法（不要在上一级目录运行：那里的 numbers.py 会顶掉标准库 numbers）：
  D:\desk\claudex\24\.venv\Scripts\python.exe 3_第三版资料\样片\nightowl\tools\make_music.py
"""
from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

VE = Path(__file__).resolve().parents[4] / "video-engine"
PUB = VE / "public" / "v3" / "nightowl"
SR = 48000

# 只借用公用工具里的混响和铃（不改它）
_spec = importlib.util.spec_from_file_location("music_synth", VE / "tools" / "music_synth.py")
ms = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ms)  # type: ignore[union-attr]

NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def piano(f: float, n: int) -> np.ndarray:
    """钢琴式短音：6 条略不谐和的泛音，高泛音衰得快；两段衰减（先快后慢），1–2 秒内降到 −40 dB 以下。"""
    t = np.arange(n) / SR
    B = 0.0004
    d1 = 3.4 + f / 700.0  # 越高的音衰得越快
    x = np.zeros(n)
    for k in range(1, 7):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        a = 1.0 / k ** 1.4
        dk = d1 * (1 + 0.55 * (k - 1))
        x += a * np.sin(2 * np.pi * fk * t + 0.3 * k) * (0.75 * np.exp(-dk * t) + 0.25 * np.exp(-dk * 0.45 * t))
    att = np.minimum(1.0, t / 0.004)
    tail = np.clip((n / SR - t) / 0.08, 0, 1)  # 截断处 80 ms 收尾，避免咔哒
    return x * att * tail / 1.9


def read_wav(p: Path) -> np.ndarray:
    with wave.open(str(p), "rb") as w:
        n = w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels())


def write_wav(p: Path, x: np.ndarray) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def ramp(t, t0: float, dur: float):
    return np.clip((t - t0) / dur, 0, 1)


def measure(p: Path) -> tuple[float, float]:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    s = r.stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", s)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", s)[-1])
    return i, tp


def band_report(x: np.ndarray) -> str:
    m = x.mean(axis=1)
    spec = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(len(m), 1 / SR)
    tot = spec.sum() or 1.0
    parts = [(0, 150), (150, 200), (200, 300), (300, 1000), (1000, 24000)]
    return "，".join(f"{a}–{b} Hz {spec[(f >= a) & (f < b)].sum() / tot:.0%}" for a, b in parts)


def envelope_report(x: np.ndarray, t_from: float, t_to: float) -> str:
    """20 ms RMS 包络（dB）在每个 4 秒窗口里的标准差：数值越大，越不像一层不断的铺底"""
    m = x.mean(axis=1)
    hop = int(0.02 * SR)
    frames = len(m) // hop
    rms = np.sqrt(np.mean(m[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    w = int(4 / 0.02)
    stds = []
    for k in range(int(t_from / 0.02), int(t_to / 0.02) - w, w):
        seg = db[k:k + w]
        seg = np.maximum(seg, seg.max() - 50)  # 只看 50 dB 动态范围内
        stds.append(seg.std())
    stds = np.array(stds)
    return f"4 秒窗口包络起伏（标准差）中位数 {np.median(stds):.1f} dB，最小 {stds.min():.1f} dB，最大 {stds.max():.1f} dB（{len(stds)} 个窗口）"


def place(h: int, lo: int, hi: int) -> int:
    """把音级 h（0–11）放到 [lo, hi] 里最低的那个八度"""
    m = lo + ((h - lo) % 12)
    return m if m <= hi else m - 12


def score(key_root: int, chords: list[tuple[int, list[int]]], bpm: float, t_start: float, t_end: float, seed: int,
          extra: float, avoid: list[float], hush: tuple[float, float]) -> list[tuple[float, int, float]]:
    """排音符：[(起音秒, midi, 力度)]。chords=[(根音音级, [和弦音音级…])]，每个和弦 2 小节。"""
    rng = np.random.default_rng(seed)
    beat = 60.0 / bpm
    bar = 4 * beat
    notes: list[tuple[float, int, float]] = []
    last = 66
    k = 0
    t = t_start
    while t < t_end:
        root, tones = chords[(k // 2) % len(chords)]
        pcs = [(key_root + x) % 12 for x in tones]
        # 第 1 拍：和弦根音（G3–F♯4）
        cand = [(t, place((key_root + root) % 12, 55, 66), 0.42)]
        # 第 2–4 拍（昼段多一个反拍）：D4–D5 的和弦音，就近走
        slots = [(1, 0.95), (2, 0.8), (3, 0.55)] + ([(2.5, extra)] if extra > 0 else [])
        for b, prob in slots:
            if rng.random() > prob:
                continue
            pool = [m for m in range(62, 75) if m % 12 in pcs]
            pool.sort(key=lambda m: abs(m - last) + rng.uniform(0, 3.5))
            m = pool[0] if rng.random() < 0.7 else pool[min(1, len(pool) - 1)]
            last = m
            cand.append((t + b * beat, m, rng.uniform(0.32, 0.46)))
        for tt, m, v in cand:
            if tt >= t_end or any(abs(tt - a) < 1.0 for a in avoid) or hush[0] <= tt < hush[1]:
                continue
            notes.append((tt, m, v))
        t += bar
        k += 1
    return notes


def main() -> None:
    subs = json.loads((PUB / "subs.json").read_text(encoding="utf-8"))
    beats = json.loads((PUB / "beats.json").read_text(encoding="utf-8"))
    dur = float(beats["durationSec"])  # = 最后一句 + 片尾 3.6 秒，和 Root.tsx 的 TAIL_SEC 一致
    assert abs(dur - (subs[-1]["t1"] + 3.6)) < 0.01, dur
    sub = lambda n: subs[n - 1]  # noqa: E731
    marks = [s["t0"] for s in beats["sections"][2:] if not s["id"].endswith("b")]  # 大段落起点（拆出的 b 段不加铃）
    dawn = sub(14)["t0"]  # 天色带转粉
    xfade = 4.0
    f0 = sub(3)["t0"] + 1.0  # 押注定格静音
    f1 = sub(4)["t0"] - 0.4
    reveal = sub(4)["t0"]
    n = int(round(dur * SR))
    t_all = np.arange(n) / SR

    D = NOTE["D"]
    # D 小调：i Dm(D F A) → VI B♭(B♭ D F) → III F(F A C) → VII C(C E G)（音级相对 D）
    night_chords = [(0, [0, 3, 7]), (8, [8, 0, 3]), (3, [3, 7, 10]), (10, [10, 2, 5])]
    # D 大调：I D(D F♯ A) → vi Bm(B D F♯) → IV G(G B D) → V A(A C♯ E)
    day_chords = [(0, [0, 4, 7]), (9, [9, 0, 4]), (5, [5, 9, 0]), (7, [7, 11, 2])]
    avoid = list(marks)
    hush = (f0 - 1.0, reveal + 0.5)  # 定格前 1 秒起不再起新音；揭晓那一下单独给
    night = score(D, night_chords, 60, 0.0, dawn + xfade, 7, 0.0, avoid, hush)
    night += [(reveal, 62, 0.42), (reveal + 0.02, 69, 0.36)]  # “是B”出现时配乐回来：D4 + A4 两个音
    day_start = dawn - 60.0 / 66 * 4  # 昼段从天亮前一小节起拍，交叉淡化里两边都有音
    day = score(D, day_chords, 66, day_start, dur - 1.5, 8, 0.35, avoid, hush)

    L = np.zeros(n)
    R = np.zeros(n)
    rng = np.random.default_rng(11)

    def add(notes, weight):
        for tt, m, v in notes:
            w = weight(tt)
            if w <= 0.01:
                continue
            s = int(tt * SR)
            ln = min(int(2.2 * SR), n - s)
            if ln <= 0:
                continue
            x = piano(hz(m), ln) * v * w
            pan = 0.5 + (m - 66) * 0.02 + rng.uniform(-0.06, 0.06)
            L[s:s + ln] += x * (1 - pan)
            R[s:s + ln] += x * pan

    add(night, lambda tt: float(np.cos(np.clip((tt - dawn) / xfade, 0, 1) * np.pi / 2)))
    add(day, lambda tt: float(np.sin(np.clip((tt - dawn) / xfade, 0, 1) * np.pi / 2)))
    # 段落铃：很轻（D6），4 秒衰减
    for mk in marks:
        s = int(mk * SR)
        if s >= n:
            continue
        ln = min(int(4 * SR), n - s)
        x = ms.bell(hz(D + 84), ln) * 0.05
        L[s:s + ln] += x
        R[s:s + ln] += x
    L = ms.reverb(L, mix=0.25)
    R = ms.reverb(R, mix=0.25)
    x = np.stack([L, R], axis=1)
    # 开头 0.75 秒淡入、结尾 2 秒淡出
    x *= (np.minimum(1, t_all / 0.75) * np.clip((dur - t_all) / 2.0, 0, 1))[:, None]
    # 押注定格：完全静音
    g = 1 - ramp(t_all, f0 - 0.5, 0.5) * (1 - ramp(t_all, f1, reveal - f1))
    x *= g[:, None]
    peak = np.abs(x).max()
    x = x / peak * 10 ** (-6 / 20)
    write_wav(PUB / "music.wav", x)
    print(f"音符：夜段 {len(night)}，昼段 {len(day)}；交叉淡化 {dawn:.2f}–{dawn + xfade:.2f} s；定格静音 {f0:.2f}–{f1:.2f} s，{reveal:.2f} s 回来；铃 {marks}")
    print("频段占比：", band_report(x))
    print("包络：", envelope_report(x, 15.0, dur - 3))

    # 响度：固定增益到 −16 LUFS，再软限幅到 −1.5 dBTP 以下
    target = -16.0
    i0, tp0 = measure(PUB / "music.wav")
    gain = 10 ** ((target - i0) / 20)
    y = x * gain
    lim = 10 ** (-2.0 / 20)
    a = np.abs(y)
    knee = lim * 0.8
    y = np.where(a > knee, np.sign(y) * (knee + (lim - knee) * np.tanh((a - knee) / (lim - knee))), y)
    write_wav(PUB / "mix.wav", y)
    i1, tp1 = measure(PUB / "mix.wav")
    print(f"music.wav：{i0:.1f} LUFS，峰值 {tp0:.1f} dBFS → mix.wav：{i1:.1f} LUFS，真峰值 {tp1:.1f} dBTP，时长 {n / SR:.2f} s")


if __name__ == "__main__":
    main()
