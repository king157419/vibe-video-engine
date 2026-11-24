# -*- coding: utf-8 -*-
"""赫布：混音验收（按声音审片的口径复测）。
用法：python audio_check.py <wav 或 mp4> [cue.json] [--ref <mix.wav>]
输出：
  - 全频 I / LRA / TP（ffmpeg ebur128）；手机加权（250 Hz 二阶高通两次）后的 I，和全频的差
  - 频段能量占比：<150 / 150–400 / 400–2500 / >2500 Hz
  - 每段配乐（cue.sections）的短时响度中位 / 最大，全频和手机加权两套；M16 的短时最大排第几
  - 七声叮：起音后 20 ms 内最大单样本跳变、14 kHz 以上峰值（dBFS）、2.5–5 kHz 400 ms RMS
  - 给了 --ref：和参考 wav 的互相关延迟（前 12 秒）
"""
import json
import re
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt, welch


def load(path, sr=48000):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64), sr


def r128(path, af=''):
    flt = (af + ',' if af else '') + 'ebur128=peak=true:framelog=info'
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', flt, '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace')
    err = p.stderr
    ts, M, S = [], [], []
    for m in re.finditer(r't:\s*([\d.]+)\s+TARGET:.*?M:\s*(-?[\d.inf]+)\s+S:\s*(-?[\d.inf]+)', err):
        ts.append(float(m.group(1)))
        M.append(float(m.group(2)) if 'inf' not in m.group(2) else -120.0)
        S.append(float(m.group(3)) if 'inf' not in m.group(3) else -120.0)
    summ = err[err.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s+(-?[\d.]+)', summ).group(1))
    return {'I': g('I'), 'LRA': g('LRA'), 'TP': g('Peak'), 't': np.array(ts), 'M': np.array(M), 'S': np.array(S)}


def main():
    args = sys.argv[1:]
    path = args[0]
    cue = None
    ref = None
    if '--ref' in args:
        ref = args[args.index('--ref') + 1]
    for a in args[1:]:
        if a.endswith('.json'):
            cue = json.load(open(a, encoding='utf-8'))
    full = r128(path)
    phone = r128(path, 'highpass=f=250:p=2,highpass=f=250:p=2')
    print(f"全频  I {full['I']:.2f}  LRA {full['LRA']:.1f}  TP {full['TP']:.2f}")
    print(f"手机  I {phone['I']:.2f}  （掉 {full['I'] - phone['I']:.2f} LU）")
    x, sr = load(path)
    mono = x.mean(1)
    f, p = welch(mono, sr, nperseg=8192)
    tot = p.sum()
    bands = [(0, 150), (150, 400), (400, 2500), (2500, 24000)]
    print('频段占比', '  '.join(f"{a}-{b}: {100 * p[(f >= a) & (f < b)].sum() / tot:.1f}%" for a, b in bands))
    if cue:
        rows = []
        for s in cue['sections']:
            a, b = s['t0'], s['t1']
            sel = (full['t'] >= a + 3) & (full['t'] <= b)
            if sel.sum() < 3:
                sel = (full['t'] >= a + 0.5) & (full['t'] <= b + 0.5)
            fs = full['S'][sel]
            ps = np.interp(full['t'][sel], phone['t'], phone['S'])
            rows.append((s.get('name', ''), a, b, np.median(fs), fs.max(), np.median(ps), ps.max()))
        order = sorted(range(len(rows)), key=lambda i: -rows[i][6])
        order_f = sorted(range(len(rows)), key=lambda i: -rows[i][4])
        for i, r in enumerate(rows):
            print(f"{r[0][:14]:<16}{r[1]:7.1f}-{r[2]:6.1f}  S中位 {r[3]:6.1f}  S最大 {r[4]:6.1f} (第{order_f.index(i) + 1})   手机 中位 {r[5]:6.1f} 最大 {r[6]:6.1f} (第{order.index(i) + 1})")
        # 叮
        hp = sosfilt(butter(8, 14000, "highpass", fs=sr, output="sos"), mono)
        hp8 = sosfilt(butter(8, 8000, "highpass", fs=sr, output="sos"), mono)
        bp = sosfilt(butter(4, [2500, 5000], 'bandpass', fs=sr, output='sos'), mono)
        for h in cue['hits']:
            if h['type'] in ('bell', 'note'):
                i = int(h['t'] * sr)
                seg = mono[i - 20:i + int(0.02 * sr)]
                jump = np.abs(np.diff(seg)).max()
                hpk = 20 * np.log10(np.abs(hp[i:i + int(0.2 * sr)]).max() + 1e-12)
                hpk8 = 20 * np.log10(np.abs(hp8[i - 20:i + int(0.2 * sr)]).max() + 1e-12)
                rms = 20 * np.log10(np.sqrt(np.mean(bp[i:i + int(0.4 * sr)] ** 2)) + 1e-12)
                print(f"叮 @{h['t']:6.2f}  最大单样本跳变 {jump:.3f}  >8k 峰值 {hpk8:6.1f} dBFS  >14k 峰值 {hpk:6.1f} dBFS  2.5–5k RMS {rms:6.1f} dBFS")
    # 最响的瞬间（400 ms 响度，至少相隔 3 s）
    order = np.argsort(-full['M'])
    picked = []
    for i in order:
        if all(abs(full['t'][i] - full['t'][j]) >= 3 for j in picked):
            picked.append(i)
        if len(picked) >= 8:
            break
    print('最响的瞬间（M，400 ms）', '  '.join(f"{full['t'][i]:.1f}s {full['M'][i]:.1f}" for i in picked))
    # 低于 I − 3.5 的最长连续段（S，3 s）
    thr = full['I'] - 3.5
    low = full['S'] < thr
    best, cur, st, bst = 0.0, 0.0, 0.0, 0.0
    for i in range(1, len(low)):
        if low[i]:
            if not low[i - 1]:
                st = full['t'][i]
            cur = full['t'][i] - st
            if cur > best:
                best, bst = cur, st
    print(f"S 低于 I−3.5 的最长连续段：{best:.1f} s（从 {bst:.1f} s 起）；低于 I−4 的时间占比 {100 * np.mean(full['S'] < full['I'] - 4):.1f}%")
    if ref:
        y, _ = load(ref)
        a = mono[:12 * sr]
        b = y.mean(1)[:12 * sr]
        n = 1 << int(np.ceil(np.log2(len(a) + len(b))))
        c = np.fft.irfft(np.fft.rfft(a, n) * np.conj(np.fft.rfft(b, n)), n)
        k = int(np.argmax(c))
        if k > n // 2:
            k -= n
        print(f"相对参考的延迟：{k} 个采样 = {1000 * k / sr:.1f} ms（正 = 本文件更晚）")


if __name__ == '__main__':
    main()
