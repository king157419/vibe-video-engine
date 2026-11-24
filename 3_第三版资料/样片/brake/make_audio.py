"""样片一《最后几米》：配乐合成 + 混音（可重复运行）。

用法（在任意目录）：
    D:\\desk\\claudex\\24\\.venv\\Scripts\\python.exe make_audio.py

做三件事：
1. 从 captions.json 里按“段落第一句”的开始时间算出配乐分段点（--marks），
   时长 = 片长（配音时长 + 2.6 秒片尾，向上取整到帧），调用 tools/music_synth.py 生成 music.wav。
2. 按分镜表 §2.3 给配乐挖静音：押注定格→揭晓后 1.5 秒；第二次“42码”之后到下一段开始。
   定格时刻 = “刚好停住”开始 + 0.13 秒 + 60 码刹到撞线的物理时间 ÷ 0.6（和画面代码 timeline.ts 同一个公式）。
3. 混音：配乐响度比旁白低 20 LU；两遍 loudnorm（线性）把成片做到 −15 LUFS、真峰值 ≤ −1.5 dBTP。
输出 public/v3/brake/music.wav、mix.wav，并打印测量值。
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]           # D:\desk\claudex\24
ENGINE = ROOT / "video-engine"
PUB = ENGINE / "public" / "v3" / "brake"
PY = ROOT / ".venv" / "Scripts" / "python.exe"
FPS = 30
TAIL_MS = 2600
SLOW = 0.6
GAP_WHITE_TO_YELLOW = 0.13
MUSIC_BELOW_VOICE_LU = 20.0
# 审片 P2（2026-10-07）：原配乐 85% 的能量在 150 Hz 以下（73/147 Hz 的持续低音），耳机里接近一声低频嗡。
# 用户最反感持续的声音 → 混音前用两级高通（450 Hz，合计 24 dB/倍频程）切掉低音持续音和和弦铺底的基音（实测 180 Hz 时铺底仍占 77%），
# 拨弦密度从 0.25 提到 0.4，让配乐听起来是“稀疏的音符起落”，不是一层底噪。
MUSIC_HP = "highpass=f=450:poles=2,highpass=f=450:poles=2"
PLUCK_DENSITY = "0.4"


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)


def line_start(cap: dict, prefix: str, after: float = 0.0) -> float:
    for ln in cap["lines"]:
        if ln["startMs"] / 1000 >= after - 1e-6 and ln["text"].replace(" ", "").startswith(prefix):
            return ln["startMs"] / 1000
    raise SystemExit(f"找不到以“{prefix}”开头的字幕行")


def line_end(cap: dict, prefix: str, after: float = 0.0) -> float:
    for ln in cap["lines"]:
        if ln["startMs"] / 1000 >= after - 1e-6 and ln["text"].replace(" ", "").startswith(prefix):
            return ln["endMs"] / 1000
    raise SystemExit(f"找不到以“{prefix}”开头的字幕行")


def loudness(path: Path, pre: str = "") -> dict:
    """ffmpeg loudnorm 第一遍测量，返回 json。pre：测量前先过的滤镜。"""
    af = (pre + "," if pre else "") + "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json"
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", af, "-f", "null", "-"]
    out = run(cmd).stderr
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", out, re.S)
    return json.loads(m.group(0))


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    cap = json.loads((PUB / "captions.json").read_text(encoding="utf-8"))
    num = json.loads((PUB / "numbers.json").read_text(encoding="utf-8"))
    frames = -(-((cap["durationMs"] + TAIL_MS) * FPS) // 1000)
    dur = frames / FPS

    # 1) 分段点
    marks = [0.0,
             line_start(cap, "研究里"),
             line_start(cap, "拿50码"),
             line_start(cap, "只改一个地方"),
             line_start(cap, "再看60码"),
             line_start(cap, "把每个点"),
             line_start(cap, "下雨了"),
             line_start(cap, "再换个"),
             line_start(cap, "看手机"),
             line_end(cap, "结冰打滑")]
    marks_s = ",".join(f"{m:.2f}" for m in marks)
    env = dict(os.environ)
    run([str(PY), str(ENGINE / "tools" / "music_synth.py"), str(PUB / "music.wav"), "--dur", f"{dur:.3f}",
         "--key", "D", "--mode", "minor", "--mood", "calm", "--bpm", "72", "--density", PLUCK_DENSITY,
         "--marks", marks_s], env=env)
    print(f"片长 {frames} 帧 = {dur:.3f} 秒；marks = {marks_s}")

    # 2) 静音窗
    t_white = line_start(cap, "刚好停住") + GAP_WHITE_TO_YELLOW
    t_freeze = t_white + num["main"]["60"]["t_brake"] / SLOW
    t_resume1 = line_start(cap, "研究里")
    t_mute2a = line_end(cap, "撞上去还有42码")
    t_resume2 = line_start(cap, "把每个点")
    print(f"静音 1：{t_freeze:.2f}–{t_resume1:.2f}；静音 2：{t_mute2a:.2f}–{t_resume2:.2f}")

    def win(a: float, b: float, fo: float, fi: float) -> str:
        # 在 [a-fo, a] 线性降到 0，[a, b] 保持 0，[b, b+fi] 线性回到 1
        return (f"if(lt(t,{a - fo:.3f}),1,if(lt(t,{a:.3f}),({a:.3f}-t)/{fo:.3f},"
                f"if(lt(t,{b:.3f}),0,if(lt(t,{b + fi:.3f}),(t-{b:.3f})/{fi:.3f},1))))")

    gate = f"({win(t_freeze, t_resume1, 0.25, 0.8)})*({win(t_mute2a, t_resume2, 0.3, 0.6)})"

    # 3) 响度：旁白 vs 配乐
    lv = loudness(PUB / "audio.mp3")
    lm = loudness(PUB / "music.wav", MUSIC_HP)
    gain_db = (float(lv["input_i"]) - MUSIC_BELOW_VOICE_LU) - float(lm["input_i"])
    print(f"旁白 {lv['input_i']} LUFS；配乐 {lm['input_i']} LUFS → 配乐增益 {gain_db:+.2f} dB")

    pre = Path(os.environ.get("TEMP", str(PUB))) / "brake_premix.wav"
    fc = (f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur={dur:.3f}[v];"
          f"[1:a]aresample=48000,{MUSIC_HP},volume={gain_db:.3f}dB,volume='{gate}':eval=frame[m];"
          f"[v][m]amix=inputs=2:duration=longest:normalize=0,atrim=0:{dur:.3f}[o]")
    run(["ffmpeg", "-y", "-hide_banner", "-i", str(PUB / "audio.mp3"), "-i", str(PUB / "music.wav"),
         "-filter_complex", fc, "-map", "[o]", "-c:a", "pcm_s24le", str(pre)])
    # 先整体抬到 −15 LUFS，再用限幅器压住偶发峰值（旁白峰值比平均高很多，单靠 loudnorm 线性模式做不到 −15）。
    # 限幅会让响度略降，所以按测量结果再补一次增益。
    m1 = loudness(pre)
    gain = -15.0 - float(m1["input_i"])
    for _ in range(3):
        af = f"volume={gain:.3f}dB,alimiter=limit=0.78:attack=2:release=60:level=disabled,aresample=48000"
        run(["ffmpeg", "-y", "-hide_banner", "-i", str(pre), "-af", af,
             "-c:a", "pcm_s16le", "-ar", "48000", str(PUB / "mix.wav")])
        m2 = loudness(PUB / "mix.wav")
        err = -15.0 - float(m2["input_i"])
        if abs(err) < 0.1:
            break
        gain += err
    pre.unlink(missing_ok=True)
    print(f"mix.wav：{m2['input_i']} LUFS，真峰值 {m2['input_tp']} dBTP，LRA {m2['input_lra']}")
    # 单独测配乐在混音里的实际电平（同样的增益和静音窗）
    mm = loudness(PUB / "music.wav", f"{MUSIC_HP},volume={gain_db:.3f}dB")
    print(f"配乐（混音增益后）{mm['input_i']} LUFS，比旁白低 {float(lv['input_i']) - float(mm['input_i']):.1f} LU")


if __name__ == "__main__":
    main()
