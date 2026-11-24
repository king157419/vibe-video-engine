#!/bin/sh
# xmomo LibTV 30s EN edit. Usage: sh build.sh <out.mp4>
set -e; OUT="$1"
B="/d/desk/claudex/24/7_第七版资料/xmomo/libtv"; O="$B/out"; T="$B/edit/txt"; W=/d/tmp/xedit; mkdir -p $W
# shot: file start dur speed crop
seg() { # $1 idx $2 file $3 ss $4 srcdur $5 speed $6 vf-prefix
  ffmpeg -v error -y -ss $3 -t $4 -i "$O/$2.mp4" -filter_complex \
  "[0:v]${6}setpts=PTS/$5,scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[v];[0:a]atempo=$5,aresample=48000,aformat=channel_layouts=stereo[a]" \
  -map "[v]" -map "[a]" -t $(awk "BEGIN{print $4/$5}") -c:v libx264 -crf 14 -preset fast -c:a pcm_s16le $W/s$1.mkv
}
seg 1 S1 0.0 4.8 1.6 ""
seg 2 S2 0.5 4.0 1 ""
seg 3 S3 0.0 5.0 1 ""
seg 4 S4 1.0 3.0 1 "crop=853:480:0:240,"
seg 5 S5 0.5 3.0 1 ""
seg 6 S6 0.0 3.0 1 ""
seg 7 S7 ${S7SS:-1.0} 3.0 1 ""
seg 8 S8 0.8 3.0 1 ""
ffmpeg -v error -y -loop 1 -t 3 -i "$T/endcard.png" -f lavfi -t 3 -i anullsrc=r=48000:cl=stereo \
  -vf "scale=1920:1080,fps=30,format=yuv420p,fade=in:st=0:d=0.25" -c:v libx264 -crf 14 -preset fast -c:a pcm_s16le -shortest $W/s9.mkv
printf "file 's%d.mkv'\n" 1 2 3 4 5 6 7 8 9 > $W/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $W/list.txt -c copy $W/base.mkv
# titles: idx in out
set -- 1 0.3 3.0  2 3.2 7.0  3 7.3 9.5  4 9.7 12.0  5 12.2 15.0  6 15.2 18.0  7 18.2 21.0  8 21.2 24.0  9 24.3 27.0
IN=""; FC=""; prev="0:v"; i=1
while [ $# -gt 0 ]; do
  n=$1; a=$2; b=$3; shift 3; d=$(awk "BEGIN{print $b-$a}")
  IN="$IN -loop 1 -t $d -i $T/t$n.png"
  FC="$FC[$i:v]format=rgba,fade=in:st=0:d=0.3:alpha=1,fade=out:st=$(awk "BEGIN{print $d-0.3}"):d=0.3:alpha=1,setpts=PTS-STARTPTS+$a/TB[t$i];[$prev][t$i]overlay=0:0:eof_action=pass[o$i];"
  prev="o$i"; i=$((i+1))
done
ffmpeg -v error -y -i $W/base.mkv $IN -i "$O/score30.wav" -filter_complex \
  "${FC}[0:a]volume=${SHOTVOL:-0.35}[sa];[$i:a]volume=1.0[mu];[sa][mu]amix=inputs=2:normalize=0:duration=longest,atrim=0:30[mix]" \
  -map "[$prev]" -map "[mix]" -t 30 -c:v libx264 -crf 16 -preset medium -c:a pcm_s16le $W/pre.mkv
# two-pass loudnorm to -15 LUFS
J=$(ffmpeg -hide_banner -i $W/pre.mkv -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -v error -y -i $W/pre.mkv -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:v copy -c:a aac -b:a 256k -movflags +faststart "$OUT"
echo built "$OUT"
