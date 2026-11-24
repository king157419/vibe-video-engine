from PIL import Image
import os
src = r"D:\desk\claudex\24\3_第三版资料\参考视频\frames\BV1GXav6iEWh"
def px(n): return Image.open(os.path.join(src,"f_%04d.jpg"%n)).convert("RGB")
def median_region(n, box):
    im = px(n).crop(box)
    data = list(im.getdata())
    rs = sorted(d[0] for d in data); gs = sorted(d[1] for d in data); bs = sorted(d[2] for d in data)
    m = len(data)//2
    return "#%02x%02x%02x" % (rs[m], gs[m], bs[m])
def brightest(n, box, k=30, sat=False):
    im = px(n).crop(box)
    data = list(im.getdata())
    if sat:
        data.sort(key=lambda d: (max(d)-min(d))*max(d), reverse=True)
    else:
        data.sort(key=lambda d: sum(d), reverse=True)
    top = data[:k]
    r = sum(d[0] for d in top)//k; g = sum(d[1] for d in top)//k; b = sum(d[2] for d in top)//k
    return "#%02x%02x%02x" % (r,g,b)
print("bg 10s center", median_region(11,(300,300,550,380)))
print("bg 10s corner", median_region(11,(20,380,200,470)))
print("bg 60s", median_region(61,(20,380,200,470)))
print("bg 125s", median_region(126,(20,380,200,470)))
print("bg 150 (noise)", median_region(151,(20,300,200,380)))
print("bg 240", median_region(241,(20,300,200,380)))
print("gold bar 19s", brightest(20,(300,275,480,295),40,True))
print("gold bar 40s", brightest(41,(60,230,780,245),60,True))
print("gold text 終点 123s", brightest(124,(420,140,520,170),30,True))
print("cyan dot 9s", brightest(10,(290,260,340,300),20,True))
print("cyan arc 252", brightest(253,(150,200,300,260),30,True))
print("red noise 151", brightest(152,(80,300,780,380),60,True))
print("red block 151", median_region(152,(90,268,105,285)))
print("pink banner 101", median_region(102,(470,40,520,52)))
print("subtitle white 18", brightest(19,(300,405,560,428),40))
print("subtitle en 18", brightest(19,(300,432,560,448),40))
print("orange CMB 207", brightest(208,(150,100,700,350),80,True))
print("blue/teal 'no' 54s", brightest(55,(290,70,330,100),20,True))
print("gold 'yes' 55s", brightest(56,(860-568,70,330,100),20,True))
print("ring 64", brightest(65,(250,40,600,250),40))
print("feed bar cyan 232", brightest(233,(480,120,520,300),40,True))
