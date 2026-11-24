def patch(p, pairs):
    s = open(p, encoding='utf-8').read()
    for a, b in pairs:
        assert s.count(a) == 1, (a, s.count(a)); s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
patch('main.js', [
    # a soft dark pool behind lower-third lines so they read on bright silk
    ("      g.font = F(s, 300); g.textAlign = 'center'; g.fillText(x.en, W / 2, y + dy);",
     "      if (x.kind === 'line') { g.save(); g.shadowBlur = 0; g.globalAlpha = a * (t >= 10 && t < 16 ? .62 : .3); const gr = g.createRadialGradient(W / 2, y + 10, 10, W / 2, y + 10, 520); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.translate(0, (y + 10) * .72); g.scale(1, .28); g.fillRect(W / 2 - 560, y + 10 - 560, 1120, 1120); g.restore(); }\n      g.font = F(s, 300); g.textAlign = 'center'; g.fillText(x.en, W / 2, y + dy);"),
    ("warm: 2.4 * dawn,", "warm: 1.0 * dawn,"),
    ("keyLight.color.set('#ffd9ae');", "keyLight.color.set('#fff0dc');"),
    ("P.bloom = .35; P.warm = .7; P.bg = .7 * dawn;", "P.bloom = .35; P.warm = .3; P.bg = .7 * dawn;"),
    ("col: '#ffd9a8' } };", "col: '#ffe6c4' } };"),
])
patch('score.py', [
    ("add(pad([38, 45], 9.6, 2., 1.2, .5), 0, .5)", "add(pad([38, 45], 9.6, 2., 1.2, .5), 0, .26)"),
    ("add(pad([CH[k][0] - 12], end - k + .3, .2, .4, .6), k, .36)", "add(pad([CH[k][0] - 12], end - k + .3, .2, .4, .6), k, .17)"),
    ("add(bass(CH[k][0] - 12, .42), tq, .3)", "add(bass(CH[k][0] - 12, .42), tq, .17)"),
    ("if tq >= 20: add(kick(), tq, .42)", "if tq >= 20: add(kick(), tq, .26)"),
    ("add(pad([26], 4.6, .1, 2.4, .7), 31.5, .34)", "add(pad([26], 4.6, .1, 2.4, .7), 31.5, .14)"),
    ("add(pad(CH[k], end - k + .5, .35, .6, .3), k, .36)", "add(pad(CH[k], end - k + .5, .35, .6, .45), k, .46)"),
])
print('patched')
