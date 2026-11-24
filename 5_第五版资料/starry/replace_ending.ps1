# 更新 timeline.py 内 meta.auction 的 label/value/status/date 后运行。
# 全片242秒：仅重渲最后12秒，前230秒重用。最后2秒仍只有署名。
# 所有中间件在D盘。先核实成交币种、是否含费、是否成交，再填写字段。
$ErrorActionPreference='Stop'
$ve='D:\desk\claudex\24\video-engine'
$doc='D:\desk\claudex\24\5_第五版资料\starry'
$env:TEMP='D:\tmp\v4starry'
$env:TMP=$env:TEMP
Set-Location $ve
& 'D:\conda\envs\d2l\python.exe' -X utf8 "$doc\timeline.py"
& node_modules\.bin\remotion.cmd render src\v4\starry\index.ts V4Starry out\v4\starry\ending_new.mp4 --frames=6900-7259 --concurrency=5 --muted
if($LASTEXITCODE -ne 0){throw 'ending render failed'}
# 前230秒不重渲画面；为保证准确切在230秒，这一步重新编码头段，原片保留。
& ffmpeg -y -i out\v4\starry\final.mp4 -t 230 -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -colorspace bt709 out\v4\starry\head_230.mp4
@("file '$($ve.Replace('\','/'))/out/v4/starry/head_230.mp4'","file '$($ve.Replace('\','/'))/out/v4/starry/ending_new.mp4'") | Set-Content -Encoding ascii 'D:\tmp\v4starry\concat.txt'
& ffmpeg -y -f concat -safe 0 -i 'D:\tmp\v4starry\concat.txt' -i public\v4\starry\mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart out\v4\starry\final_updated.mp4
# Do not use -shortest. Check 7260 frames, 242 seconds and last2 seconds before replacing delivery.
& ffprobe -v error -show_entries stream=width,height,nb_frames -show_entries format=duration -of compact out\v4\starry\final_updated.mp4
