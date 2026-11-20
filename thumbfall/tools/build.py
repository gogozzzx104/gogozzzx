# Rebuilds ../index.html from template.html + the song modules + chart.json (Reality Glitch; regenerate with gen.py).
import pathlib
d=pathlib.Path(__file__).parent; r=lambda n:d.joinpath(n).read_text(encoding='utf-8')
s=r('template.html')
for k,f in [('__VOICES__','voices.js'),('__INDIGO__','indigo.js'),('__SONGS__','songs.js'),('__PRISM__','prism.js'),('__CHART__','chart.json')]:
    assert s.count(k)==1,k; s=s.replace(k,r(f))
(d.parent/'index.html').write_text(s,encoding='utf-8'); print('built',len(s))
