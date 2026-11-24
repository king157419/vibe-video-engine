#!/bin/bash
# 自检：印样 + 静止检测 + 响度。用法：bash qa.sh <视频> <印样目录> <每几秒一帧> [缩略图宽]
# 例：bash qa.sh out/v3/nightowl/draft.mp4 out/v3/nightowl/qa_draft 1 320
set -e
v=$1; out=$2; step=${3:-1}; w=${4:-320}
mkdir -p "$out"
ffmpeg -hide_banner -loglevel error -y -i "$v" -vf "fps=1/$step,scale=$w:-1,tile=6x5:padding=4:color=white" "$out/sheet_%02d.jpg"
echo "== 印样：$(ls "$out"/sheet_*.jpg | wc -l) 张"
echo "== freezedetect（n=0.003, d=6）"
ffmpeg -hide_banner -nostats -i "$v" -vf "freezedetect=n=0.003:d=6" -map 0:v -f null - 2>&1 | grep -E "freeze_(start|end|duration)" || echo "（无超过 6 秒的静止）"
echo "== 响度"
ffmpeg -hide_banner -nostats -i "$v" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:|LRA:)" | tail -3
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$v"
