"""样片二《煮不死的种子》混音：旁白 + 配乐（静音窗）→ public/v3/rice/mix.wav

做法（CONTRACT §0.5、§2）：
1. 配乐 music.wav 按“比旁白低 20 dB（按整段响度）”定增益；
2. 两个静音窗（押注定格、回锅白闪）里配乐也停，窗口两端各 0.2 秒淡出/淡入；
3. 旁白 + 配乐相加，两遍 loudnorm 到 −15 LUFS、真峰值 ≤ −1.5 dBTP。

用法（在 video-engine 下）：
  ..\\.venv\\Scripts\\python.exe ..\\3_第三版资料\\样片\\rice\\mix.py
静音窗来自 captions.json 的字时间：
  押注定格：“先选一个”的“个”字结束前 0.2 秒开始淡出 → “答案是A”的“答”字开始；
  回锅白闪：“两碗都下锅，炒透”的“透”字结束 → “长出来的细菌”的“长”字开始。
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3] / "video-engine"
PUB = ROOT / "public" / "v3" / "rice"
SR = 48000
FADE = 0.2
MUSIC_UNDER_VOICE_DB = 20.0


def loudness(path: Path) -> float:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    return float(m[-1])


def anchors():
    cap = json.loads((PUB / "captions.json").read_text(encoding="utf-8"))
    # 一个字时间块里可能带句末标点（如“子？”），逐字展开，每个字指回它所在的块
    chars, text = [], ""
    for line in cap["lines"]:
        for c in line["chars"]:
            for ch in c["t"].strip():
                chars.append(c)
                text += ch

    def find(word: str, nth: int = 1):
        pos = -1
        for _ in range(nth):
            pos = text.index(word, pos + 1)
        return chars[pos]["s"] / 1000, chars[pos + len(word) - 1]["e"] / 1000

    return find, cap["durationMs"] / 1000


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    find, dur_voice = anchors()
    w1 = (find("先选一个")[1] - FADE, find("答案是A")[0])
    w2 = (find("炒透", 3)[1], find("长出来的细菌")[0])
    print(f"静音窗 1（押注定格）：{w1[0]:.2f}–{w1[1]:.2f} 秒")
    print(f"静音窗 2（回锅白闪）：{w2[0]:.2f}–{w2[1]:.2f} 秒")

    with wave.open(str(PUB / "music.wav")) as w:
        assert w.getframerate() == SR and w.getnchannels() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64).reshape(-1, 2) / 32768
    t = np.arange(len(x)) / SR
    env = np.ones(len(x))
    for a, b in (w1, w2):
        # a 之前 FADE 秒内淡出到 0（从 a 开始全静），b 之后 FADE 秒内淡入
        down = np.clip((a + FADE - t) / FADE, 0, 1)  # a..a+FADE 从 1 到 0
        up = np.clip((t - b) / FADE, 0, 1)
        g = np.where(t < a, 1.0, np.where(t < b, down, up))
        env = np.minimum(env, g)
    x = x * env[:, None]

    lv = loudness(PUB / "audio.mp3")
    lm = loudness(PUB / "music.wav")
    gain_db = (lv - MUSIC_UNDER_VOICE_DB) - lm
    print(f"旁白 {lv:.1f} LUFS，配乐 {lm:.1f} LUFS → 配乐增益 {gain_db:.1f} dB")
    x *= 10 ** (gain_db / 20)
    env_path = PUB / "_music_env.wav"
    with wave.open(str(env_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())

    pre = PUB / "_premix.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(PUB / "audio.mp3"), "-i", str(env_path), "-filter_complex",
                    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];"
                    "[v][1:a]amix=inputs=2:duration=longest:normalize=0[m]", "-map", "[m]",
                    "-c:a", "pcm_s16le", str(pre)], check=True)
    # loudnorm 第一遍测量
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(pre), "-af",
                        "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    js = json.loads(r[r.rindex("{"):r.rindex("}") + 1])
    flt = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
           f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:"
           f"linear=true:print_format=summary")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(pre), "-af", flt, "-ar", "48000",
                    "-c:a", "pcm_s16le", str(PUB / "mix.wav")], check=True)
    env_path.unlink()
    pre.unlink()
    print(f"混音完成：{PUB / 'mix.wav'}，最终响度 {loudness(PUB / 'mix.wav'):.1f} LUFS")


if __name__ == "__main__":
    main()
