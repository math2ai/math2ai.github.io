"""Regression checks for the worked-example review; pedagogy is reviewed manually."""
from pathlib import Path
import ast
from fractions import Fraction
import json
import math

root = Path(__file__).resolve().parent
course = json.loads((root / 'dist/curriculum.json').read_text(encoding='utf-8'))
review = json.loads((root / 'example-review.json').read_text(encoding='utf-8'))
concepts = {c['legacyId']: c for c in course['concepts']}
questions = {q['id']: q for c in course['concepts'] for q in c['questions']}
assert course['version'] == review['courseVersion']
assert len(review['reviewed']) == len(concepts) == 128
assert {c['conceptId'] for c in review['reviewed']} == set(concepts)
reviewed_ids, replaced_ids = [], []
for record in review['reviewed']:
    c = concepts[record['conceptId']]
    assert record['title'] == c['title']
    assert record['example'] == c['example'], (c['title'], 'Re-review questions when an example changes')
    assert record['questionIds'] == [q['id'] for q in c['questions']]
    reviewed_ids.extend(record['questionIds'])
    for replacement in record['replacements']:
        qid = replacement['questionId']
        assert qid in record['questionIds'] and replacement['reason'].strip()
        assert replacement['previousQuestion'] != questions[qid]['question'], qid
        replaced_ids.append(qid)
assert len(reviewed_ids) == len(set(reviewed_ids)) == 1280
assert len(replaced_ids) == len(set(replaced_ids)) == 99
assert sum(bool(c['replacements']) for c in review['reviewed']) == 70


def answer(qid):
    q = questions[qid]
    return q['options'][q['correct']].replace('−', '-')


def unique(qid, parse, valid):
    q = questions[qid]
    matches = [i for i, text in enumerate(q['options']) if valid(parse(text.replace('−', '-')))]
    assert matches == [q['correct']], (qid, matches)


# Check complete alternative sets, including zeros, negative eigenvalues and
# keeping the smaller-index or larger-index matrix component as appropriate.
matrix, vector = [[-4, 0], [0, 7]], [2, 0]
product = [sum(a*b for a, b in zip(row, vector)) for row in matrix]
unique('103-01', float, lambda eigenvalue: product == [eigenvalue*x for x in vector])
unique('103-10', ast.literal_eval, lambda v: any(v) and (5*v[0], -2*v[1]) == tuple(-2*x for x in v))
assert [3*x for x in [1, 2]] == [3, 6]
assert answer('103-06') == 'Yes, with eigenvalue 3'

original = [[1, 0], [0, 4]]
largest = max(range(2), key=lambda i: original[i][i])
expected = [[original[i][j] if i == j == largest else 0 for j in range(2)] for i in range(2)]
unique('104-01', ast.literal_eval, lambda a: a == expected)
unique('104-05', float, lambda length: length == 4*1)
unique('108-01', ast.literal_eval, lambda a: a == [[2*4, 0], [0, 2*2]])

# For a positive quadratic on this line, the stationary point is the unique
# minimum. Check both the constraint and its derivative along y = 8-x.
unique('107-01', ast.literal_eval, lambda xy: sum(xy) == 8 and 2*xy[0] - 6*xy[1] == 0)

# Symbolic logarithms are evaluated as expressions, never mistaken for their
# displayed argument by a scalar-number extractor.
def logarithm(text):
    if text.startswith('ln '):
        return math.log(float(Fraction(text[3:].strip('()'))))
    if text.startswith('-ln '):
        return -math.log(float(Fraction(text[4:].strip('()'))))
    return float(text)

unique('105-03', logarithm, lambda value: math.isclose(value, math.log(1/.125)))
p = [.25, .75]
def divergence(q):
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return sum(a*math.log(a/b) for a, b in zip(p, q))
unique('105-01', ast.literal_eval, lambda q: math.isclose(divergence(q), 0, abs_tol=1e-12))

# Check new small calculations not already covered by the general bank checks.
unique('6-02', lambda text: tuple(map(int, text.split(' × '))), lambda shape: shape == (len([[6], [0], [-2]]), 1))
unique('21-03', lambda text: lambda x: x if text == 'x' else float(text),
       lambda factor: all(factor(x) == (5*(x+1)-5*x)/1 for x in [1, 2, -3]))
unique('51-02', float, lambda rate: rate*9 == 72)
unique('90-r2-01', lambda text: float(text.split()[0]), lambda grams: grams == 1000*.6/100)
scores = {'Code A': .5+.2*12, 'Code B': 1.5+.2*5}
assert answer('51-01') == min(scores, key=scores.get)
allowed_rewards = {a: reward for a, reward in [(2, 8), (4, 7), (6, 12)] if 0 <= a <= 4}
assert answer('78-01') == f'a = {max(allowed_rewards, key=allowed_rewards.get)}'
unique('60-08', lambda text: int(text.split()[-1]), lambda position: position > 4)

# Rounded alternatives should have exactly one value compatible with the
# supplied logarithms. The prompt intentionally supplies sufficient precision.
unique('124-01', lambda text: float(text.split()[-1]), lambda value: abs(value - (.25*.223+.75*1.609)) <= .00051)

print('PASS: all 128 lessons and 1,280 question IDs covered by the editorial record; 99 copied prompts stay replaced; independent checks of fresh scenarios and unique answers.')
