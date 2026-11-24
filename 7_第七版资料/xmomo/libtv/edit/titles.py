# Render on-screen copy PNGs (1920x1080, transparent) and the end card.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
F = r"D:\desk\claudex\24\7_第七版资料\xmomo\fonts\NotoSerifSC-VF.ttf"
OUT = os.path.join(os.path.dirname(__file__), "txt")
IV = (244, 236, 223, 255); GD = (242, 194, 122, 255)
W, H = 1920, 1080
def font(sz, wt=300):
    f = ImageFont.truetype(F, sz)
    try: f.set_variation_by_axes([wt])
    except Exception as e: print("axis", e)
    return f
def spaced(d, xy, s, f, fill, track=0, anchor="ms"):
    if not track: d.text(xy, s, font=f, fill=fill, anchor=anchor); return
    w = sum(d.textlength(c, font=f) for c in s) + track * (len(s) - 1)
    x = xy[0] - w / 2
    for c in s:
        d.text((x, xy[1]), c, font=f, fill=fill, anchor="ls"); x += d.textlength(c, font=f) + track
def card(name, parts, y=900):
    """parts: list of (text, font, colour, track, dy)"""
    txt = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(txt)
    for s, f, c, tr, dy in parts: spaced(d, (W / 2, y + dy), s, f, c, tr)
    a = txt.split()[3]; sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh.putalpha(a.filter(ImageFilter.GaussianBlur(8)).point(lambda v: min(255, int(v * 1.1))))
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gp = grad.load()
    top = y - 260
    for yy in range(max(0, top), H):
        al = int(150 * min(1, (yy - top) / 220) ** 1.4)
        for xx in range(W): gp[xx, yy] = (10, 6, 8, al)
    out = Image.alpha_composite(Image.alpha_composite(grad, sh), txt); out.save(os.path.join(OUT, name + ".png"))
big = font(64, 380); mid = font(54, 330); cap = font(40, 420); small = font(34, 330)
card("t1", [("Cotton soaks up your skincare.", big, IV, 0, 0)])
card("t2", [("30 seconds of skincare.", mid, IV, 0, -66), ("Then 8 hours on cotton.", mid, IV, 0, 0)])
card("t3", [("Silk absorbs less.", big, IV, 0, 0)])
card("t4", [("Helps your skincare stay on your skin.", mid, IV, 0, 0)])
card("t5", [("22 MOMME  ·  6A GRADE  ·  100% MULBERRY SILK", cap, GD, 6, 0)])
card("t6", [("SILK PILLOWCASE", cap, GD, 8, -70), ("Less friction than cotton.", mid, IV, 0, 0)])
card("t7", [("3D SLEEP MASK", cap, GD, 8, -70), ("Zero pressure. 100% blackout.", mid, IV, 0, 0)])
card("t8", [("REVERSIBLE SILK BONNET", cap, GD, 8, -70), ("Lavender or mint.", mid, IV, 0, 0)])
card("t9", [("Beauty sleep shouldn't be a metaphor.", big, IV, 0, 0)])
# end card: deep berry radial to black
bg = Image.new("RGB", (W, H)); px = bg.load()
import math
for yy in range(H):
    for xx in range(0, W):
        r = min(1, math.hypot((xx - W / 2) / (W * .62), (yy - H / 2) / (H * .75)))
        k = (1 - r) ** 1.3
        px[xx, yy] = (int(8 + (58 - 8) * k), int(4 + (20 - 4) * k), int(6 + (38 - 6) * k))
d = ImageDraw.Draw(bg)
d.text((W / 2, 430), "xmomo", font=font(150, 300), fill=IV[:3], anchor="ms")
d.text((W / 2, 530), "Beauty sleep shouldn't be a metaphor.", font=font(50, 330), fill=IV[:3], anchor="ms")
spaced(d, (W / 2, 660), "15% OFF YOUR FIRST ORDER  ·  CODE WELCOME15", font(38, 430), GD[:3], 5)
d.text((W / 2, 740), "Shop now at xmomoshop.com", font=font(46, 360), fill=IV[:3], anchor="ms")
d.text((W / 2, 990), "Free shipping over $99  ·  30-day returns", font=font(28, 330), fill=(190, 170, 160), anchor="ms")
bg.save(os.path.join(OUT, "endcard.png"))
print("ok")
