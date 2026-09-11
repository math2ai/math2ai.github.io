from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
ROOT=Path(__file__).resolve().parents[1]
pages=json.loads((ROOT/'build/layout.json').read_text())
course=json.loads((ROOT/'dist/curriculum.json').read_text())
pdfmetrics.registerFont(TTFont('DejaVu','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuBold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
W,H=1122.52*.75,793.7*.75
c=canvas.Canvas(str(ROOT/'output/Mathematics-to-Model-Conversations.pdf'),pagesize=(W,H))
c.setTitle('Mathematics to Model Conversations: 100 Concepts')
c.setAuthor('Prepared for Danny Castonguay and Linus')
c.setSubject('Mathematics, machine learning, representations, reinforcement learning, computing, and the proposed Sememe.ai well-log workflow')
for p in pages:
    concept=course['concepts'][p['id']-1]
    c.bookmarkPage(f"concept-{p['id']}")
    chapter_start=p['id'] in [v['start'] for v in course['chapters']]
    if chapter_start:c.addOutlineEntry(concept['chapter'],f"concept-{p['id']}",0,False)
    c.addOutlineEntry(f"{p['id']:03}. {concept['title']}",f"concept-{p['id']}",1,False)
    for b in p['blocks']:
        c.setFont('DejaVuBold' if b['bold'] else 'DejaVu',b['size']*.75)
        c.setFillGray(1/3 if b['gray'] else 0.0667)
        for j,line in enumerate(b['lines']):
            c.drawString(b['x']*.75,H-(b['y']+j*b['lineHeight']+b['size']*.8)*.75,line)
    c.showPage()
c.save()
print('Exported 100-page A4 landscape PDF with embedded fonts and chapter/concept bookmarks.')
