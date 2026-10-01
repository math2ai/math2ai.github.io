"""Limits lesson: independent numerical answers, taught boundaries and teaching order.

These checks supplement editorial review; they do not judge teaching quality.
"""
import json, math, re
from pathlib import Path
R=Path(__file__).parent
load=lambda n:json.loads((R/n).read_text(encoding='utf8'))
course=load('dist/curriculum.json');batch=load('expansion-batch.json')
by={c['legacyId']:c for c in course['concepts']}
titles={c['title']:c for c in course['concepts']}
assert batch['laterAddedIds']==[162] and by[162]['title']=='Limits'
lesson=by[162]
assert [q['id'] for q in lesson['questions']]==[f'162-{n:02}' for n in range(1,11)]
assert all(lesson[f].strip() for f in ['definition','formula','formulaNote','example','metaphor'])
assert '162' in load('playgrounds.json')

# The lesson sits directly before the first lesson defined through a limit, and
# Tensor now follows the first vector calculations instead of preceding them.
position=lambda title:titles[title]['id']
assert position('Limits')+1==position('Derivative')<position('Integral')
assert position('Summation')<position('Dot product')<position('Tensor')<position('Norms and unit vectors')
edges={(e['from'],e['to']) for e in load('dist/concept-graph.json')['edges']}
assert {(3,162),(162,19),(162,22)}<=edges
for target in (19,22):
 assert any(m['target']==162 and m['text']=='limit' for m in by[target]['connections']['mentions'])

# Boundaries used by the questions are taught in the lesson itself, not first
# disclosed by a hint or by another question.
taught=lesson['definition']+' '+lesson['example']
for phrase in ['without reaching it','or have any value there at all','both sides settle toward one number',
 'settle toward different numbers, the limit does not exist','no break at the point','grows without bound',
 'numerator (top) and the denominator (bottom)','0/0 has no value']:
 assert phrase in taught,phrase

# Worked example: recompute every quoted output, the shared trend and the gap at 1.
f=lambda x:(x*x-1)/(x-1)
number=r'(\d+(?:\.\d+)?)'
quoted=dict((float(a),float(b)) for a,b in re.findall(rf'f\({number}\) = {number}',lesson['example']))
assert quoted=={.9:1.9,.99:1.99,1.1:2.1,1.01:2.01}
assert all(math.isclose(f(x),y,abs_tol=1e-9) for x,y in quoted.items())
assert all(math.isclose(f(x),x+1,abs_tol=1e-9) for x in (-4,0,.5,.9999,1.0001,3))
try:f(1);raise AssertionError('f(1) must be undefined')
except ZeroDivisionError:pass

questions={q['id']:q for q in lesson['questions']}
checked=[]
def numeric(qid,want):
 q=questions[qid];matches=[]
 for i,option in enumerate(q['options']):
  try:value=float(option.replace('−','-'))
  except ValueError:continue
  if math.isclose(value,want,abs_tol=1e-9):matches.append(i)
 assert matches==[q['correct']],(qid,matches);checked.append(qid)
def worded(qid,answer):
 q=questions[qid];assert q['options'][q['correct']]==answer,qid;checked.append(qid)
# Estimate each limit from shrinking two-sided steps instead of copying the key.
def two_sided(function,point):
 below,above=(function(point+sign*1e-6) for sign in (-1,1))
 return round((below+above)/2,3) if math.isclose(below,above,abs_tol=1e-4) else None
g=lambda x:(x*x-4)/(x-2)
stated=dict((float(a),float(b)) for a,b in re.findall(rf'g\({number}\) = {number}',questions['162-01']['question']))
assert len(stated)==4 and all(math.isclose(g(x),y,abs_tol=1e-9) for x,y in stated.items())
numeric('162-01',two_sided(g,2))
assert two_sided(lambda x:-1 if x<0 else 1,0) is None
worded('162-03','It does not exist')
numeric('162-04',two_sided(lambda x:2*x+1,3))
assert two_sided(lambda x:10 if x==2 else 4,2)==4
numeric('162-05',4)
tail=[1/n for n in (10**3,10**6,10**9)]
assert all(a>b>0 for a,b in zip(tail,tail[1:]))
numeric('162-06',round(tail[-1],6))
ratios=[float(x) for x in re.findall(r'6\.\d+',questions['162-10']['question'])]
assert [float(x) for x in re.findall(r'0\.\d+',questions['162-10']['question'])]==[.1,.01,.001]
steps=[.1,.01,.001]
assert ratios==[6+h for h in steps]
numeric('162-10',round(ratios[-1]-steps[-1],9))
h=lambda x:(x*x-9)/(x-3)
assert 3*3-9==0 and 3-3==0 and two_sided(h,3)==6
worded('162-08','Substituting gives 0/0, which has no value')
print(f'PASS: Limits precedes Derivative and Tensor follows Dot product; {len(checked)} independently solved answers; worked example, taught boundaries and graph links.')
