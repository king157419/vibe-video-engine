#!/bin/sh
# One command: picture, score, two-pass loudnorm (-15 LUFS / TP -2.5), mux.  `sh build.sh audio` redoes the sound only.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-D:/tmp/lemo-opuscar}; export LIB
PY="$LIB/.venv/Scripts/python.exe"
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-D:/desk/claudex/24/video-engine/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe} LEMO_ANGLE=default TEMP=D:/tmp TMP=D:/tmp PYTHONIOENCODING=utf-8
[ "$1" = audio ] || (cd "$LIB" && node core/render/video.mjs "$HERE" --fps 30 --workers 4 --out "$HERE/out/video.mp4")
cd "$HERE"; "$PY" score.py
J=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-15:TP=-2.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i out/mix.wav -af "loudnorm=I=-15:TP=-2.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a pcm_s16le out/mix_norm.wav
ffmpeg -hide_banner -loglevel error -y -i out/video.mp4 -i out/mix_norm.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 256k -movflags +faststart -t 36 out/xmomo_30s.mp4
ffmpeg -hide_banner -nostats -i out/xmomo_30s.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3
