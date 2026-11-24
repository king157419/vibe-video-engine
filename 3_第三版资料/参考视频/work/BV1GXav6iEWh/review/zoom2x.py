import os, subprocess
from PIL import Image

V = r'D:\desk\claudex\24\3_第三版资料\参考视频\BV1GXav6iEWh.mp4'
OUT = r'D:\desk\claudex\24\3_第三版资料\参考视频\work\BV1GXav6iEWh\review'
pts = [15, 27, 71, 84, 109, 141, 156, 192, 207, 241, 270, 291, 45, 65, 91, 104, 161, 165]
env = dict(os.environ, TEMP=r'D:\tmp', TMP=r'D:\tmp')
for s in pts:
    png = os.path.join(OUT, f'full_{s:03d}.png')
    if not os.path.exists(png):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s+0.5:.2f}', '-i', V,
                        '-frames:v', '1', png], check=True, env=env)
    im = Image.open(png).convert('RGB')
    c = im.crop((100, 395, 752, 458))
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(os.path.join(OUT, f'sub2x_{s:03d}.png'))
print('ok')
