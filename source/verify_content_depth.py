"""Arithmetic and drift checks for the 128-lesson depth review.

These checks verify calculations and the reviewed snapshot, not teaching quality.
Autoencoder gradients, training and edited data have additional independent
finite-difference/row-loop checks in verify_neural_playgrounds.mjs.
"""
import hashlib
import json
import math
from pathlib import Path

root = Path(__file__).resolve().parent
course = json.loads((root/'dist/curriculum.json').read_text(encoding='utf8'))
review = json.loads((root/'content-depth-review.json').read_text(encoding='utf8'))
concepts = {c['legacyId']: c for c in course['concepts'] if c['legacyId'] <= 128}
assert len(concepts) == len(review['concepts']) == 128
assert {r['conceptId'] for r in review['concepts']} == set(concepts)
for r in review['concepts']:
    c = concepts[r['conceptId']]
    assert r['title'] == c['title']
    teaching = {k: c.get(k, '') for k in ('definition','formula','formulaNote','example')}
    digest = hashlib.sha256(json.dumps(teaching, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    assert digest == r['teachingSha256'], (c['title'], 'Re-review edited teaching')
questions = [(r['conceptId'], concepts[r['conceptId']]['questions']) for r in review['concepts']]
assert hashlib.sha256(json.dumps(questions,ensure_ascii=False,sort_keys=True).encode()).hexdigest() == review['questionSha256'], 'This revision must not change quiz content or progress IDs'

checks=[]
def check(i, actual, expected, phrase, tol=1e-9):
    assert math.isclose(actual,expected,rel_tol=tol,abs_tol=tol),(i,actual,expected)
    assert phrase in concepts[i]['example'],(i,phrase)
    checks.append(i)

check(1,25-24.5,.5,'rise of 0.5')
check(4,300*4,1200,'1,200 centimetres')
check(9,2*4+3*5,23,'totaling 23')
check(20,2*1*.01,.02,'about 0.02')
check(20,6*2*.01,.12,'about 0.12')
check(108,2*3,6,'slope is six times y')
check(109,(2+4+9)/3,5,'prediction 5')
check(110,sum((v-5)**2 for v in [2,2,8,8])/4,9,'squared error 9')
check(42,3+.1*(1**2+2**2),3.5,'total is 3.5')
check(112,4+.1*2,4.2,'to 4.2')
check(112,4+.1*(-2),3.8,'to 3.8')
check(33,3*0-2*2+1,-3,'totals −3')
check(34,1/(1+math.exp(-6)),.9975,'0.9975',tol=.00005)
check(34,1/(1+math.exp(-8)),.9997,'0.9997',tol=.00005)
check(37,(2*2-6)**2,4,'loss 4')
check(38,((1-.1*(-16))*2-6)**2,.64,'loss is 0.64')
check(36,3*(2*0-1-1),-6,'output −6')
check(115,3-1,2,'gives 2')
check(44,-math.log(.1)+math.log(.9),2.198,'2.198',tol=.001)
check(117,math.exp(math.log(4))/(math.exp(math.log(4))+1),.8,'probability 0.8')
check(51,1+.01*20,1.2,'1.2 and 2.05')
check(51,2+.01*5,2.05,'1.2 and 2.05')
check(52,(0-1)**2+(2-1)**2,2,'from 4 to 2')
check(80,3*1.234-3*1.23,.012,'0.012')
check(121,(1-.5)**2,.25,'0.25')
check(121,(2.2-.6*.5)/.8,2.375,'2.375')
check(55,2/4,.5,'gives 0.5')
check(57,(2+6)/2,4,'becomes 4')
check(59,math.sqrt(((-1-1)**2+(3-1)**2)/2),2,'standard deviation is 2')
check(61,-math.log(.2),1.609,'1.609',tol=.001)
check(124,-.8*math.log(.8)-.2*math.log(.2),.500,'0.500',tol=.001)
check(65,11-2,9,'down to 9')
check(68,2+0+10,12,'total 12')
check(70,.8*10,8,'becomes 8')
check(73,.9+.1/2,.95,'0.95')
check(72,2.5+.25*(4-2.5),2.875,'2.875')
check(74,.8*4+.2*1,3.4,'to 3.4')
check(85,1e9*32/8/1e9,4,'another 4 GB')
check(123,2*2*11*1*4*2,352,'352 bytes')
check(123,2*2*10*1*4*2*2,640,'640 bytes')
check(86,10*5/100,.5,'0.5 seconds')
check(88,80/(20+60/4),2.29,'2.29',tol=.005)
check(89,8000/50,160,'160')
check(125,100*(1.1-1)/1,10,'10% relative')
check(93,(20+30)/2,25,'summary is 25')
check(91,(4+0+6)/3,3.33,'3.33',tol=.005)
check(96,400*.005+600*.01,8,'contain 8 tonnes')
check(127,.5*4+.5*8,6,'producing 6')
check(128,100*.4/90,.444,'0.444%',tol=.001)
check(128,4*.25/2*100,50,'50% recovery')
check(99,(30-10-5)*12,180,'180 minutes')
check(100,8-6.4,1.6,'1.6 t unrecovered')

# Example/quiz collisions found during review must not return.
assert 'inputs 2, 4, 7 and 9' in concepts[110]['example']
assert '5 t concentrate at 20%' not in concepts[128]['example']
assert '4 t concentrate at 25%' in concepts[128]['example']

# Reconstruct the autoencoder's first full-batch update using scalar loops.
data=[[-2,-4],[-1,-2],[1,2],[2,4]]
e=[1.,0.];d=[1.,1.]
def loss(e,d):
    return sum((sum(a*b for a,b in zip(e,x))*d[j]-x[j])**2 for x in data for j in range(2))/8
ge=[0.,0.];gd=[0.,0.]
for x in data:
    z=sum(a*b for a,b in zip(e,x));err=[z*d[j]-x[j] for j in range(2)]
    for j in range(2):
        ge[j]+=sum(a*b for a,b in zip(d,err))*x[j]/4
        gd[j]+=z*err[j]/4
assert ge==[-2.5,-5] and gd==[0,-2.5]
e=[v-.04*g for v,g in zip(e,ge)];d=[v-.04*g for v,g in zip(d,gd)]
check(49,loss(e,d),.465625,'0.465625')
print(f'PASS: all 128 reviewed teaching snapshots and unchanged 1,280 questions; {len(checks)} arithmetic checks plus the independent autoencoder first update.')
