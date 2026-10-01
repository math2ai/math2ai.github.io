"""Check the separate authoring inventory; do not modify the published course."""
from pathlib import Path
import json
root=Path(__file__).parent
plan=json.loads((root/'curriculum-plan.json').read_text(encoding='utf-8'))
course=json.loads((root/'dist/curriculum.json').read_text(encoding='utf-8'))
entries=[c for chapter in plan['chapters'] for c in chapter['concepts']]
by_id={c['stableId']:c for c in entries}
assert len(entries)==len(by_id)==256
assert set(by_id)==set(range(1,257))
assert len({c['title'] for c in entries})==256
existing={c['stableId']:c['title'] for c in entries if c['status']=='existing'}
assert existing=={c['legacyId']:c['title'] for c in course['concepts']}
new=[c for c in entries if c['status']=='proposed']
assert len(new)==117 and all(c['handExample'].strip() for c in new)
assert {batch:sum(c['batch']==batch for c in new) for batch in ['linear-algebra','foundations','math-to-ai']}=={'linear-algebra':2,'foundations':51,'math-to-ai':64}
positions={c['stableId']:i for i,c in enumerate(entries)}
for first,second in plan['sequenceChecks']:
    assert positions[first]<positions[second], (by_id[first]['title'],by_id[second]['title'])
doc=(root/'CURRICULUM_256_PLAN.md').read_text(encoding='utf-8')
for i,c in enumerate(entries,1):
    assert f'| {i:03} | {c["title"]} | {c["stableId"]} |' in doc
assert course['version']=='2.0' and len(course['concepts'])==plan['currentCount']==139
print('PASS: 256 reserved identities; 139 live concepts; 117 proposed hand examples in 2/51/64 remaining batches; teaching-order constraints checked.')
