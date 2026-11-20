# Rebuilds ../index.html from template.html + chart.json.  Run gen.py first to regenerate chart.json.
import pathlib
d=pathlib.Path(__file__).parent
(d.parent/'index.html').write_text(d.joinpath('template.html').read_text(encoding='utf-8').replace('__CHART__',d.joinpath('chart.json').read_text()),encoding='utf-8')
print('built')
