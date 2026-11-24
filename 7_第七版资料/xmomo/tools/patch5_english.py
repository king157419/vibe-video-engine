import re
p = 'main.js'; s = open(p, encoding='utf-8').read()
n0 = len(re.findall(r"zh: '[^']*'", s))
s = re.sub(r"zh: '[^']*'", "zh: ''", s)
for a in ("const s2 = '22 姆米 · 6A 级 · 100% 桑蚕丝'", "const s2 = '让美容觉，名副其实。'"):
    assert s.count(a) == 1, a
    s = s.replace(a, "const s2 = ''")
a = "await document.fonts.load('300 40px NSerif', 'xmomo 护肤');"
assert s.count(a) == 1; s = s.replace(a, "await document.fonts.load('300 40px NSerif', 'xmomo');")
assert not re.search(r'[一-鿿]', s), 'Chinese left: ' + str(re.findall(r'[一-鿿]+', s)[:5])
open(p, 'w', encoding='utf-8').write(s); print('english only;', n0, 'zh lines cleared')
