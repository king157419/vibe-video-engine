# -*- coding: utf-8 -*-
"""赫布配乐：用公共的 video-engine/tools/score.py 合成，只换掉「叮」的音色（审片 P2，声音）。

不改共用的 score.py：这里把它当模块载入，替换模块里的 bell()，再调用它自己的 render() / write_wav()。
其余乐器、段落、混响、硬静音、母带处理全部是 score.py 原样。

为什么换 bell：原来的 FM 铃（调制比 3.5、调制指数 2.2）在起音后几毫秒里有 14–20 kHz 的边带，
波形上是一个单样本跳变（戴耳机像「嗒」）；2.5 倍、4.5 倍两个边带在起音 150 ms 内比 1760 Hz 基频还高约 5 dB，
手机外放会发尖。这里对铃声本身：
  1. 8 阶低通 9 kHz（只作用在铃声上；12 kHz 以上在整条配乐里本来只占 0.05% 能量）；
  2. 2.5f（4.4 kHz）、4.5f（7.9 kHz）各一个 -4 dB 的峰值滤波（Q 3）；
  3. 3 ms 升余弦起音（原来是 2 ms 线性）。
基频、2 倍泛音、衰减时间都不变，所以还是同一声「叮」。

用法：D:\\conda\\envs\\d2l\\python.exe score_hebb.py <cue.json> <out.wav>
"""
import importlib.util
import json
import sys

import numpy as np
from scipy.signal import butter, sosfilt, lfilter

ENGINE = r'D:\desk\claudex\24\video-engine\tools\score.py'
spec = importlib.util.spec_from_file_location('score', ENGINE)
score = importlib.util.module_from_spec(spec)
spec.loader.exec_module(score)
SR = score.SR
_bell_fm = score.bell


def _peak(x, f0, gain_db, q):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A])
    a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x)


# 第二轮审片（声音 P1）：叮6 仍偏刺（8 kHz 以上 -20 dBFS、跳变 0.26）→ 七声叮统一：低通 9 → 7 kHz、起音 3 → 5 ms。
_LP = butter(8, 7000, 'lowpass', fs=SR, output='sos')


def bell_soft(f, dur, gain):
    x = _bell_fm(f, dur, 1.0)
    x = sosfilt(_LP, x)
    x = _peak(x, 2.5 * f, -4.0, 3.0)
    x = _peak(x, 4.5 * f, -4.0, 3.0)
    n = len(x)
    k = int(0.005 * SR)
    env = np.ones(n)
    env[:k] = 0.5 * (1 - np.cos(np.pi * np.arange(k) / k))
    return x * env * gain


score.bell = bell_soft

if __name__ == '__main__':
    cue = json.load(open(sys.argv[1], encoding='utf-8'))
    out = sys.argv[2]
    x = score.render(cue)
    score.write_wav(out, x)
    print(f'wrote {out} {cue["dur"]}s (score.py engine, hebb bell)')
