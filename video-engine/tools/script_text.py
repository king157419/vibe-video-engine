"""口播稿解析 + 字幕切分 + 字级时间对齐（TTS 与真人录音共用）。

稿子约定（script.txt）:
  - 每一行 = 一个自然停顿/字幕行，长行会在标点处再切
  - **关键词**  -> 字幕里高亮
  - /  或  //   -> 录音停顿提示，不念、不上字幕
  - [停2秒]      -> 留白停顿（给观众想一想），不念、不上字幕；TTS 会插入同样长的静音
"""
from __future__ import annotations

import difflib
import json
import re
from pathlib import Path

PAUSE_RE = re.compile(r"\[停\s*([\d.]+)\s*秒\]")

PUNCT = set("，。！？；：、,.!?;:…—-·“”\"‘’'（）()【】[]「」『』《》 \t")
SENT_END = set("。！？!?…")
KEEP_IN_DISPLAY = set("《》？！")
MAX_LINE = 14  # 竖屏大字字幕，一行最多字数


def parse_script(raw: str):
    """返回 (tts_text, chars)；chars 为逐字信息: {c, hl, brk, sent}。

    hl  : 是否在 **关键词** 内
    brk : 该字后是否有标点/换行（候选断句点），值为标点字符或 '\\n'
    """
    # 去掉录音停顿标记；__下划线__ 标记只给读书笔记样式用，这里一并去掉
    raw = raw.replace("\r\n", "\n").replace("//", "").replace("/", "").replace("__", "")
    raw = PAUSE_RE.sub("", raw)
    chars = []
    hl = False
    bk = False  # 书名号内
    i = 0
    tts_parts = []
    while i < len(raw):
        if raw.startswith("**", i):
            hl = not hl
            i += 2
            continue
        ch = raw[i]
        tts_parts.append(ch)
        if ch == "\n":
            if chars:
                # 换行 = 字幕换行；只有句末标点或空行（分段）才算一句结束
                chars[-1]["brk"] = chars[-1]["brk"] or "\n"
                chars[-1]["nl"] = True
                if raw[i + 1 : i + 2] == "\n" or not raw[i + 1 :].strip():
                    chars[-1]["para"] = True
                    chars[-1]["sent"] = True
        elif ch in PUNCT:
            if chars:
                if ch in KEEP_IN_DISPLAY and ch not in "《":
                    chars[-1]["tail"] = chars[-1].get("tail", "") + ch
                if ch not in "《》“”‘’「」『』（）()":
                    chars[-1]["brk"] = ch
                if ch in SENT_END:
                    chars[-1]["sent"] = True
            if ch == "《":
                bk = True
                chars.append({"c": "《", "hl": hl, "brk": "", "sent": False, "sym": True, "bk": True})
            elif ch == "》":
                bk = False
        else:
            chars.append({"c": ch, "hl": hl, "brk": "", "sent": False, "bk": bk})
        i += 1
    tts_text = "".join(tts_parts).replace("\n", "")
    return tts_text, chars


def speakable(chars):
    return [k for k, ch in enumerate(chars) if not ch.get("sym")]


def split_lines(chars, max_len: int = MAX_LINE):
    """按换行/标点切成字幕行，超长时在最后一个标点处再切。返回 [[idx...], ...]"""
    lines, cur = [], []
    for k, ch in enumerate(chars):
        cur.append(k)
        if ch.get("nl") or ch["sent"]:
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)

    def glued(j, ln):  # j 与 j+1 之间不能切：关键词内部 / 书名号内部
        a, b = chars[ln[j]], chars[ln[j + 1]]
        return (a["hl"] and b["hl"]) or (a.get("bk") and b.get("bk"))

    out = []
    for ln in lines:
        while len(ln) > max_len:
            n = len(ln)
            cands = [j for j in range(2, n - 3) if chars[ln[j]]["brk"] and j + 1 <= max_len]
            if cands:  # 优先在标点处切，切得尽量均匀
                cut = min(cands, key=lambda j: abs((j + 1) - n / 2))
            elif n <= max_len + 3:
                break  # 没标点且只超一点：整行保留，由渲染端缩字号，避免切出孤字
            else:
                cut = min(max_len, (n + 1) // 2) - 1
                while cut > 2 and glued(cut, ln):
                    cut -= 1
            out.append(ln[: cut + 1])
            ln = ln[cut + 1 :]
        if ln:
            out.append(ln)
    return out


def align(chars, timed_text: str, timed: list[tuple[float, float]]):
    """把识别/合成得到的逐字时间 (timed_text[i] -> timed[i]) 对齐到稿子的字上。

    稿子是准的，识别结果可能有错字，所以用 difflib 做序列对齐，没对上的字线性插值。
    """
    idx = speakable(chars)
    script = "".join(chars[k]["c"] for k in idx)
    sm = difflib.SequenceMatcher(a=script, b=timed_text, autojunk=False)
    times: list[tuple[float, float] | None] = [None] * len(script)
    for a, b, n in sm.get_matching_blocks():
        for t in range(n):
            times[a + t] = timed[b + t]
    # 插值
    known = [i for i, t in enumerate(times) if t is not None]
    if not known:
        raise RuntimeError("对齐失败：识别文本与稿子几乎没有重合")
    for i in range(len(times)):
        if times[i] is None:
            prev = max((k for k in known if k < i), default=None)
            nxt = min((k for k in known if k > i), default=None)
            if prev is None:
                s = times[nxt][0]
                times[i] = (s, s)
            elif nxt is None:
                e = times[prev][1]
                times[i] = (e, e)
            else:
                s0, e0 = times[prev][1], times[nxt][0]
                frac = (i - prev) / (nxt - prev)
                s = s0 + (e0 - s0) * frac
                times[i] = (s, s)
    for pos, k in enumerate(idx):
        chars[k]["s"], chars[k]["e"] = times[pos]
    # 符号字符（《）跟随后一个字
    for k, ch in enumerate(chars):
        if ch.get("sym"):
            nk = next((j for j in range(k + 1, len(chars)) if "s" in chars[j]), None)
            ch["s"] = ch["e"] = chars[nk]["s"] if nk is not None else chars[k - 1]["e"]
    matched = sum(n for _, _, n in sm.get_matching_blocks())
    return matched / max(1, len(script))


def build_captions(chars, lines, meta: dict):
    out_lines = []
    for n, ln in enumerate(lines):
        cs = []
        for k in ln:
            ch = chars[k]
            tail = ch.get("tail", "")
            if k != ln[-1]:
                tail = tail.replace("？", "").replace("！", "")
                if ch["brk"] and ch["brk"] in "，、,；;：:":
                    tail += " "  # 行内的逗号/顿号显示成空格
            text = ch["c"] + tail
            cs.append({"t": text, "s": round(ch["s"] * 1000), "e": round(ch["e"] * 1000), "hl": ch["hl"]})
        out_lines.append({
            "i": n,
            "text": "".join(c["t"] for c in cs),
            "startMs": cs[0]["s"],
            "endMs": cs[-1]["e"],
            "sentenceEnd": bool(chars[ln[-1]]["sent"]),
            "paraEnd": bool(chars[ln[-1]].get("para")),
            "chars": cs,
        })
    keywords = []
    run = ""
    for ch in chars:
        if ch["hl"]:
            run += ch["c"]
            if ch["brk"]:  # 相邻关键词之间隔着标点，要分开
                keywords.append(run)
                run = ""
        elif run:
            keywords.append(run)
            run = ""
    if run:
        keywords.append(run)
    return {**meta, "keywords": list(dict.fromkeys(keywords)), "lines": out_lines}


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
