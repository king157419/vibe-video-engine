from PIL import Image
import os, colorsys
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
def px(n): return Image.open(os.path.join(src,"f_%04d.jpg"%n)).convert("RGB")
def accent(n, box, k=40, smin=0.3):
    im = px(n).crop(box)
    data = list(im.get_flattened_data())
    rows = []
    for d in data:
        h,s,v = colorsys.rgb_to_hsv(*[c/255 for c in d])
        if s >= smin: rows.append((v,d))
    if not rows: return "none"
    rows.sort(reverse=True)
    top = [d for v,d in rows[:k]]
    r = sum(d[0] for d in top)//len(top); g = sum(d[1] for d in top)//len(top); b = sum(d[2] for d in top)//len(top)
    return "#%02x%02x%02x" % (r,g,b)
jobs = [("gold meter 19s",20,(300,270,500,300)),("gold ruler 40s",41,(60,225,790,250)),("gold 终点 123s",124,(130,415,700,440)),
("cyan dot 9s",10,(290,265,330,295)),("cyan arc 252",253,(150,150,700,300)),("red noise wave 151",152,(100,240,750,300)),
("red blocks 151",152,(100,155,750,190)),("pink banner 101",102,(480,60,790,90)),("gold yes 55s",56,(440,115,500,145)),
("blue no 54s",55,(440,115,500,145)),("CMB orange 207",208,(150,80,700,350)),("CMB blue 207",208,(150,80,700,350)),
("feed cyan 232",233,(560,60,720,300)),("lamp glow 266",267,(520,130,600,190)),("voyager pulse 178",179,(50,100,350,170)),("earth 184",185,(40,130,110,180)),
("formula gold 112",113,(250,90,620,140)),("CRT labels 200",201,(380,50,700,80))]
for name,n,box in jobs:
    print(name, accent(n,box))
