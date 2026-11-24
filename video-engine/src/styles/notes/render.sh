#!/usr/bin/env sh
# 「读书笔记」一次出齐：成片 mp4 + 封面 png（同一份代码、同一次运行，封面不会和视频第 0 帧对不上）
# 用法（在 video-engine 目录下）:
#   sh src/styles/notes/render.sh                 # demo → out/demo_Notes.mp4 + out/cover_Notes.png
#   sh src/styles/notes/render.sh EP01            # → out/EP01_Notes.mp4 + out/cover_EP01_Notes.png
# --color-space=bt709：输出 limited range（tv）+ 完整 bt709 标记。默认参数会输出 full range（yuvj420p），
# 不认 range 标记的转码器/播放器会把暖纸压成白、把墨色压死。
set -e
EP=${1:-demo}
MP4=out/${EP}_Notes.mp4
if [ "$EP" = "demo" ]; then PNG=out/cover_Notes.png; else PNG=out/cover_${EP}_Notes.png; fi
PROPS=out/_props_notes_${EP}.json
mkdir -p out
printf '{"episode":"%s"}' "$EP" > "$PROPS"

start=$(date +%s)
npx remotion render Notes "$MP4" --props="$PROPS" --color-space=bt709
mid=$(date +%s)
npx remotion still Notes "$PNG" --frame=0 --props="$PROPS"
end=$(date +%s)

echo "render: $((mid - start))s  cover: $((end - mid))s"
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,color_range,color_space,color_transfer,color_primaries -of compact "$MP4"
