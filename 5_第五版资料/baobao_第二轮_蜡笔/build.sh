#!/bin/sh
# 一条命令出片：画面 → 配乐 → 混音 → 两遍 loudnorm（-16 LUFS / TP -3.0）→ 封装
# `sh build.sh audio` 只重做声音，但要求 out/video.mp4 还在（整理时已删，先跑一次完整的）
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-D:/tmp/lemo-opuscar}; export LIB
PY="$LIB/.venv/Scripts/python.exe"
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-D:/desk/claudex/24/video-engine/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe} LEMO_ANGLE=default
[ "$1" = audio ] || { (cd "$LIB" && node core/render/events.mjs "$HERE" && node core/render/video.mjs "$HERE" --fps 24 --workers 5 --out "$HERE/out/video.mp4"); }
cd "$HERE"; "$PY" score.py; "$PY" mix.py
J=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-16:TP=-3.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i out/mix.wav -af "loudnorm=I=-16:TP=-3.0:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le out/mix_norm.wav
ffmpeg -hide_banner -loglevel error -y -i out/video.mp4 -i out/mix_norm.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf ${CRF:-27} -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart out/baobao_v2.mp4
ffmpeg -hide_banner -i out/baobao_v2.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3
