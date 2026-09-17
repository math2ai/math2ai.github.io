"""Explicit prerequisite links for the editorial follow-up, not a pedagogy classifier."""
from pathlib import Path
import json
import math
import re

root = Path(__file__).resolve().parent
course = json.loads((root/'dist/curriculum.json').read_text(encoding='utf-8'))
review = json.loads((root/'prerequisite-review.json').read_text(encoding='utf-8'))
concepts = {c['legacyId']: c for c in course['concepts']}
questions = {q['id']: (c, q) for c in course['concepts'] for q in c['questions']}
assert review['reviewedConceptIds'] == [c['legacyId'] for c in course['concepts']]
assert review['reviewedQuestionIds'] == list(questions)
assert len(concepts) == 128 and len(questions) == 1280
assert len({r['conceptId'] for r in review['lessonChanges']}) == len(review['lessonChanges'])
assert len({r['questionId'] for r in review['questionChanges']}) == len(review['questionChanges'])
assert all(r['questionId'] in questions for r in review['questionChanges'])

# Each assessed term/rule must be present in actual teaching no later than the
# question's concept. A hint, answer explanation or another quiz is not searched.
dependencies = [
 ('6-06',6,r'entrywise addition'), ('6-07',6,r'every entry'),
 ('11-10',6,r'diagonal entries'), ('12-03',12,r'affine map'),
 ('104-04',104,r'rank at most k'), ('104-09',104,r'low-rank approximation'),
 ('104-01',104,r'largest k singular values'), ('104-05',104,r'nonnegative scale factors'),
 ('104-08',104,r'V give perpendicular \(orthogonal\) input directions'),
 ('14-04',14,r'independent trials'), ('101-10',101,r'posterior'),
 ('18-07',18,r'logarithm requires a positive input'),
 ('19-06',19,r'global minimum'), ('20-07',19,r'zero derivative alone'),
 ('108-05',108,r'classification inconclusive'), ('107-10',107,r'inequality constraints'),
 ('29-03',29,r'classification predicts a category'), ('28-04',28,r'window is'),
 ('110-05',110,r'axis-aligned split'), ('113-05',113,r'false positive.*negative case predicted positive'),
 ('120-04',120,r'only one can be observed'), ('40-02',40,r'ceiling rounds up'),
 ('115-07',115,r'receptive field'), ('116-06',116,r'one hop is one edge'),
 ('47-07',47,r'unit vector has length 1'), ('117-09',47,r'dividing it by its norm'),
 ('117-03',117,r'augmentation creates'), ('48-03',48,r'projected coordinate.*dot product'),
 ('80-07',80,r'overflow means'), ('53-01',53,r'straight-through estimator.*approximation'),
 ('53-04',53,r'selection jumps'), ('58-01',58,r'projection is a learned matrix transformation'),
 ('58-03',58,r'concatenation joins'), ('59-04',59,r'residual connection adds'),
 ('59-03',59,r'separately for each token'), ('59-08',59,r'feed-forward network \(FFN\)'),
 ('81-04',81,r'core is an execution unit'), ('85-01',85,r'optimizer state'),
 ('86-04',86,r'memory-bound'), ('125-02',125,r'blank.*negligible target material'),
 ('125-04',125,r'duplicate analyses.*repeatability'), ('93-r2-03',93,r'coordinate reference system defines'),
 ('126-10',126,r'each split is a fold'),
]
for qid, cid, pattern in dependencies:
    taught = concepts[cid]
    assessed, _ = questions[qid]
    assert taught['id'] <= assessed['id'], (qid, cid, 'prerequisite moved after assessment')
    body = '\n'.join(taught.get(field,'') for field in ('definition','formula','formulaNote'))
    assert re.search(pattern, body, re.I|re.S), (qid, cid, pattern)

# Standalone questions include the operational premise before the first try.
premises = {
 '106-03': ['Standard error describes', '1/√n'],
 '106-08': ['variation across repeated estimates', 's/√n'],
 '117-07': ['divided by a positive temperature', 'decreasing τ'],
 '110-07': ['class fractions', '1−Σpᵢ²'],
 '113-04': ['always predicts negative', 'actual positive'],
 '121-05': ['xₜ=√ᾱ x₀+√(1−ᾱ)ε', 'ᾱ=0'],
 '124-06': ['T > 0', 'softmax(z/T)'],
 '104-09': ['discards the second', 'task needs information from the second'],
}
for qid, fragments in premises.items():
    assert all(s in questions[qid][1]['question'] for s in fragments), qid
assert 'fine-tuning' not in questions['118-04'][1]['question'].lower()

# Independently solve the changed Q-learning exercise and temperature behavior.
q = questions['72-10'][1]
assert [i for i, option in enumerate(q['options']) if float(option) == max(2,5)] == [q['correct']]
def softmax(scores, temperature):
    weights = [math.exp(z/temperature) for z in scores]
    return [w/sum(weights) for w in weights]
for logits in ([0,2], [-3,1,4], [6,1,2,0]):
    equal = 1/len(logits)
    deviations = [sum((p-equal)**2 for p in softmax(logits,t)) for t in [1,2,4,8]]
    assert all(a>b for a,b in zip(deviations,deviations[1:]))
q = questions['124-06'][1]
assert q['options'][q['correct']] == 'Probabilities move closer to an equal distribution'
print(f'PASS: 128 lessons/1,280 questions recorded; {len(dependencies)} teaching-before-assessment links; standalone premises and revised calculations.')
