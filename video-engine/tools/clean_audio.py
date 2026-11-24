"""录音清理：去低频嗡声 → 轻度降噪 → 压缩过长停顿 → 响度标准化，输出 audio.wav。

用法: python tools/clean_audio.py public/episodes/EP01 [--keep-pauses] [--lufs -14]
输入: 该目录下的 voice.(wav|m4a|mp3|aac|flac|mp4|mov) —— 你的原始录音（手机录的也行）
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

EXTS = ("wav", "m4a", "mp3", "aac", "flac", "mp4", "mov", "ogg", "opus")


def find_voice(ep: Path) -> Path:
    for ext in EXTS:
        p = ep / f"voice.{ext}"
        if p.exists():
            return p
    raise SystemExit(f"找不到录音：请把录音命名为 voice.wav / voice.m4a 等放进 {ep}")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("episode_dir")
    ap.add_argument("--lufs", type=float, default=-14.0, help="目标响度（短视频平台常用 -14 LUFS）")
    ap.add_argument("--keep-pauses", action="store_true", help="不压缩停顿")
    ap.add_argument("--max-pause", type=float, default=0.8, help="超过这个秒数的停顿才压缩")
    ap.add_argument("--keep-pause", type=float, default=0.45, help="压缩后保留的停顿长度")
    ap.add_argument("--denoise", type=float, default=12, help="afftdn 降噪强度 dB，0 关闭")
    args = ap.parse_args()

    ep = Path(args.episode_dir)
    src = find_voice(ep)
    chain = ["highpass=f=80", "lowpass=f=16000"]
    if args.denoise > 0:
        chain.append(f"afftdn=nr={args.denoise}:nf=-45:tn=1")
    if not args.keep_pauses:
        # 超过 max-pause 的停顿压到 keep-pause，开头的静音也去掉
        chain.append(
            f"silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15:"
            f"stop_periods=-1:stop_threshold=-45dB:stop_duration={args.max_pause}:stop_silence={args.keep_pause}"
        )
    chain.append("acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2")
    target = f"I={args.lufs}:TP=-1.5:LRA=11"

    # 两遍 loudnorm：第一遍测量，第二遍按测量值线性归一（比单遍更准、不"抽"）
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-vn", "-ac", "1", "-ar", "48000",
         "-af", ",".join(chain + [f"loudnorm={target}:print_format=json"]), "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=True,
    ).stderr
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", probe, re.S).group(0))
    second = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
              f"offset={m['target_offset']}:linear=true")
    out = ep / "audio.wav"
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "1", "-ar", "48000",
           "-af", ",".join(chain + [second]), "-c:a", "pcm_s16le", str(out)]
    subprocess.run(cmd, check=True)
    print(f"ok: {src.name} -> {out}（原始响度 {m['input_i']} LUFS → 目标 {args.lufs}）")


if __name__ == "__main__":
    main()
