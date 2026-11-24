$ErrorActionPreference = 'Stop'
$env:TEMP='D:\tmp\v4baobao'
$env:TMP=$env:TEMP
$final='out/v4/baobao/final.mp4'
$preview='out/v4/baobao/A_宝宝_手机预览.mp4'
$pass='D:/tmp/v4baobao/previewA'
ffmpeg -v error -threads 2 -filter_threads 2 -y -ss 18 -i $final -frames:v 1 'out/v4/baobao/A_宝宝_封面.png'
if($LASTEXITCODE -ne 0){throw 'cover failed'}
ffmpeg -v error -y -i $final -vf scale=1280:720 -filter_threads 2 -c:v libx264 -threads 2 -preset slow -b:v 640k -pass 1 -passlogfile $pass -an -f null NUL
if($LASTEXITCODE -ne 0){throw 'preview pass1 failed'}
ffmpeg -v error -y -i $final -vf scale=1280:720 -filter_threads 2 -c:v libx264 -threads 2 -preset slow -b:v 640k -pass 2 -passlogfile $pass -c:a aac -b:a 96k -ar 48000 -movflags +faststart $preview
if($LASTEXITCODE -ne 0){throw 'preview pass2 failed'}
ffprobe -v error -show_streams -show_format -of json $preview | Set-Content -Encoding utf8 'out/v4/baobao/ffprobe_preview.json'
Get-FileHash -Algorithm SHA256 $final,$preview,'out/v4/baobao/A_宝宝_封面.png' | ConvertTo-Json | Set-Content -Encoding utf8 'out/v4/baobao/delivery_hashes.json'
Write-Output 'Cover and two-pass 1280x720 640k preview complete.'
