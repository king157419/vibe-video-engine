"""把你的录音和口播稿对齐，生成逐字字幕 captions.json。

原理：faster-whisper 识别出带时间戳的文字 → 与 script.txt 做序列对齐（以稿子为准，识别错字不影响字幕）。
所以念的时候可以小改几个字；大段增删的话，请同步改 script.txt 再跑。

用法: python tools/transcribe.py public/episodes/EP01 [--model large-v3-turbo] [--cpu]
前置: 先跑 tools/clean_audio.py 生成 audio.wav
首次运行会下载模型（large-v3-turbo 约 1.6GB）；下载慢可先设置环境变量 HF_ENDPOINT=https://hf-mirror.com
"""
from __future__ import annotations

import argparse
import os
import shutil
import site
import subprocess
import sys
from pathlib import Path

from script_text import align, build_captions, parse_script, split_lines, write_json


os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


def add_cuda_dlls():
    """pip 装的 nvidia-cublas / nvidia-cudnn 的 DLL 需要手动加入搜索路径（Windows）。"""
    for sp in site.getsitepackages():
        for sub in ("nvidia/cublas/bin", "nvidia/cudnn/bin", "nvidia/cuda_runtime/bin"):
            d = Path(sp) / sub
            if d.is_dir():
                os.add_dll_directory(str(d))
                os.environ["PATH"] = str(d) + os.pathsep + os.environ["PATH"]


def to_simplified(s: str) -> str:
    try:
        from opencc import OpenCC  # 可选：pip install opencc-python-reimplemented

        return OpenCC("t2s").convert(s)
    except Exception:
        return s


def load_16k(path: Path):
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("episode_dir")
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--cpu", action="store_true")
    ap.add_argument("--no-cut", action="store_true", help="不自动剪掉念错重来的片段")
    ap.add_argument("--max-line", type=int, default=14, help="字幕每行最多字数（竖屏 14，横屏 22）")
    args = ap.parse_args()

    ep = Path(args.episode_dir)
    audio = ep / "audio.wav"
    if not audio.exists():
        raise SystemExit("缺少 audio.wav：先运行 tools/clean_audio.py")
    raw = (ep / "script.txt").read_text(encoding="utf-8")
    tts_text, chars = parse_script(raw)

    add_cuda_dlls()
    from faster_whisper import WhisperModel

    if args.cpu:
        model = WhisperModel(args.model, device="cpu", compute_type="int8")
    else:
        try:
            model = WhisperModel(args.model, device="cuda", compute_type="float16")
        except Exception as e:  # 没有可用 GPU 时退回 CPU
            print(f"GPU 不可用（{e}），改用 CPU")
            model = WhisperModel(args.model, device="cpu", compute_type="int8")

    segments, _ = model.transcribe(
        load_16k(audio),  # 自己用 ffmpeg 解码，绕开 PyAV 版本不兼容
        language="zh",
        word_timestamps=True,
        vad_filter=True,
        initial_prompt=tts_text[:180],  # 用稿子开头做提示：简体、标点风格、专有名词
        condition_on_previous_text=False,
    )
    timed_text, timed = "", []
    for seg in segments:
        for w in seg.words or []:
            txt = "".join(c for c in to_simplified(w.word) if c.strip() and c not in "，。！？、,.!?；;：:“”\"")
            if not txt:
                continue
            step = (w.end - w.start) / len(txt)
            for j, c in enumerate(txt):
                timed_text += c
                timed.append((w.start + j * step, w.start + (j + 1) * step))

    if not args.no_cut:
        from retakes import apply_cuts, find_cuts, remap

        script = "".join(ch["c"] for ch in chars if not ch.get("sym"))
        cuts = find_cuts(script, timed_text, timed)
        if cuts:
            uncut = ep / "audio_uncut.wav"
            shutil.copyfile(audio, uncut)
            apply_cuts(uncut, audio, cuts)
            timed_text, timed = remap(timed_text, timed, cuts)
            log = [f"{s:7.2f}s - {e:7.2f}s  剪掉：{t}" for s, e, t in cuts]
            (ep / "retakes.txt").write_text("\n".join(log), encoding="utf-8")
            print(f"自动剪掉 {len(cuts)} 处念错/重复（明细见 retakes.txt，原音频备份 audio_uncut.wav）：")
            print("\n".join(log))

    ratio = align(chars, timed_text, timed)
    lines = split_lines(chars, args.max_line)
    dur = probe_duration(audio)
    cap = build_captions(chars, lines, {
        "id": ep.name,
        "audio": f"episodes/{ep.name}/audio.wav",
        "durationMs": round(dur * 1000),
        "voice": "本人录音",
    })
    write_json(ep / "captions.json", cap)
    print(f"ok: {dur:.1f}s, {len(cap['lines'])} lines, 稿子与录音对上 {ratio:.0%}")
    if ratio < 0.85:
        print("⚠ 对齐率偏低：录音和稿子差别较大，请检查 script.txt 是否是这次念的版本")


if __name__ == "__main__":
    main()
