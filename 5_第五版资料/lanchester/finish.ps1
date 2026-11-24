$ErrorActionPreference='Stop'
$env:TEMP='D:\tmp\v4lanchester'
$env:TMP=$env:TEMP
Set-Location 'D:\desk\claudex\24\video-engine'
$taskPy='D:\conda\envs\d2l\python.exe'
if (Test-Path -LiteralPath 'out\v4\lanchester\final.mp4') {
 Move-Item -LiteralPath 'out\v4\lanchester\final.mp4' -Destination 'out\v4\lanchester\final_pre_tail_fix.mp4'
}
ffmpeg -hide_banner -loglevel error -y -i out\v4\lanchester\final_render2.mp4 -i public\v4\lanchester\mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart out\v4\lanchester\final.mp4
if ($LASTEXITCODE -ne 0) { throw 'remux failed' }
& $taskPy -X utf8 '..\5_第五版资料\lanchester\verify.py' > out\v4\lanchester\verify.log 2>&1
if ($LASTEXITCODE -ne 0) { throw 'verification failed' }
& $taskPy -X utf8 tools\v4_qa.py out\v4\lanchester\final.mp4 out\v4\lanchester\qa_final > out\v4\lanchester\qa_final.log 2>&1
& $taskPy -X utf8 tools\v4_stutter.py out\v4\lanchester\final.mp4 > out\v4\lanchester\stutter_final.txt 2>&1
ffmpeg -hide_banner -loglevel error -y -i out\v4\lanchester\final.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -b:v 640k -pass 1 -passlogfile D:\tmp\v4lanchester\phone_C -an -f null NUL
if ($LASTEXITCODE -ne 0) { throw 'phone pass1 failed' }
ffmpeg -hide_banner -loglevel error -y -i out\v4\lanchester\final.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -b:v 640k -pass 2 -passlogfile D:\tmp\v4lanchester\phone_C -c:a aac -b:a 96k -ar 48000 -movflags +faststart out\v4\lanchester\C_五打四_手机预览.mp4
if ($LASTEXITCODE -ne 0) { throw 'phone pass2 failed' }
Write-Output 'Finished remux, verify, QA, stutter and two-pass phone.'

