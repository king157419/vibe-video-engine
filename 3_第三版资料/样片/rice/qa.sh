#!/usr/bin/env bash
# 样片二《煮不死的种子》成片自检：印样、静止检测、静音窗、响度。
# 用法（Git Bash）：bash qa.sh <视频> <印样输出目录> <每几秒一帧> [前缀]
#   草稿：bash qa.sh ../../../video-engine/out/v3/rice/draft.mp4 D:/tmp/rice/qa_draft 1 draft
#   终版：bash qa.sh ../../../video-engine/out/v3/rice/final.mp4 ./印样 2 sheet
set -u
V="$1"; OUT="$2"; STEP="$3"; PRE="${4:-sheet}"
mkdir -p "$OUT"
echo "== 规格"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size,bit_rate -of default=nw=1 "$V"
echo "== 印样（每 ${STEP} 秒一帧，6×5 拼版）"
ffmpeg -v error -y -i "$V" -vf "fps=1/${STEP},scale=480:-1,tile=6x5:padding=4:color=black" -q:v 3 "$OUT/${PRE}_%02d.jpg"
ls "$OUT" | grep "^${PRE}_" | wc -l
echo "== 静止检测（freezedetect n=0.003 d=6）"
ffmpeg -hide_banner -nostats -i "$V" -vf "freezedetect=n=0.003:d=6" -map 0:v -f null - 2>&1 | grep -E "freeze_(start|end|duration)" || echo "没有超过 6 秒的静止段"
echo "== 静音窗（silencedetect −70 dB，≥0.8 秒）"
ffmpeg -hide_banner -nostats -i "$V" -af "silencedetect=n=-70dB:d=0.8" -map 0:a -f null - 2>&1 | grep -E "silence_(start|end)"
echo "== 响度（ebur128）"
ffmpeg -hide_banner -nostats -i "$V" -af "ebur128=peak=true" -map 0:a -f null - 2>&1 | grep -A20 "Summary" | grep -E "I:|LRA:|Peak:"
