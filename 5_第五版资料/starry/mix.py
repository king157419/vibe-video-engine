"""两遍 loudnorm：music.wav -> mix.wav（I -16, TP -1.5, 第二遍 linear）。
可选前级滤波（两遍都加）；最后把 silences 区间精确置零（score.py 的 28 Hz 高通在切断处有约 50 ms 的振铃漏进静音）。"""
import json, re, subprocess, sys, wave
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
pre = sys.argv[3] + ',' if len(sys.argv) > 3 and sys.argv[3] else ''
# Boundary chapter re-entry: 0.25s ramp, +3.5dB for its first eight seconds,
# then a 1s release. Applied identically to both loudnorm passes.
pre = "volume='1+0.50*min(max((t-180)/0.25,0),1)*min(max(189-t,0),1)':eval=frame," + pre
cue = json.load(open(sys.argv[4], encoding='utf-8')) if len(sys.argv) > 4 else {'silences': []}
I, TP, LRA = -16, -2.0, 10


def run(args):
    p = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return p.stderr


err = run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', f'{pre}loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'])
m = json.loads(re.findall(r'\{[^{}]*\}', err, re.S)[-1])
print('pass1', {k: m[k] for k in ('input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset')})
af = (f"{pre}loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
tmp = dst + '.tmp.wav'
err = run(['ffmpeg', '-hide_banner', '-nostats', '-y', '-i', src, '-af', af, '-ar', '48000', '-c:a', 'pcm_s16le', tmp])
m2 = json.loads(re.findall(r'\{[^{}]*\}', err, re.S)[-1])
print('pass2', {k: m2[k] for k in ('output_i', 'output_tp', 'output_lra', 'normalization_type')})

w = wave.open(tmp)
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).copy()
w.close()
for a, b in cue.get('silences', []):
    x[int(round(a * sr)):int(round(b * sr))] = 0
o = wave.open(dst, 'wb')
o.setnchannels(2)
o.setsampwidth(2)
o.setframerate(sr)
o.writeframes(x.tobytes())
o.close()
import os
os.remove(tmp)
print('wrote', dst, len(x) / sr, 's')

