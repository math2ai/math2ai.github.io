from pathlib import Path
from PIL import ImageFont
import json
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'build').mkdir(exist_ok=True)
(ROOT/'output').mkdir(exist_ok=True)
course=json.loads((ROOT/'dist/curriculum.json').read_text())
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
fonts={}
def wrap(text,size,bold=False,width=998):
    f=fonts.setdefault((size,bold),ImageFont.truetype(BOLD if bold else REG,size))
    lines=[]
    for para in text.split('\n'):
        line=''
        for word in para.split():
            trial=(line+' '+word).strip()
            if f.getlength(trial)>width:
                if line: lines.append(line)
                line=word
            else: line=trial
        lines.append(line)
    return lines
pages=[]
for c in course['concepts']:
    blocks=[]
    def add(name,text,x,y,size,line_height,bold=False,gray=False,maxlines=None):
        lines=wrap(text,size,bold)
        if maxlines: assert len(lines)<=maxlines,(c['id'],name,lines)
        blocks.append(dict(name=name,lines=lines,x=x,y=y,size=size,lineHeight=line_height,bold=bold,gray=gray))
    add('chapter',f"{c['id']:03} / 100   ·   {c['chapter'].upper()}",62,41,17,22,gray=True,maxlines=1)
    add('title',c['title'],60,86,50,61,bold=True,maxlines=1)
    add('definition-label','DEFINITION',62,171,17,22,bold=True,gray=True,maxlines=1)
    add('definition',c['definition'],60,202,31,39,maxlines=3)
    add('formula',c['formula'],60,332,32,42,maxlines=3)
    add('example-label','WORKED EXAMPLE',62,453,17,22,bold=True,gray=True,maxlines=1)
    add('example',c['example'],60,483,31,39,maxlines=3)
    add('metaphor-label','METAPHOR',62,616,17,22,bold=True,gray=True,maxlines=1)
    add('metaphor',c['metaphor'],60,646,31,39,maxlines=2)
    following=course['concepts'][c['id']]['title'] if c['id']<100 else 'Explain the complete system in your own words.'
    add('footer',('NEXT  '+following) if c['id']<100 else following,62,752,15,20,gray=True,maxlines=1)
    pages.append(dict(id=c['id'],blocks=blocks))
(ROOT/'build/layout.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
print('Layout fit verified for all 100 pages. Body 23.25 pt; formulas 24 pt; titles 37.5 pt.')
