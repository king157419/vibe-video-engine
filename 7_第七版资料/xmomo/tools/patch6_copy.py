p = 'main.js'; s = open(p, encoding='utf-8').read()
for a, b in [
    ("en: 'It drinks it all in.'", "en: 'Cotton soaks it up.'"),
    ("en: 'Skincare stays on your face.'", "en: 'Helps skincare stay on your skin.'"),
    ("en: 'Less friction. Fewer sleep creases.'", "en: 'Less friction than cotton.'"),
    ("en: 'Lavender tonight. Mint tomorrow.'", "en: 'Lavender or mint. Your call.'"),
]:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s); print('copy patched')
