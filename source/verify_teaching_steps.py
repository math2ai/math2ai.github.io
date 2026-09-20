"""Independent arithmetic and prerequisite checks for the four expanded lessons."""
from pathlib import Path
import json,ast
course=json.loads((Path(__file__).parent/'dist/curriculum.json').read_text(encoding='utf-8'))
lessons={c['legacyId']:c for c in course['concepts']}
questions={q['id']:q for c in course['concepts'] for q in c['questions']}
def unique(qid,parse,predicate):
 q=questions[qid]
 assert [i for i,v in enumerate(q['options']) if predicate(parse(v.replace('−','-')))]==[q['correct']],qid
def apply(a,v):return tuple(sum(x*y for x,y in zip(row,v)) for row in a)
a=[[3,0],[0,1]];compressed=[[3,0],[0,0]]
for v,result in [((1,0),(3,0)),((0,1),(0,1)),((2,5),(6,5))]:assert apply(a,v)==result
assert apply(compressed,(2,5))==(6,0)
unique('104-06',float,lambda v:v==sum(s!=0 for s in [7,0,0]))
unique('104-08',float,lambda v:v*2==10)
assert questions['104-04']['options'][questions['104-04']['correct']]=='At most two'
assert 'rank' in lessons[104]['formulaNote'].lower()
# Keeping exactly the information a task uses preserves that task's answer.
for x,y in [(-3,4),(2,5),(7,6)]:
 compressed_point=(0,y)
 assert (compressed_point[1]>5)==(y>5)
assert questions['104-09']['options'][questions['104-09']['correct']].startswith('Yes;')
assert -3+3==0
assert questions['107-07']['options'][questions['107-07']['correct']]=='It is positive: λ=3'
# f and g receive the same pair and have distinct roles; show each substitution.
f=lambda x,y:x*x+y*y
g=lambda x,y:x+y-2
assert f(0,2)==4 and g(0,2)==0
assert f(1,1)==2 and g(1,1)==0
assert 2*1+(-2)==0
for x in [-4,-1,0,0.5,1,1.5,2,3,6]:assert f(x,2-x)>=f(1,1)
text=lessons[107]['definition']+lessons[107]['formulaNote']+lessons[107]['example']
for term in ['f(x,y)','g(x,y)','Both x and y are inputs','2x+λ=0','2y+λ=0']:assert term in text
unique('107-08',float,lambda multiplier:2*4+multiplier==0)
q=questions['107-10'];assert q['options'][q['correct']]=='x+y−10'
assert all(x+y-10==0 for x,y in [(0,10),(3,7),(12,-2)])
# Wrong split shares raw observations; the replacement holds out an entire well.
assert set([100,101,102])&set([101,102,103])=={101,102}
text=lessons[28]['example']
for term in ['Leakage:','Fix for testing on new wells:','before making windows','training wells only']:assert term in text
assert 'Wells C and D' in questions['28-01']['options'][questions['28-01']['correct']]
target,current,eta=6,4,.1
residual=target-current;updated=current+eta*residual
assert residual==2 and updated==4.2 and round(target-updated,10)==1.8
for term in ['6−4=2','= 4.2','6−4.2=1.8']:assert term in lessons[112]['example']
print('PASS: SVD arrows, retained directions and inverse scaling; explicit two-input objective/constraint; corrected leakage split; staged boosting calculation.')
