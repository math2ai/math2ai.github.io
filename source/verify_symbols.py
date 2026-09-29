"""Keep the manual notation review current; this is not an automatic pedagogy judge."""
import hashlib, json, math
from pathlib import Path

root=Path(__file__).resolve().parent
course=json.loads((root/'dist/curriculum.json').read_text(encoding='utf-8'))
review=json.loads((root/'symbol-review.json').read_text(encoding='utf-8'))
concepts={c['legacyId']:c for c in course['concepts']}
assert [r['conceptId'] for r in review['concepts']]==list(concepts)
assert len(concepts)==138
for record in review['concepts']:
    c=concepts[record['conceptId']]
    assert record['title']==c['title']
    fields={f:c.get(f,'') for f in ('definition','formula','formulaNote','example')}
    digest=hashlib.sha256(json.dumps(fields,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
    assert digest==record['teachingSha256'], (c['title'],'Teaching changed: re-review its notation and update symbol-review.json')

# This chain-rule formula only describes the explicitly taught scalar model and
# squared-error loss. Check it independently, including negative and zero inputs.
lesson=concepts[38]
assert 'ŷ = wx' in lesson['definition'] and 'L = (ŷ − y)²' in lesson['definition']
assert lesson['formula']=='∂L/∂w = (∂L/∂ŷ)(∂ŷ/∂w) = 2(ŷ − y)x'
for x in (-3,0,2,4):
    for w in (-2,0,1):
        for target in (-1,3,6):
            loss=lambda weight:(weight*x-target)**2
            epsilon=1e-5
            measured=(loss(w+epsilon)-loss(w-epsilon))/(2*epsilon)
            predicted=2*(w*x-target)*x
            assert math.isclose(measured,predicted,rel_tol=1e-8,abs_tol=1e-8)
assert 2*(1*2-6)*2==-16
assert ((1+.01)*2-6)**2<(1*2-6)**2
print('PASS: all 138 lessons have a current notation review; backpropagation matches its stated model and loss across 36 independent cases.')
