r"""《沙漏与潮水》封面（1920×1080）：从成片的两帧拼出来，加大号标题。

  - 上：第 6 秒那一帧的夜空（月亮、星星、左上纸签“第二天 凌晨 03:00”）——熬通宵；
  - 中：第 12 秒押注定格时的三张便签 A / B / C（三条困意曲线）——片子开头问的那个问题，不给答案；
  - 下：霞鹜文楷大字片名“沙漏与潮水”+ 右侧问句“熬通宵 / 几点最难熬？”（“最难熬”用困的淡红）。
    片名约 190 px、问句约 112 px：缩到手机缩略图（约 1/6）时，片名约 32 px、问句约 19 px，仍能读。

先用 Remotion 抽两张无损静帧（见自检记录“重做的命令”），再运行：
  D:\conda\miniconda3\python.exe 3_第三版资料\样片\nightowl\tools\make_cover.py <第6秒.png> <第12秒.png> <输出.png>
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

VE = Path(__file__).resolve().parents[4] / "video-engine"
FONT = VE / "art-src" / "fonts" / "LXGWWenKai-Medium.ttf"
PAPER = (246, 241, 231)
INK = (43, 43, 43)
DROWSY = (200, 85, 61)
SLEEP_TEXT = (111, 106, 101)


def main() -> None:
    night_p, bet_p, out_p = sys.argv[1], sys.argv[2], sys.argv[3]
    night = Image.open(night_p).convert("RGB")
    bet = Image.open(bet_p).convert("RGB")
    assert night.size == (1920, 1080) and bet.size == (1920, 1080)
    cv = Image.new("RGB", (1920, 1080), PAPER)
    # 纸纹：直接借押注帧里没东西的一块纸（x 0–1920, y 760–940 那条），平铺到整张底上，和成片同一张纸
    strip = bet.crop((0, 900, 1920, 960))
    for y in range(0, 1080, 60):
        cv.paste(strip, (0, y))
    # 上：夜空带（含水彩下沿、月亮、星星、纸签）
    sky = night.crop((0, 0, 1920, 246))
    cv.paste(sky, (0, 0))
    # 中：三张便签（押注定格那一帧），放大一点、居中
    cards = bet.crop((180, 326, 1740, 724))  # 三张便签连同胶带
    k = 0.93
    cards = cards.resize((round(cards.width * k), round(cards.height * k)), Image.LANCZOS)
    # 便签之间露出来的书桌、窗、钟（帧里在便签后面）用纸色盖掉：只要便签本身
    mask = Image.new("L", cards.size, 0)
    md = ImageDraw.Draw(mask)
    src = bet.crop((180, 326, 1740, 724)).resize(cards.size, Image.LANCZOS)
    px = src.load()
    w, h = cards.size
    # 便签底色 #fbf7ee 及其上的墨线、胶带：按三张便签的矩形取（原帧坐标见 cards.tsx 的 BET 位姿，宽 470、高 360，略有倾斜）
    import math

    for cx, cy, tilt in ((430, 530, -2), (960, 530, 1), (1490, 530, 2.5)):
        a = math.radians(tilt)

        def poly(corners):
            out = []
            for dx, dy in corners:
                x = cx + dx * math.cos(a) - dy * math.sin(a)
                y = cy + dx * math.sin(a) + dy * math.cos(a)
                out.append(((x - 180) * k, (y - 326) * k))
            return out

        # 便签本身（宽 470、高 360，描边约 2.4 px）+ 顶上的胶带（宽 0.28×470、高 24）
        md.polygon(poly(((-236, -181), (236, -181), (236, 180), (-236, 180))), fill=255)
        md.polygon(poly(((-62, -191), (62, -191), (62, -178), (-62, -178))), fill=255)
    # 胶带是斜的，两端会露出一点后面的橙色窗户：凡是偏橙的像素一律不要（这一帧的便签上没有橙色）
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g_, bl = px[x, y]
            if mp[x, y] and r > 150 and r - bl > 60:
                mp[x, y] = 0
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    ox, oy = (1920 - w) // 2, 262
    shadow = Image.new("L", cards.size, 0)
    shadow.paste(mask.point(lambda v: int(v * 0.10)), (0, 0))
    cv.paste((0, 0, 0), (ox + 7, oy + 9), shadow.filter(ImageFilter.GaussianBlur(4)))
    cv.paste(cards, (ox, oy), mask)
    d = ImageDraw.Draw(cv)
    # 下：片名 + 问句
    f_title = ImageFont.truetype(str(FONT), 190)
    f_q = ImageFont.truetype(str(FONT), 112)
    f_small = ImageFont.truetype(str(FONT), 54)
    d.text((70, 1035), "沙漏与潮水", font=f_title, fill=INK, anchor="ls", stroke_width=3, stroke_fill=INK)
    qx = 1110
    d.text((qx, 880), "熬通宵，", font=f_q, fill=INK, anchor="ls", stroke_width=2, stroke_fill=INK)
    x = qx
    for s, c in (("几点", INK), ("最难熬", DROWSY), ("？", INK)):
        d.text((x, 1018), s, font=f_q, fill=c, anchor="ls", stroke_width=2, stroke_fill=c)
        x += d.textlength(s, font=f_q)
    # 便签下方一行小字：选的是“困意曲线”的形状
    d.text((960, 722), "困意曲线是哪条？", font=f_small, fill=SLEEP_TEXT, anchor="ms")
    cv.save(out_p, optimize=True)
    print(out_p, cv.size)


if __name__ == "__main__":
    main()
