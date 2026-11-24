#!/bin/sh
# Mix VO + score (ducked under VO) + quiet shot sound onto the silent Remotion render, loudnorm to -15 LUFS.
# Usage: sh mix.sh brand|ad
set -e
V2="/d/desk/claudex/24/7_第七版资料/xmomo/v2"; P=/d/desk/claudex/24/video-engine/public/xmomo; R=/d/desk/claudex/24/video-engine/out; W=/d/tmp/xmix; mkdir -p $W
if [ "$1" = brand ]; then
  DUR=30; SCORE=$V2/brand30.wav; SILENT=$R/xm_brand_silent.mp4; OUT=$W/brand.mp4
  VO="b1:0.15 b2:3.2 b3:7.2 b4:12.15 b5:15.4 b6:18.3 b7:21.3 b8:24.3 b9:27.4"
  SHOTS="s1 s2 s3 s4 s5 s6 s7 s8"
else
  DUR=15; SCORE=$V2/ad15.wav; SILENT=$R/xm_ad_silent.mp4; OUT=$W/ad.mp4
  VO="a1:0.1 a2:3.1 a3:5.2 a4:9.1 a5:12.1"
  SHOTS="s1 a2 a3 s5"
fi
IN=""; FC=""; n=0; L=""
for v in $VO; do id=${v%%:*}; t=${v##*:}; ms=$(awk "BEGIN{print int($t*1000)}")
  IN="$IN -i $V2/vo/$id.wav"; FC="$FC[$n:a]aformat=channel_layouts=stereo,adelay=$ms|$ms[v$n];"; L="$L[v$n]"; n=$((n+1)); done
FC="$FC${L}amix=inputs=$n:normalize=0,apad,atrim=0:$DUR,asplit=2[vo][key];"
S=""; m=$n
for s in $SHOTS; do IN="$IN -i $P/$s.wav"; S="$S[$m:a]"; m=$((m+1)); done
FC="$FC${S}concat=n=$(echo $SHOTS | wc -w):v=0:a=1,aformat=channel_layouts=stereo,volume=0.18,apad,atrim=0:$DUR[sh];"
IN="$IN -i $SCORE"
FC="$FC[$m:a]aformat=channel_layouts=stereo,volume=0.55[mu];[mu][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[mud];"
FC="$FC[vo]volume=1.6[vo2];[vo2][mud][sh]amix=inputs=3:normalize=0,atrim=0:$DUR[mix]"
ffmpeg -v error -y $IN -filter_complex "$FC" -map "[mix]" -c:a pcm_s16le $W/pre_$1.wav
J=$(ffmpeg -hide_banner -i $W/pre_$1.wav -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -v error -y -i $SILENT -i $W/pre_$1.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 160k -t $DUR -movflags +faststart $OUT
echo built $OUT
