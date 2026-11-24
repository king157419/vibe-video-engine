from PIL import Image
import os, colorsys
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
def px(n): return Image.open(os.path.join(src,"f_%04d.jpg"%n)).convert("RGB")
def accent(n, box, k=25, minv=90):
    im = px(n).crop(box)
    data = [d for d in im.get_flattened_data() if max(d) >= minv] if hasattr(im,"get_flattened_data") else [d for d in im.getdata() if max(d)>=minv]
    if not data: return "none"
    def sat(d):
        h,s,v = colorsys.rgb_to_hsv(*[c/255 for c in d]); return s
    data.sort(key=sat, reverse=True)
    top = data[:k]
    r = sum(d[0] for d in top)//len(top); g = sum(d[1] for d in top)//len(top); b = sum(d[2] for d in top)//len(top)
    return "#%02x%02x%02x (n=%d)" % (r,g,b,len(data))
print("gold meter 19s", accent(20,(300,270,500,300)))
print("gold ruler 40s", accent(41,(60,225,790,250)))
print("gold 终点 123s", accent(124,(130,415,700,440)))
print("cyan dot 9s", accent(10,(290,265,330,295)))
print("cyan arc 252", accent(253,(150,150,700,300)))
print("red noise wave 151", accent(152,(100,240,750,300)))
print("red blocks 151", accent(152,(100,155,750,190)))
print("pink banner 101", accent(102,(480,60,790,90)))
print("gold yes 55s", accent(56,(440,115,500,145)))
print("blue no 54s", accent(55,(440,115,500,145)))
print("CMB orange 207", accent(208,(150,80,700,350),80,150))
print("feed cyan 232", accent(233,(560,60,720,300),40))
print("lamp glow 266", accent(267,(520,130,600,190)))
print("snow headline red dot 92", accent(93,(780,80,820,120),5,60))
print("subtitle zh 18", accent(19,(300,405,560,428),25,150))
print("chapter num 40", accent(41,(20,28,50,46),10,60))
