# -*- coding: utf-8 -*-
"""赫布：music.wav → mix.wav（EQ + 两遍 loudnorm）。
审片修改（声音 P1 / P2）：
  - 先过一道 EQ，把手机外放听不到的低频让出来、把钢琴和旋律所在的中频提起来；
  - 第二遍 loudnorm 的 TP 目标 -2.0（AAC 编码后会上浮约 0.04 dB，成片仍 ≤ -1.5）。
用法：python mix.py <music.wav> <mix.wav> [EQ 字符串] [第二遍 LRA 目标]
"""
import json
import re
import subprocess
import sys

EQ_DEFAULT = 'equalizer=f=90:t=q:w=1:g=-3,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=1500:t=q:w=1.2:g=3.5'


def main():
    src, dst = sys.argv[1], sys.argv[2]
    eq = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] not in ('', '-') else EQ_DEFAULT
    lra2 = sys.argv[4] if len(sys.argv) > 4 else '10'
    p1 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', f'{eq},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                        capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', p1, re.S).group(0))
    print('第一遍', {k: m[k] for k in ('input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset')})
    ln = (f"loudnorm=I=-16:TP=-2.0:LRA={lra2}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
    p2 = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', src, '-af', f'{eq},{ln}', '-ar', '48000', '-c:a', 'pcm_s16le', dst],
                        capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    m2 = json.loads(re.search(r'\{[^{}]*"output_i"[^{}]*\}', p2, re.S).group(0))
    print('第二遍', {k: m2[k] for k in ('output_i', 'output_tp', 'output_lra', 'normalization_type')})
    print('EQ', eq)


if __name__ == '__main__':
    main()
