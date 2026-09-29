"""Pilot: independent numeric answers, prerequisites, graph and ID preservation.

These checks supplement editorial review; they do not judge teaching quality.
"""
import ast, hashlib, json, math
from pathlib import Path
R=Path(__file__).parent
load=lambda n:json.loads((R/n).read_text(encoding='utf8'))
course=load('dist/curriculum.json');batch=load('expansion-batch.json')
by={c['legacyId']:c for c in course['concepts']}
added={149,150,151,152,153,154,155,156,159,160}
assert set(batch['addedIds'])==added and len(by)==138
assert set(by)==set(range(1,129))|added
assert course['version']=='2.0'
questions={q['id']:q for c in course['concepts'] for q in c['questions']}
assert len(questions)==1380
old=load('content-depth-review.json')
original=[(r['conceptId'],by[r['conceptId']]['questions']) for r in old['concepts']]
digest=hashlib.sha256(json.dumps(original,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
assert digest==batch['originalQuestionsSha256']==old['questionSha256']
for i in added:
 c=by[i]
 assert len(c['questions'])==10 and str(i) in load('playgrounds.json')
 assert [q['id'] for q in c['questions']]==[f'{i}-{n:02}' for n in range(1,11)]
 assert all(c[f].strip() for f in ['definition','formula','formulaNote','example','metaphor'])

# Reconstruct the graph independently, then run Kahn's cycle check. Backward
# prerequisite hyperlinks represent edges from their prerequisite to this lesson.
graph=load('dist/concept-graph.json')
assert {n['id'] for n in graph['nodes']}==set(by)
expected=set()
for c in by.values():
 for m in c['connections']['mentions']:expected.add((m['target'],c['legacyId']))
 for target in c['connections']['usedIn']:expected.add((c['legacyId'],target))
edges={(e['from'],e['to']) for e in graph['edges']}
assert edges==expected
assert all(by[a]['id']<by[b]['id'] for a,b in edges)
indegree={i:0 for i in by};out={i:[] for i in by}
for a,b in edges:indegree[b]+=1;out[a].append(b)
ready=[i for i,n in indegree.items() if not n];visited=[]
while ready:
 a=ready.pop();visited.append(a)
 for b in out[a]:
  indegree[b]-=1
  if indegree[b]==0:ready.append(b)
assert len(visited)==138

for chain in [[5,150,151,152,153,12,156,159,104,160,48,49],
              [9,149,13,154,155,153],[10,11,12,156],[159,103,104]]:
 assert all(by[a]['id']<by[b]['id'] for a,b in zip(chain,chain[1:])),chain
# Specific boundaries used by the questions are taught in the lesson, rather
# than being disclosed for the first time in a hint or another quiz question.
for i,phrase in [(150,'need not add to one'),(149,'zero vector cannot'),
 (154,'orthonormal'),(155,'closest point'),(151,'zero vector'),
 (152,'at most two'),(153,'number of entries'),(156,'none'),
 (159,'every entry is zero'),(160,'ties')]:
 assert phrase in (by[i]['definition']+' '+by[i]['example'])

checked=[]
def unique(qid,parse,predicate):
 q=questions[qid]
 assert [i for i,o in enumerate(q['options']) if predicate(parse(o.replace('−','-')))]==[q['correct']],qid
 checked.append(qid)
vec=ast.literal_eval
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
add=lambda a,b:tuple(x+y for x,y in zip(a,b))
scale=lambda n,a:tuple(n*x for x in a)
def numeric(qid,want):unique(qid,float,lambda x:math.isclose(x,want,abs_tol=1e-10))
def vector(qid,want):unique(qid,vec,lambda x:tuple(x)==tuple(want))
vector('150-01',add(scale(3,(2,1)),scale(-1,(0,3))))
unique('150-02',vec,lambda c:add(scale(c[0],(1,0)),scale(c[1],(0,2)))==(4,6))
vector('150-07',add((2,-1),scale(-1,(2,-1))))
unique('150-10',vec,lambda c:add(scale(c[0],(1,1)),scale(c[1],(1,-1)))==(6,2))
numeric('149-01',math.hypot(5,12))
vector('149-02',scale(1/math.hypot(0,-7),(0,-7)))
unique('149-05',vec,lambda v:dot(v,v)==1)
numeric('149-08',dot((2,-3,6),(2,-3,6)))
unique('154-02',vec,lambda v:dot((4,0),v)==0)
numeric('154-08',-6/2)
unique('154-09',lambda s:[vec(x) for x in s.split(' and ')],
       lambda pair:dot(*pair)==0 and all(dot(v,v)==1 for v in pair))
def project(x,u):return scale(dot(x,u)/dot(u,u),u)
vector('155-01',project((6,2),(1,0)))
numeric('155-02',dot((4,0),(1,1))/dot((1,1),(1,1)))
vector('155-07',add((2,5),scale(-1,project((2,5),(0,1)))))
def independent(pair):
 a,b=pair;return a[0]*b[1]!=a[1]*b[0]
unique('151-04',lambda s:[vec(x) for x in s.split(' and ')],independent)
unique('151-10',vec,lambda c:add(scale(c[0],(1,1)),scale(c[1],(0,2)))==(3,7))
unique('152-02',lambda s:[vec(x) for x in s.split(' and ')],independent)
relations={'u + v - w = (0, 0)':(1,1,-1),'u + v + w = (0, 0)':(1,1,1),
           'u - v + w = (0, 0)':(1,-1,1),'2u - v = (0, 0)':(2,-1,0)}
unique('152-04',lambda s:relations[s],lambda c:add(add(scale(c[0],(1,0)),scale(c[1],(0,2))),scale(c[2],(1,2)))==(0,0))
unique('153-01',lambda s:[vec(x) for x in s.split(' and ')],independent)
vector('153-02',add(scale(2,(1,0)),scale(3,(1,2))))
unique('153-07',vec,lambda c:add(scale(c[0],(2,0)),scale(c[1],(0,1)))==(8,-3))
unique('156-01',vec,lambda v:v[0]+v[1]==7 and v[0]-v[1]==3)
vector('156-05',(3,-2))
numeric('159-01',1 if not independent([(2,3),(4,6)]) else 2)
numeric('159-02',0)
numeric('159-03',min(2,5))
numeric('159-05',2 if independent([(1,0),(0,3)]) else 1)
numeric('159-06',1)
unique('159-08',float,lambda t:1*t==2*3)
unique('160-01',vec,lambda a:a==[[8,0],[0,0]])
numeric('160-02',min(5,1)**2)
numeric('160-08',min(9,4)**2)

# Verify the new migration changes only the existing ID limit, not account
# authorization, conflict handling, saved rows or grants.
base=(R.parent/'supabase/migrations/202609200001_learning_choices.sql').read_text()
new=(R.parent/'supabase/migrations/202609290001_expand_learning_concepts.sql').read_text()
oldfunc=base[base.index('create or replace function'):base.index('\ndo $$ begin')].strip()
newfunc=new[new.index('create or replace function'):new.rindex('commit;')].strip()
assert newfunc==oldfunc.replace('::integer>128','::integer>256')
print(f'PASS: 10 full lessons/100 new questions; {len(checked)} independently solved numerical option sets; original 1,280 questions unchanged; 138-node DAG; prerequisites and additive SQL boundary.')
