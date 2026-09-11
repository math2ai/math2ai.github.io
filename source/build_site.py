"""Create a self-contained index.html, requiring no server or build tools to use."""
from pathlib import Path
import base64
ROOT=Path(__file__).resolve().parent
html=(ROOT/'site-template.html').read_text(encoding='utf-8')
logo=base64.b64encode((ROOT/'assets/math2ai-logo.png').read_bytes()).decode('ascii')
html=html.replace('/*COURSE_LOGO*/','data:image/png;base64,'+logo)
html=html.replace('/*COURSE_CSS*/',(ROOT/'site.css').read_text(encoding='utf-8'))
html=html.replace('/*COURSE_JS*/',(ROOT/'site.js').read_text(encoding='utf-8'))
html=html.replace('/*COURSE_DATA*/',(ROOT/'dist/curriculum.json').read_text(encoding='utf-8').replace('</','<\\/'))
(ROOT/'dist/index.html').write_text(html, encoding='utf-8')
print('Built self-contained static index.html')
