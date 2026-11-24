import re
p = 'main.js'; s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (a, s.count(a)); s = s.replace(a, b)
# replace the radial smudge with a soft bottom gradient
i = s.index("      if (x.kind === 'line') { g.save(); g.shadowBlur = 0;"); j = s.index("g.restore(); }\n", i) + len("g.restore(); }\n")
s = s[:i] + "      if (x.kind === 'line' && t >= 10 && t < 16) { g.save(); g.shadowBlur = 0; g.globalAlpha = a * .6; const gr = g.createLinearGradient(0, 600, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.6, 'rgba(0,0,0,.8)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, 600, W, H - 600); g.restore(); }\n" + s[j:]
rep("{ id: 't7', a: 20.25, b: 22.95,", "{ id: 't7', a: 20.05, b: 23.0,")
rep("{ id: 't8', a: 23.25, b: 25.95,", "{ id: 't8', a: 23.05, b: 26.0,")
rep("{ id: 't9', a: 26.25, b: 28.75,", "{ id: 't9', a: 26.05, b: 28.85,")
rep("Math.min(ss(seg(t, x.a, x.a + .35)), 1 - ss(seg(t, x.b - .3, x.b)))", "Math.min(ss(seg(t, x.a, x.a + .25)), 1 - ss(seg(t, x.b - .25, x.b)))")
rep("const a2 = ss(seg(t, x.a + .8, x.a + 1.3)); g.globalAlpha = a * a2; g.font = F(44, 300);", "const a2 = ss(seg(t, x.a + .4, x.a + .8)); g.globalAlpha = a * a2; g.font = F(44, 300);")
rep("const a3 = ss(seg(t, x.a + 1.4, x.a + 1.9));", "const a3 = ss(seg(t, x.a + .9, x.a + 1.3));")
rep("spaced(s3, W / 2, 1000, 9, 'center');", "spaced(s3, W / 2, 1034, 9, 'center');")
rep("pillow.position.set(0, -5.6, 0);", "pillow.position.set(0, -5.2, 0);")
open(p, 'w', encoding='utf-8').write(s); print('patched')
