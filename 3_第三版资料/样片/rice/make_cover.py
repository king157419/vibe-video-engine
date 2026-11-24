"""样片二《煮不死的种子》封面：1920×1080。
上半部分是全片论点帧（80.4 秒：回锅后左碗细菌死光、毒素不变；右碗全是芽孢、毒素 0），
下面一条深色带放大号片名和一句问题，手机缩略图也能读。

用法（在 video-engine 下，先用 tools/stills.mjs 出 80.4 秒的静帧到 D:/tmp/rice/cover_src/）：
  D:/conda/miniconda3/python.exe -P ../3_第三版资料/样片/rice/make_cover.py   （-P：同目录有 numbers.py，会遮住标准库）
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
SRC = Path(r'D:/tmp/rice/cover_src/f_2412.png')
OUT = ROOT / '成片' / '3_第三版_vibe样片' / '样片2_煮不死的种子_封面.png'
SANS = ROOT / 'video-engine' / 'public' / 'fonts' / 'NotoSansSC-VF.ttf'

BENCH = (217, 220, 216)
INK = (35, 39, 43)
PAPER = (251, 248, 241)
TOXIN_LIGHT = (255, 120, 172)  # 品红（毒素色）在深底上提亮一点，保证对比


def font(size: int, weight: int) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(SANS), size)
    f.set_variation_by_axes([weight])
    return f


def main():
    W, H = 1920, 1080
    band_y = 700
    cover = Image.new('RGB', (W, H), BENCH)
    frame = Image.open(SRC).convert('RGB')
    # 两视野之间上方的 B、C 押注页签和封面无关，用台面色盖掉（“示意”签保留）
    ImageDraw.Draw(frame).rectangle([838, 170, 1082, 310], fill=BENCH)
    # 取样本卡到读数行（y 98–938），不要顶部条和字幕带
    crop = frame.crop((40, 98, 1880, 938))
    k = (band_y - 10) / crop.height
    crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.LANCZOS)
    cover.paste(crop, ((W - crop.width) // 2, 6))

    d = ImageDraw.Draw(cover)
    d.rectangle([0, band_y, W, H], fill=INK)
    d.rectangle([0, band_y, W, band_y + 8], fill=(208, 65, 126))

    title = '煮不死的种子'
    ft = font(170, 900)
    tb = d.textbbox((0, 0), title, font=ft)
    ty = band_y + (H - band_y - (tb[3] - tb[1])) // 2 - tb[1] + 4
    d.text((56, ty), title, font=ft, fill=PAPER)
    x2 = 56 + (tb[2] - tb[0]) + 70

    f1 = font(66, 700)
    l1 = '桌上 6 小时 vs 冰箱一夜'
    l2 = '都炒透了，哪碗更危险？'
    b1 = d.textbbox((0, 0), l1, font=f1)
    b2 = d.textbbox((0, 0), l2, font=f1)
    gap = 34
    block_h = (b1[3] - b1[1]) + gap + (b2[3] - b2[1])
    y1 = band_y + (H - band_y - block_h) // 2 - b1[1] + 4
    d.text((x2, y1), l1, font=f1, fill=PAPER)
    d.text((x2, y1 + (b1[3] - b1[1]) + gap + b1[1] - b2[1]), l2, font=f1, fill=TOXIN_LIGHT)
    right = x2 + max(b1[2] - b1[0], b2[2] - b2[0])
    assert right <= W - 30, f'右侧文字出框：{right}'
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cover.save(OUT, optimize=True)
    print(OUT, cover.size, 'right edge', right)
    # 手机缩略图预览（宽 360）
    cover.resize((360, 203), Image.LANCZOS).save(r'D:/tmp/rice/cover_thumb.png')


if __name__ == '__main__':
    main()
