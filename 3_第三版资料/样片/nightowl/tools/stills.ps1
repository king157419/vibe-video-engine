# Rebundle and render stills:  powershell -File <this dir>\stills.ps1 22.5 27 ...   (@0.5 = scale)
$env:TEMP='D:\tmp\nightowl'; $env:TMP='D:\tmp\nightowl'
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
Set-Location D:\desk\claudex\24\video-engine
node_modules\.bin\remotion.cmd bundle src\v3\nightowl\index.ts --out-dir D:\tmp\nightowl\bundle --log=error 2>&1 | Select-Object -Last 5
node (Join-Path $PSScriptRoot "stills.mjs") D:\tmp\nightowl\bundle out\v3\nightowl\stills @args 2>&1 | Select-Object -Last 40
