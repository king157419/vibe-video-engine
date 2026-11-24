#!/usr/bin/env bash
# 草稿/终版自检：印样（6×5 一张，每格左上角烧时间码）、静止检测、静音检测、响度、规格。
# 用法：bash qa.sh <视频> <输出目录> [fps=1]
set -euo pipefail
V="$1"; OUT="$2"; FPS="${3:-1}"
mkdir -p "$OUT"
rm -f "$OUT"/sheet_*.jpg
V_ABS="$(cd "$(dirname "$V")" && pwd)/$(basename "$V")"
cp -f C:/Windows/Fonts/arial.ttf "$OUT/_f.ttf"
VF="fps=${FPS},scale=320:-1,drawtext=fontfile=_f.ttf:text='%{pts\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=6x5:padding=4:color=white"
( cd "$OUT" && ffmpeg -v error -y -i "$V_ABS" -vf "$VF" "sheet_%02d.jpg" )
rm -f "$OUT/_f.ttf"
ls "$OUT"/sheet_*.jpg | wc -l
echo "== freezedetect (n=0.003, d=6) =="
ffmpeg -v info -i "$V_ABS" -vf "freezedetect=n=0.003:d=6" -map 0:v -f null - 2>&1 | grep -E "freeze_(start|duration|end)" || echo "no freeze >= 6s"
echo "== silencedetect (-50 dB, 1.0 s) =="
ffmpeg -v info -i "$V_ABS" -af "silencedetect=n=-50dB:d=1.0" -map 0:a -f null - 2>&1 | grep -E "silence_(start|end)" || true
echo "== loudness =="
ffmpeg -v info -i "$V_ABS" -af "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=summary" -map 0:a -f null - 2>&1 | grep -E "Input Integrated|Input True Peak|Input LRA" || true
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 "$V_ABS"
