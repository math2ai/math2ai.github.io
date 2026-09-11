"""Create a self-contained index.html, requiring no server or build tools to use."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent
html=(ROOT/'site-template.html').read_text()
html=html.replace('/*COURSE_CSS*/',(ROOT/'site.css').read_text())
html=html.replace('/*COURSE_JS*/',(ROOT/'site.js').read_text())
html=html.replace('/*COURSE_DATA*/',(ROOT/'dist/curriculum.json').read_text().replace('</','<\\/'))
(ROOT/'dist/index.html').write_text(html)
print('Built self-contained static index.html')
