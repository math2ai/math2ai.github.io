"""Independent calculations for the instructional-alignment corrections."""
from pathlib import Path
import ast
import json
import math
import re

root = Path(__file__).resolve().parent
course = json.loads((root / 'dist/curriculum.json').read_text(encoding='utf-8'))
questions = {q['id']: q for c in course['concepts'] for q in c['questions']}
checked = set()

def answer(qid):
    q = questions[qid]
    checked.add(qid)
    return q['options'][q['correct']].replace('−', '-')

def number(qid, expected):
    actual = float(re.match(r'-?\d+(?:\.\d+)?', answer(qid)).group())
    assert math.isclose(actual, expected, abs_tol=1e-12), (qid, actual, expected)

def unique(qid, parse, valid):
    q = questions[qid]
    matches = [i for i, text in enumerate(q['options']) if valid(parse(text.replace('−', '-')))]
    assert matches == [q['correct']], (qid, matches)
    checked.add(qid)

unique('3-10', lambda text: [int(x) for x in text.split(' and ')], lambda x: x[0] != x[1] and x[0]**2 == x[1]**2)
unique('7-07', ast.literal_eval, lambda shape: shape == (3, 4, 2))
unique('7-08', ast.literal_eval, lambda shape: math.prod(shape if isinstance(shape, tuple) else [shape]) != 2*3)
transpose = lambda a: [list(row) for row in zip(*a)]
unique('11-06', ast.literal_eval, lambda a: a == transpose(a))
a, b = [[1, 2], [3, 4]], [[2, 0], [0, 1]]
product = [[sum(x*y for x,y in zip(row, col)) for col in zip(*b)] for row in a]
unique('11-08', ast.literal_eval, lambda candidate: candidate == transpose(product))
unique('103-10', ast.literal_eval, lambda v: any(v) and (5*v[0], -2*v[1]) == tuple(-2*x for x in v))
unique('104-10', lambda text: [int(x) for x in re.findall(r'\d+', text)], lambda scales: scales == sorted([5, 2, 0], reverse=True)[1:])
number('16-06', .5*(2+4) + .5*0)
number('22-07', 2*2/2)
number('22-10', 3*2 + 1*4)
number('108-06', 4*3*2**2)
number('108-08', [[2,5],[5,8]][0][0])
# Evaluate the proposed derivative expressions at several points against the
# independently simplified polynomial (4x)^2 = 16x^2.
def polynomial(text, x):
    coefficient = int(re.search(r'\d+', text).group())
    return coefficient * x**(2 if '²' in text else 1)
q = questions['21-05']
assert [i for i, option in enumerate(q['options']) if all(polynomial(option, x) == 2*16*x for x in [0, 1, 2, -3])] == [q['correct']]
checked.add(q['id'])
data = [0,0,10,10]
mean = sum(data)/len(data)
sd = math.sqrt(sum((x-mean)**2 for x in data)/len(data))
number('26-06', len({(x-mean)/sd for x in data}))
assert answer('113-10') == 'Recall rose while precision fell'
assert 9/10 > 8/10 and 9/15 < 8/8
assert answer('114-05') == 'The 0.8 group'
assert abs(50/100-.8) > abs(20/100-.2)
number('114-08', (.8-1)**2)
number('115-10', len(set(range(1,4)) | set(range(2,5)) | set(range(3,6))))
assert answer('105-09') == 'Negative' and .25*math.log(.25/.5) < 0
number('45-08', [2,4,6,8][3])
number('48-03', sum(x*y for x,y in zip([3,4],[1,0])))
assert answer('50-04') == 'Code B' and 4*2 < 2*10
number('53-05', min([-3,0,4], key=lambda x: abs(-1.2-x)))
number('53-07', len({2,5}))
unique('65-08', int, lambda s: .5*s+2 == s)
number('68-10', max([.5,.9], key=lambda gamma: gamma*10))
number('71-07', .2*10 + .8*0)
number('72-01', -2+.9*10)
number('74-01', .7*6+.3*(-2))
number('74-09', .1*(-2))
number('77-02', 25-20+3)
# Simulate the specified interleaving: both read before either writes.
shared = 0
local_a, local_b = shared+1, shared+1
shared = local_a
shared = local_b
number('84-10', shared)
number('87-07', 75/500)
number('88-07', 2)
assert abs((2+8/10**12)-2) < 1e-10
unique('92-r2-04', float, lambda x: abs(x-10) > .5)
assert answer('127-05') == 'It becomes four times as large'
differences = [2,4]
semivariance = lambda values: sum(x*x for x in values)/(2*len(values))
assert semivariance([2*x for x in differences])/semivariance(differences) == 4
weights, values = [.25,.75], [2,6]
number('127-09', sum(w*(x+2) for w,x in zip(weights,values)) - sum(w*x for w,x in zip(weights,values)))

# The four previously lesson-dependent numerical prompts must carry their
# input data in the prompt sent to both lesson and review views.
context = {
    '7-01': ['[[2,8],[5,1]]', '[[9,4],[6,3]]', '(table, row, column)', 'start at 1'],
    '51-01': ['D + 0.2R', 'distortion 0.5', 'rate 12', 'distortion 1.5', 'rate 5'],
    '72-01': ['reward −2', 'γ = 0.9', 'Q value 10'],
    '74-01': ['probability 0.7', 'reward 6', 'reward −2'],
    '88-07': ['T(n) = 2 + 8/n'],
}
for qid, inputs in context.items():
    assert all(value in questions[qid]['question'] for value in inputs), qid

print(f'PASS: {len(checked)} revised calculations and answer sets; standalone inputs for tensor, rate-distortion, Q-learning, policy gradient, and cluster questions.')
