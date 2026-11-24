"""EP01v2 封面：纸纹底 + 手写大标题 + 成片里 D1 聊天框的截帧。

用法: python tools/wb_cover.py <chat_frame.png> <out.png>
chat_frame.png 取成片 0:03 那一帧（整框视图：涂黑名字、对方正在输入、22:47、气泡）。
"""
import os, sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 1080
INK = (42, 38, 34)
PENCIL = (124, 116, 106)
PAPER = (246, 241, 230)
FONT = os.path.join(ROOT, 'public/wb/fonts/wenkai-sub.ttf')

src, out = sys.argv[1], sys.argv[2]

# 纸纹
paper = Image.open(os.path.join(ROOT, 'public/wb/paper.jpg')).convert('RGB')
bg = paper.crop((0, 0, W, H)) if paper.width >= W and paper.height >= H else paper.resize((W, H))
# 轻微暗角（和片中一致）
yy, xx = H / 2, W / 2
mask = Image.new('L', (W, H), 0)
dm = ImageDraw.Draw(mask)
dm.ellipse([-W * 0.12, -H * 0.2, W * 1.12, H * 1.2], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(160))
shade = Image.blend(bg, Image.new('RGB', (W, H), (60, 40, 20)), 0.10)
bg = Image.composite(bg, shade, mask)

d = ImageDraw.Draw(bg)
f = lambda s: ImageFont.truetype(FONT, s)

# 右侧：D1 聊天框（成片截帧，裁掉周围纸面，乘法叠到纸上）
fr = Image.open(src).convert('RGB')
chat = fr.crop((418, 60, 1436, 890))
scale = 0.74
chat = chat.resize((int(chat.width * scale), int(chat.height * scale)), Image.LANCZOS)
cx, cy = 1920 - chat.width - 70, 150
# 用「变暗」混合，保留纸纹
region = bg.crop((cx, cy, cx + chat.width, cy + chat.height))
from PIL import ImageChops
bg.paste(ImageChops.darker(region, chat), (cx, cy))

# 聊天框下：空白横线 + 铅笔字（观众要补的那句）
ly = cy + chat.height + 95
d.text((cx + 20, ly - 78), '如果TA不回，就……', font=f(62), fill=PENCIL)
pts = [(cx + 10 + k * 12, ly + 6 + 3 * math.sin(k * 0.7)) for k in range(0, (chat.width - 20) // 12)]
d.line(pts, fill=INK, width=5, joint='curve')

# 左侧：手写大标题
x0 = 110
d.text((x0, 150), '「对方正在输入…」', font=f(92), fill=PENCIL)
d.text((x0 - 6, 270), '突然没了，', font=f(170), fill=INK)
d.text((x0, 500), '你脑子里', font=f(132), fill=INK)
d.text((x0, 660), '第一句是什么？', font=f(132), fill=INK)
# 「第一句」下面一笔波浪线
wx0 = x0 + 4
wy = 830
wave = [(wx0 + k * 10, wy + 9 * math.sin(k * 0.55)) for k in range(0, 40)]
d.line(wave, fill=INK, width=6, joint='curve')

# 角标
d.text((x0, 930), '隐藏条款 · 第 1 期', font=f(48), fill=PENCIL)

bg.save(out)
print(out, bg.size)
