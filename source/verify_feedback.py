"""Structural/editorial guardrails for hints and small reading links."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent
course=json.loads((root/'dist/curriculum.json').read_text(encoding='utf-8'))
questions=[q for c in course['concepts'] for q in c['questions']]
assert len(questions)==1280
for q in questions:
    hint=q['retryFeedback']
    assert 12 <= len(hint.split()) <= 75, (q['id'],len(hint.split()))
    assert hint != q['feedback'],q['id']
    assert not re.search(r'(?:correct answer is|choose option|answer [ABCD] is)',hint,re.I),q['id']
    correct=q['options'][q['correct']]
    if len(correct)>18:
        assert correct.casefold() not in hint.casefold(),(q['id'],'hint copies the entire correct option')
for c in course['concepts']:
    assert c['sources'] and c['sources'][0]['label']=='Wikipedia',c['title']
    assert len({s['url'] for s in c['sources']})==len(c['sources'])
    assert all(s['label'] and s['title'] and s['url'].startswith('https://') for s in c['sources'])
html=(root/'dist/index.html').read_text(encoding='utf-8')
assert '<details id="concept-sources">' not in html
assert 'aria-label="Further reading"' in html
assert 'id="reset-question"' in html
print('PASS: 1,280 authored first-mistake explanations; no explicit answer labels or copied long options; direct reading links on all 128 concepts.')
