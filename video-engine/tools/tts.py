"""用 edge-tts 生成【占位配音】+ 逐字时间，用于样片演示。

正式视频请用你自己的录音 + tools/transcribe.py。

用法: python tools/tts.py public/episodes/demo [--voice zh-CN-YunxiNeural] [--rate -6%]
输出: audio.mp3, captions.json
"""
from __future__ import annotations

import argparse
import asyncio
import subprocess
import sys
from pathlib import Path

import edge_tts

import wave

from script_text import PAUSE_RE, align, build_captions, parse_script, split_lines, write_json


async def synth(text: str, voice: str, rate: str, pitch: str, out_mp3: Path):
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    words = []
    with out_mp3.open("wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                d = chunk["duration"] / 1e7
                words.append((chunk["text"], s, s + d))
    return words


def synth_with_pauses(raw: str, args, audio: Path):
    """按 [停N秒] 把稿子切段，分段合成后在段间插入静音，词时间整体平移。"""
    parts, pauses, pos = [], [], 0
    for m in PAUSE_RE.finditer(raw):
        parts.append(raw[pos:m.start()])
        pauses.append(float(m.group(1)))
        pos = m.end()
    parts.append(raw[pos:])
    tmp = audio.parent / "_tts_parts"
    tmp.mkdir(exist_ok=True)
    rate = 24000
    pcm, words, offset = [], [], 0.0
    for k, part in enumerate(parts):
        text, _ = parse_script(part)
        if text.strip():
            mp3, wav = tmp / f"{k}.mp3", tmp / f"{k}.wav"
            ws = asyncio.run(synth(text, args.voice, args.rate, args.pitch, mp3))
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", str(rate),
                            "-c:a", "pcm_s16le", str(wav)], check=True)
            with wave.open(str(wav)) as w:
                frames = w.readframes(w.getnframes())
            pcm.append(frames)
            words += [(t, s + offset, e + offset) for t, s, e in ws]
            offset += len(frames) / 2 / rate
        if k < len(pauses):
            n = int(pauses[k] * rate)
            pcm.append(bytes(2) * n)
            offset += n / rate
    joined = tmp / "joined.wav"
    with wave.open(str(joined), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"".join(pcm))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(joined), "-c:a", "libmp3lame", "-b:a", "128k",
                    str(audio)], check=True)
    return words


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
    ap.add_argument("--voice", default="zh-CN-YunxiNeural")
    ap.add_argument("--rate", default="-6%")
    ap.add_argument("--pitch", default="-4Hz")
    ap.add_argument("--max-line", type=int, default=14, help="字幕每行最多字数（竖屏 14，横屏 22）")
    args = ap.parse_args()

    ep = Path(args.episode_dir)
    raw = (ep / "script.txt").read_text(encoding="utf-8")
    tts_text, chars = parse_script(raw)
    audio = ep / "audio.mp3"
    if PAUSE_RE.search(raw):
        words = synth_with_pauses(raw, args, audio)
    else:
        words = asyncio.run(synth(tts_text, args.voice, args.rate, args.pitch, audio))

    # 词级时间 -> 字级时间（词内均分）
    timed_text, timed = "", []
    for w, s, e in words:
        w = "".join(c for c in w if c.strip())
        if not w:
            continue
        step = (e - s) / len(w)
        for j, c in enumerate(w):
            timed_text += c
            timed.append((s + j * step, s + (j + 1) * step))

    ratio = align(chars, timed_text, timed)
    lines = split_lines(chars, args.max_line)
    dur = probe_duration(audio)
    cap = build_captions(chars, lines, {
        "id": ep.name,
        "audio": f"episodes/{ep.name}/audio.mp3",
        "durationMs": round(dur * 1000),
        "voice": f"edge-tts {args.voice} (占位配音)",
    })
    write_json(ep / "captions.json", cap)
    print(f"ok: {audio} {dur:.1f}s, {len(cap['lines'])} lines, align {ratio:.0%}, keywords={cap['keywords']}")


if __name__ == "__main__":
    main()
