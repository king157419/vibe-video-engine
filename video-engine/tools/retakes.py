"""自动剪掉"念错重来"：识别文本里多出来、稿子里没有的片段（difflib 的 insert）就是废句，从音频里切掉。

只切 insert（录音里多出来的），不切 replace（识别错字，音频里确实念了稿子的内容）。
"""
from __future__ import annotations

import difflib
import wave
from pathlib import Path

import numpy as np

GAP_KEEP = 0.25  # 切完后两句之间保留的自然停顿（秒）
FILLERS = set("嗯啊呃额哦唔诶欸哎")  # 单独出现的语气词


def find_cuts(script: str, timed_text: str, timed, min_chars: int = 2, min_dur: float = 0.35):
    sm = difflib.SequenceMatcher(a=script, b=timed_text, autojunk=False)
    cuts = []
    for tag, _i1, _i2, j1, j2 in sm.get_opcodes():
        if tag != "insert":
            continue
        s, e = timed[j1][0], timed[j2 - 1][1]
        only_fillers = all(c in FILLERS for c in timed_text[j1:j2])
        if only_fillers:
            if e - s < 0.15:
                continue
        elif (j2 - j1) < min_chars or e - s < min_dur:
            continue
        prev_end = timed[j1 - 1][1] if j1 > 0 else 0.0
        next_start = timed[j2][0] if j2 < len(timed) else e + GAP_KEEP
        cut_s = max(prev_end + 0.05, s - 0.05)
        cut_e = max(cut_s, next_start - GAP_KEEP)
        if cut_e - cut_s > 0.2:
            cuts.append((cut_s, cut_e, timed_text[j1:j2]))
    return cuts


def apply_cuts(wav_in: Path, wav_out: Path, cuts):
    with wave.open(str(wav_in), "rb") as w:
        params = w.getparams()
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch)
    assert sw == 2, "需要 16-bit PCM wav（clean_audio.py 的输出即是）"
    fade = int(0.03 * sr)  # 切点 30ms 淡入淡出，避免"咔哒"声
    keep, pos = [], 0
    for s, e, _ in sorted(cuts):
        a, b = int(s * sr), int(e * sr)
        seg = data[pos:a].astype(np.float32)
        if len(seg) > fade:
            seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
        keep.append(seg)
        pos = b
    tail = data[pos:].astype(np.float32)
    keep.append(tail)
    for k in range(1, len(keep)):
        if len(keep[k]) > fade:
            keep[k][:fade] *= np.linspace(0, 1, fade)[:, None]
    out = np.concatenate(keep).clip(-32768, 32767).astype(np.int16)
    with wave.open(str(wav_out), "wb") as w:
        w.setparams(params)
        w.writeframes(out.tobytes())


def remap(timed_text: str, timed, cuts):
    """去掉落在切口里的字，并把后面的时间往前挪。"""
    cuts = sorted(cuts)

    def shift(t):
        d = 0.0
        for s, e, _ in cuts:
            if t >= e:
                d += e - s
            elif t > s:
                return None
        return t - d

    text, out = "", []
    for c, (s, e) in zip(timed_text, timed):
        ns, ne = shift(s), shift(e)
        if ns is None or ne is None:
            continue
        text += c
        out.append((ns, ne))
    return text, out
