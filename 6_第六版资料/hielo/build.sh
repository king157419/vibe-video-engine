#!/bin/sh
# 《多年以后》一条命令出片：时间轴 → 配乐 → 两遍 loudnorm → 类型检查 → 全尺寸渲染 → 用 mix.wav 封装
# `sh build.sh audio` 只重做声音（要求 out/v4/hielo/final_render.mp4 还在）
set -e
DOC=$(cd "$(dirname "$0")" && pwd)
VE=D:/desk/claudex/24/video-engine
PY=D:/conda/envs/d2l/python.exe
LPY=D:/tmp/lemo-opuscar/.venv/Scripts/python.exe
export TEMP=D:/tmp/v4hielo TMP=D:/tmp/v4hielo PYTHONIOENCODING=utf-8; mkdir -p $TEMP
"$PY" "$DOC/tools/timeline.py" | tail -1
"$LPY" "$DOC/score.py"
cd "$VE/public/v4/hielo"
J=$(ffmpeg -hide_banner -i music.wav -af loudnorm=I=-16:TP=-2.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i music.wav -af "loudnorm=I=-16:TP=-2.0:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le mix.wav
cd "$VE"
if [ "$1" != audio ]; then
  node node_modules/typescript/bin/tsc --noEmit -p .
  node_modules/.bin/remotion render src/v4/hielo/index.ts V4Hielo out/v4/hielo/final_render.mp4 --concurrency=5 --log=error
fi
ffmpeg -hide_banner -loglevel error -y -i out/v4/hielo/final_render.mp4 -i public/v4/hielo/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/v4/hielo/final.mp4
ffmpeg -hide_banner -nostats -i out/v4/hielo/final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3
