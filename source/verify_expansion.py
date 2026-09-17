"""Independent numeric and structured checks for the 28 added lessons."""
from pathlib import Path
from fractions import Fraction
import json, math, re

root=Path(__file__).resolve().parent
course=json.loads((root/'dist/curriculum.json').read_text(encoding='utf-8'))
by_title={c['title']:c for c in course['concepts']}
new=[c for c in course['concepts'] if c['legacyId']>100]
assert len(new)==28 and sum(len(c['questions']) for c in new)==280
assert all(c['sources'] for c in new)

# Each case independently solves the stated quantities, rather than reading an answer key.
# None selects the primary question; a string selects a unique additional prompt.
numeric=[
 ('Bayes’ theorem',None,Fraction(12,12+18)),
 ('Bayes’ theorem','P(H)=0.2',.5*.2/.25),
 ('Bayes’ theorem','Of 200 parts',15/(15+45)),
 ('Covariance and correlation',None,((-2)*2+2*(-2))/2),
 ('Covariance and correlation','covariance is 6',6/(2*3)),
 ('Eigenvalues and eigenvectors',None,-4),
 ('Eigenvalues and eigenvectors','A(2v)',3*2),
 ('Eigenvalues and eigenvectors','identity matrix',1),
 ('Eigenvalues and eigenvectors','A²v',2**2),
 ('Singular value decomposition','unit-length input',4*1),
 ('Monte Carlo estimation',None,sum([2,3,7,8,9,13])/6),
 ('Monte Carlo estimation','30 of 100',30/100),
 ('Monte Carlo estimation','s=6',6/math.sqrt(100)),
 ('Lagrange multipliers','What is λ',-2*(8/2)),
 ('Hessian and curvature','f(x)=x⁴',4*3*2**2),
 ('Hessian and curvature','three variables',3*3),
 ('k-nearest neighbors',None,sum([-2,5,9])/3),
 ('k-nearest neighbors','query at x=3',min([(abs(3-0),10),(abs(3-4),20)])[1]),
 ('Decision trees',None,8 if 6>5 else 2),
 ('Decision trees','targets 1, 7, 13, and 19',sum([1,7,13,19])/4),
 ('Decision trees','Gini impurity',1-sum(p*p for p in [1,0])),
 ('Random forests',None,sum([1,5,12])/3),
 ('Random forests','probability 0.2 and 0.8',(.2+.8)/2),
 ('Gradient boosting',None,6+.2*(-3)),
 ('Gradient boosting','target 7',7-4),
 ('Gradient boosting','If F=10',10+.25*(-4)),
 ('Gradient boosting','starting at prediction 0',5-(0+.2*5)),
 ('Class imbalance, precision and recall',None,12/(12+4)),
 ('Class imbalance, precision and recall','7 true positives and 3 false positives',7/(7+3)),
 ('Class imbalance, precision and recall','99 negatives',100*99/100),
 ('Class imbalance, precision and recall','classifier always predicts negative',0/(0+1)),
 ('Class imbalance, precision and recall','precision 0.5',2*.5*.5/(.5+.5)),
 ('Probability calibration','200 cases',50/200),
 ('Probability calibration','Brier loss',(.8-1)**2),
 ('Convolutional neural networks','length-5 input',5-3+1),
 ('Convolutional neural networks','first output',2+3),
 ('Graph neural networks',None,3+(-2+6)/2),
 ('Graph neural networks','self 2 and neighbors',2+(4+8)/2),
 ('Contrastive learning',None,-math.log(math.exp(-2))),
 ('Contrastive learning','probability 0.5',-math.log(.5)),
 ('Domain shift and adaptation',None,88-61),
 ('Domain shift and adaptation','70% to 78%',78-70),
 ('Active learning',None,max([.45,.1,.8,.95],key=lambda p:1-abs(2*p-1))),
 ('Active learning','u(0.25)',1-abs(2*.25-1)),
 ('Active learning','budget is 40',40//5),
 ('Causal inference',None,11-15),
 ('Causal inference','treatment mean is 7',7-10),
 ('Diffusion models',None,math.sqrt(.36)*3+math.sqrt(1-.36)*(-1)),
 ('Diffusion models','ᾱ=0.36',math.sqrt(.36)*5+math.sqrt(1-.36)*0),
 ('Mixture of experts',None,.75*(-3)+.25*9),
 ('Mixture of experts','8 experts',8-2),
 ('Mixture of experts','experts 10 and 20',.6*10+.4*20),
 ('Context windows and KV caching',None,2*3*12*2*4*2),
 ('Context windows and KV caching','320-byte cache',320/2),
 ('Context windows and KV caching','4,096-token',4096-3000),
 ('Model distillation',None,-.25*math.log(.8)-.75*math.log(.2)),
 ('Model distillation','100 ms per case',100/25),
 ('Assay quality control',None,100*(2.30-2)/2),
 ('Assay quality control','reference 2.0',100*(1.8-2)/2),
 ('Assay quality control','Duplicate values are 9 and 11',100*abs(9-11)/((9+11)/2)),
 ('Spatial cross-validation',None,90),
 ('Variograms and kriging',None,((-1)**2+3**2+4**2)/(2*3)),
 ('Variograms and kriging','all paired observations',0),
 ('Variograms and kriging','One pair has values 2 and 6',(2-6)**2/2),
 ('Variograms and kriging','weights sum to',1),
 ('Variograms and kriging','weights 0.4 and 0.6',.4*3+.6*8),
 ('Mineral processing and recovery',None,100*3.5/5),
 ('Mineral processing and recovery','5-tonne concentrate',5*.2),
 ('Mineral processing and recovery','feed is 250 tonnes',250-40),
 ('Mineral processing and recovery','remains in tailings',7.5-6.3),
 ('Mineral processing and recovery','10 tonnes and recovery',10*.7),
]
def question(title,fragment):
    qs=by_title[title]['questions']
    if fragment is None: return qs[0]
    matches=[q for q in qs[1:] if fragment in q['question']]
    assert len(matches)==1,(title,fragment,len(matches))
    return matches[0]
def answer(title,fragment):
    q=question(title,fragment)
    return q['options'][q['correct']].replace('−','-')
for title,fragment,expected in numeric:
    label=answer(title,fragment).replace(',','')
    token=re.search(r'[+-]?\d+(?:\.\d+)?(?:/\d+)?',label)
    assert token,(title,fragment,label)
    actual=float(Fraction(token.group()))
    tolerance=.001 if 'About' in label or 'about' in label else 1e-10
    assert math.isclose(actual,float(expected),rel_tol=tolerance,abs_tol=tolerance),(title,fragment,actual,expected)

structured=[
 ('Singular value decomposition',None,[[0,0],[0,4]]),
 ('Lagrange multipliers',None,(3*8/4,8/4)),
 ('Hessian and curvature',None,[[2*4,0],[0,2*2]]),
 ('Hessian and curvature','f(x,y)=x²−y²',[[2,0],[0,-2]]),
 ('Convolutional neural networks',None,tuple(2*a-b for a,b in zip([2,0,3],[0,3,1]))),
 ('KL divergence',None,(.25,.75)),
]
import ast
for title,fragment,expected in structured:
    assert ast.literal_eval(answer(title,fragment))==expected,(title,fragment)

# Symbolic logarithm choices must not be interpreted as the scalar inside ln.
assert answer('KL divergence','P = (1,0)') == 'ln 8'
assert math.isclose(math.log(1/.125), math.log(8))

# New worked examples, including outputs beyond the selected quiz answer.
examples=[
 ('Bayes’ theorem',Fraction(8,17),8/17,'8/17'),
 ('Covariance and correlation',2/(1*2),1,'correlation = 1'),
 ('Eigenvalues and eigenvectors',2*1,2,'(2,0)'),
 ('Singular value decomposition',3**2+1**2-3**2,1,'[[3,0],[0,0]]'),
 ('KL divergence',math.log(2),.693,'0.693'),
 ('Monte Carlo estimation',sum([0,2,4,6])/4,3,'12/4 = 3'),
 ('Lagrange multipliers',1**2+1**2,2,'objective 2'),
 ('Hessian and curvature',2*3,6,'[[2,0],[0,6]]'),
 ('k-nearest neighbors',(2+4+9)/3,5,'= 5'),
 ('Decision trees',2 if 4<=5 else 8,2,'prediction 2'),
 ('Random forests',(2+4+6)/3,4,'prediction is 4'),
 ('Gradient boosting',4+.1*2,4.2,'= 4.2'),
 ('Class imbalance, precision and recall',6/(6+2),.75,'0.75'),
 ('Class imbalance, precision and recall',6/(6+4),.6,'0.6'),
 ('Probability calibration',60/100,.6,'frequency is 0.6'),
 ('Convolutional neural networks',1-2,-1,'1−2=−1'),
 ('Convolutional neural networks',2-3,-1,'2−3=−1'),
 ('Graph neural networks',1+(2+4)/2,4,'= 4'),
 ('Contrastive learning',-math.log(.8),.223,'0.223'),
 ('Contrastive learning',-math.log(.2),1.609,'1.609'),
 ('Domain shift and adaptation',90-70,20,'20 percentage points'),
 ('Active learning',1-abs(2*.9-1),.2,'0.2'),
 ('Causal inference',12-9,3,'= 3'),
 ('Diffusion models',math.sqrt(.64)*2+math.sqrt(.36),2.2,'= 2.2'),
 ('Mixture of experts',.25*2+.75*6,5,'= 5'),
 ('Context windows and KV caching',2*2*10*1*4*2,320,'= 320 bytes'),
 ('Model distillation',-.8*math.log(.5)-.2*math.log(.5),.693,'0.693'),
 ('Assay quality control',100*(1.1-1)/1,10,'+10%'),
 ('Spatial cross-validation',int(30<100 and 150>=100),1,'150 m'),
 ('Variograms and kriging',(2**2+4**2)/(2*2),5,'= 5'),
 ('Mineral processing and recovery',100*.02,2,'contains 2 t'),
 ('Mineral processing and recovery',10*.16,1.6,'contains 1.6 t'),
 ('Mineral processing and recovery',100*(10*.16)/(100*.02),80,'80%'),
 ('Mineral processing and recovery',100*.02-10*.16,.4,'0.4 t'),
]
for title,actual,expected,needle in examples:
    assert math.isclose(float(actual),expected,rel_tol=.001,abs_tol=.001),(title,actual,expected)
    assert needle in by_title[title]['example'],(title,needle)
assert {c['title'] for c in new} == {title for title, *_ in examples}
print(f'PASS: all 28 new lessons; {len(numeric)+len(structured)} independently solved quiz answers and {len(examples)} worked-example results.')
