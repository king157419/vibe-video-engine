"""一条命令出片：录音清理 → 对齐字幕 → 渲染视频 + 封面。

用法（在 video-engine 目录下）:
  python tools/make.py EP01 --style Radio          # 用你的录音 public/episodes/EP01/voice.*
  python tools/make.py EP01 --style Radio --tts    # 没录音时用占位 AI 配音预览
  python tools/make.py EP01 --style all            # 四种样式都出
输出: ../成片/1_第一版_读书号竖屏/EP01_<样式>.mp4 和 EP01_<样式>_封面.png
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENGINE = HERE.parent
OUT = ENGINE.parent / "成片" / "1_第一版_读书号竖屏"
STYLES = ["Radio", "Notes", "Illustration", "Cards"]
PY = sys.executable
NPX = shutil.which("npx.cmd") or shutil.which("npx") or "npx"


def run(cmd, **kw):
    print("»", " ".join(str(c) for c in cmd))
    subprocess.run(cmd, check=True, cwd=ENGINE, **kw)


def has_voice(ep: Path) -> bool:
    return any(ep.glob("voice.*"))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--style", default="Radio", help="Radio / Notes / Illustration / Cards / all")
    ap.add_argument("--tts", action="store_true", help="用占位 AI 配音（仅预览）")
    ap.add_argument("--skip-audio", action="store_true", help="captions.json 已就绪，只渲染")
    ap.add_argument("--keep-pauses", action="store_true")
    args = ap.parse_args()

    ep = ENGINE / "public" / "episodes" / args.episode
    if not (ep / "script.txt").exists():
        raise SystemExit(f"缺少 {ep / 'script.txt'}")
    OUT.mkdir(exist_ok=True)
    t0 = time.time()

    if not args.skip_audio:
        if args.tts or not has_voice(ep):
            if not args.tts:
                print("没找到 voice.* 录音，先用占位 AI 配音生成预览")
            run([PY, HERE / "tts.py", ep])
        else:
            clean = [PY, HERE / "clean_audio.py", ep] + (["--keep-pauses"] if args.keep_pauses else [])
            run(clean)
            run([PY, HERE / "transcribe.py", ep])

    props = ENGINE / "out" / f"_props_{args.episode}.json"
    props.parent.mkdir(exist_ok=True)
    props.write_text(json.dumps({"episode": args.episode}), encoding="utf-8")
    styles = STYLES if args.style == "all" else [args.style]
    for s in styles:
        mp4 = OUT / f"{args.episode}_{s}.mp4"
        png = OUT / f"{args.episode}_{s}_封面.png"
        run([NPX, "remotion", "render", s, str(mp4), f"--props={props}"])
        run([NPX, "remotion", "still", s, str(png), "--frame=0", f"--props={props}"])
    print(f"完成，用时 {time.time() - t0:.0f}s → {OUT}")


if __name__ == "__main__":
    main()
