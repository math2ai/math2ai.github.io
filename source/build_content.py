"""Build the canonical course data. Python standard library only."""
from pathlib import Path
import json, random, re
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
SOURCES = {
 'tensor': ['Introduction to Tensors, TensorFlow', 'https://www.tensorflow.org/guide/tensor'],
 'autocorrelation': ['Autocorrelation, NIST Engineering Statistics Handbook', 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35c.htm'],
 'autograd': ['Automatic differentiation, PyTorch', 'https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html'],
 'backprop': ['Learning representations by back-propagating errors, Rumelhart, Hinton and Williams, 1986', 'https://www.nature.com/articles/323533a0'],
 'mse': ['Mean squared error, PyTorch', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.MSELoss.html'],
 'autoencoder': ['Deep Learning, chapter 14: Autoencoders', 'https://www.deeplearningbook.org/contents/autoencoders.html'],
 'vq': ['Neural Discrete Representation Learning, van den Oord et al., 2017', 'https://arxiv.org/abs/1711.00937'],
 'attention': ['Attention Is All You Need, Vaswani et al., 2017', 'https://papers.nips.cc/paper/7181-attention-is-all-you-need'],
 'rlbook': ['Reinforcement Learning: Foundations, Mannor, Mansour and Tamar', 'https://sites.google.com/view/rlfoundations/home'],
 'sensing': ['Dynamic Sensing, Richman and Mannor, 2015', 'https://proceedings.mlr.press/v37/richman15.html'],
 'sensors': ['Sensor Selection for Crowdsensing Dynamical Systems, Schnitzler, Yu and Mannor, 2015', 'https://proceedings.mlr.press/v38/schnitzler15.html'],
 'rlhf': ['Training language models to follow instructions with human feedback, Ouyang et al., 2022', 'https://arxiv.org/abs/2203.02155'],
 'cuda': ['CUDA C++ Programming Guide, NVIDIA', 'https://docs.nvidia.com/cuda/cuda-c-programming-guide/'],
 'h100': ['H100 specifications, NVIDIA', 'https://www.nvidia.com/en-us/data-center/h100/'],
 'tsmc': ['About TSMC, Taiwan Semiconductor Manufacturing Company', 'https://www.tsmc.com/english/aboutTSMC'],
 'las': ['LAS format, U.S. Geological Survey', 'https://www.usgs.gov/programs/national-geological-and-geophysical-data-preservation-program/las-format'],
 'minerals': ['Mineral Resource Assessments, U.S. Geological Survey', 'https://www.usgs.gov/programs/mineral-resources-program/science/mineral-resource-assessments'],
 'assays': ['Analytical Chemistry, U.S. Geological Survey', 'https://www.usgs.gov/centers/gggsc/science/analytical-chemistry'],
 'grade': ['MapMark4: Probability calculations for mineral resource assessment, USGS', 'https://pubs.usgs.gov/tm/07/c15/tm7c15.pdf'],
 'core': ['Direct mineral content prediction from drill core images via transfer learning, 2024', 'https://arxiv.org/abs/2403.18495'],
 'linear': ['Deep Learning: Linear Algebra', 'https://www.deeplearningbook.org/contents/linear_algebra.html'],
 'probability': ['Deep Learning: Probability and Information Theory', 'https://www.deeplearningbook.org/contents/prob.html'],
 'numerical': ['Deep Learning: Numerical Computation', 'https://www.deeplearningbook.org/contents/numerical.html'],
 'montecarlo': ['Deep Learning: Monte Carlo Methods', 'https://www.deeplearningbook.org/contents/monte_carlo.html'],
 'neighbors': ['Nearest Neighbors, scikit-learn', 'https://scikit-learn.org/stable/modules/neighbors.html'],
 'trees': ['Decision Trees, scikit-learn', 'https://scikit-learn.org/stable/modules/tree.html'],
 'ensemble': ['Ensemble Methods, scikit-learn', 'https://scikit-learn.org/stable/modules/ensemble.html'],
 'metrics': ['Classification Metrics, scikit-learn', 'https://scikit-learn.org/stable/modules/model_evaluation.html'],
 'calibration': ['Probability Calibration, scikit-learn', 'https://scikit-learn.org/stable/modules/calibration.html'],
 'cnn': ['Convolutional Neural Networks, PyTorch', 'https://docs.pytorch.org/tutorials/beginner/blitz/neural_networks_tutorial.html'],
 'gnn': ['Semi-Supervised Classification with Graph Convolutional Networks, Kipf and Welling', 'https://arxiv.org/abs/1609.02907'],
 'contrastive': ['A Simple Framework for Contrastive Learning of Visual Representations, Chen et al.', 'https://arxiv.org/abs/2002.05709'],
 'shift': ['A Theory of Learning from Different Domains, Ben-David et al.', 'https://research.google/pubs/a-theory-of-learning-from-different-domains/'],
 'active': ['Active Learning Literature Survey, Burr Settles', 'https://burrsettles.com/pub/settles.activelearning.pdf'],
 'causal': ['Causal Inference in Statistics: An Overview, Judea Pearl', 'https://ftp.cs.ucla.edu/pub/stat_ser/r350-reprint.pdf'],
 'diffusion': ['Denoising Diffusion Probabilistic Models, Ho et al.', 'https://arxiv.org/abs/2006.11239'],
 'experts': ['Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer, Shazeer et al.', 'https://arxiv.org/abs/1701.06538'],
 'cache': ['How Caching Works, Hugging Face Transformers', 'https://huggingface.co/docs/transformers/en/cache_explanation'],
 'distillation': ['Distilling the Knowledge in a Neural Network, Hinton et al.', 'https://arxiv.org/abs/1503.02531'],
 'qc': ['Quality Assurance and Quality Control, USGS', 'https://www.usgs.gov/centers/columbia-environmental-research-center/science/quality-assurance-and-quality-control'],
 'spatial': ['Cross-validation Strategies for Data with Spatial Structure, Roberts et al.', 'https://doi.org/10.1111/ecog.02881'],
 'kriging': ['Understanding Ordinary Kriging, ArcGIS Pro', 'https://pro.arcgis.com/en/pro-app/3.6/help/analysis/geostatistical-analyst/understanding-ordinary-kriging.htm'],
 'recovery': ['Mass Balancing of Concentrator Data, Metso', 'https://www.metso.com/insights/blog/mining-and-metals/mass-balancing-of-concentrator-data/'],
 'opensource': ['The Open Source Definition, Open Source Initiative', 'https://opensource.org/osd'],
}

def sources_for(i):
    specific = {7:['tensor'],55:['autocorrelation'],31:['mse'],38:['autograd'],49:['autoencoder'],50:['autoencoder'],
     52:['vq'],53:['vq'],54:['vq'],56:['attention'],57:['attention'],58:['attention'],59:['attention'],60:['attention'],
     65:['sensors'],66:['sensors'],67:['rlbook'],68:['rlbook'],69:['rlbook'],70:['rlbook'],71:['rlbook'],72:['rlbook'],73:['rlbook'],74:['rlbook'],
     75:['rlhf'],76:['rlbook'],78:['sensing'],83:['h100'],84:['cuda'],87:['h100'],88:['cuda'],89:['tsmc'],90:['las','assays'],93:['minerals'],95:['opensource'],96:['grade','core']}
    specific.update({101: ['probability'], 102: ['probability'], 103: ['linear'], 104: ['linear'], 105: ['probability'], 106: ['montecarlo'], 107: ['numerical'], 108: ['numerical'], 109: ['neighbors'], 110: ['trees'], 111: ['ensemble'], 112: ['ensemble'], 113: ['metrics'], 114: ['calibration'], 115: ['cnn'], 116: ['gnn'], 117: ['contrastive'], 118: ['shift'], 119: ['active'], 120: ['causal'], 121: ['diffusion'], 122: ['experts'], 123: ['cache'], 124: ['distillation'], 125: ['qc'], 126: ['spatial'], 127: ['kriging'], 128: ['recovery']})
    if i == 38: specific[i] = ['backprop','autograd']
    return [dict(title=SOURCES[k][0],url=SOURCES[k][1]) for k in specific.get(i,[])]

LEGACY_IDS = json.loads((ROOT/'concept-ids.json').read_text(encoding='utf-8'))
retry_feedback = {}
for line in (ROOT/'retry-feedback.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('## '):
        feedback_title = line[3:]
        assert feedback_title not in retry_feedback, feedback_title
        retry_feedback[feedback_title] = []
    elif line.strip() and not line.startswith('#'):
        retry_feedback[feedback_title].append(line.strip())
readings = json.loads((ROOT/'reading-links.json').read_text(encoding='utf-8'))
# Nine authored additions per concept; the original question remains in the bank.
bank = {}
for line in (ROOT/'question-bank.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('## '):
        bank_title = line[3:]
        assert bank_title not in bank, bank_title
        bank[bank_title] = []
    elif line.strip() and not line.startswith('#'):
        fields = [part.strip() for part in line.split('|')]
        assert len(fields) == 3, line
        question, choices, feedback = fields
        options = [part.strip() for part in choices.split('~')]
        assert len(options) == len(set(options)) == 4 and all(options), line
        assert question and feedback, line
        bank[bank_title].append(dict(question=question, options=options, feedback=feedback))
course=[]; chapters=[]
for line in (ROOT/'curriculum-source.txt').read_text(encoding='utf-8').splitlines():
    if line.startswith('# Chapter'):
        chapter=line.split('. ',1)[1]
        chapters.append({'title':chapter,'start':len(course)+1})
    elif line and not line.startswith('#'):
        fields=[x.strip().replace('\\n','\n') for x in line.split('|')]
        assert len(fields) in (8,9),(len(course)+1,fields)
        title,definition,formula,example,metaphor,question,choices,feedback=fields[:8]
        formula_note = fields[8] if len(fields) == 9 else ""
        opts=[x.strip() for x in choices.split('~')]
        assert len(opts)==4 and len(set(opts))==4, title
        correct=opts[0]
        legacy_id=LEGACY_IDS[title]
        random.Random(7041+legacy_id-1).shuffle(opts)
        course.append(dict(id=len(course)+1,legacyId=legacy_id,chapter=chapter,title=title,definition=definition,formula=formula,formulaNote=formula_note,
         example=example,metaphor=metaphor,question=question,options=opts,correct=opts.index(correct),feedback=feedback,
         sources=sources_for(legacy_id)))
assert len(course)==128
assert set(LEGACY_IDS) == {c['title'] for c in course}
assert set(bank) == {c['title'] for c in course}
assert set(retry_feedback) == set(bank)
assert set(readings) == set(bank)
# Rewritten banks use fresh question IDs so obsolete answers do not mark new content complete.
QUESTION_REVISIONS = {90:2, 91:2, 92:2, 93:2, 94:2, 96:2, 99:2, 100:2}
for c in course:
    prefix = str(c['legacyId'])
    if c['legacyId'] in QUESTION_REVISIONS:
        prefix += f"-r{QUESTION_REVISIONS[c['legacyId']]}"
    additions = bank[c['title']]
    assert len(additions) == 9, (c['title'], len(additions))
    c['questions'] = [dict(id=f"{prefix}-01", **{k:c[k] for k in ('question','options','correct','feedback')})]
    for number, entry in enumerate(additions, 2):
        options = entry['options'][:]
        correct = options[0]
        random.Random(7041 + c['legacyId'] * 100 + number).shuffle(options)
        c['questions'].append(dict(id=f"{prefix}-{number:02}", question=entry['question'],
            options=options, correct=options.index(correct), feedback=entry['feedback']))
    assert len({q['question'].casefold() for q in c['questions']}) == 10, c['title']
    hints = retry_feedback[c['title']]
    assert len(hints) == 10, (c['title'], len(hints))
    for q, hint in zip(c['questions'], hints):
        assert len(hint.split()) >= 12 and hint != q['feedback'], q['id']
        q['retryFeedback'] = hint
    article = readings[c['title']]
    assert isinstance(article,str) and article and not any(ch in article for ch in '<>"\\ '), c['title']
    c['sources'] = [dict(title=unquote(article).replace('_',' ').replace('#',': ') + ', Wikipedia', label='Wikipedia',
        url='https://en.wikipedia.org/wiki/' + article)] + c['sources']
    seen = set()
    c['sources'] = [s for s in c['sources'] if not (s['url'] in seen or seen.add(s['url']))]
    for s in c['sources']:
        if 'label' not in s:
            host = s['url'].split('/')[2]
            s['label'] = ('Paper' if host in ('arxiv.org','papers.nips.cc','proceedings.mlr.press','doi.org','www.nature.com') else
                'Textbook' if 'deeplearningbook' in host or 'rlfoundations' in s['url'] else
                'USGS' if 'usgs.gov' in host else 'NVIDIA' if 'nvidia.com' in host else
                'Documentation' if host.startswith(('docs.','scikit-learn.','www.tensorflow.','huggingface.')) else 'Reading')
    # Distinguish multiple sources of the same type without adding a visible section heading.
    for label in {s['label'] for s in c['sources']}:
        matches = [s for s in c['sources'] if s['label'] == label]
        if len(matches) > 1:
            for s in matches: s['label'] = s['title'].split(',')[0]
assert not any('—' in json.dumps(c,ensure_ascii=False) for c in course)
payload={'version':'2.0','title':'math2ai','chapters':chapters,'concepts':course,
 'previousOrder':json.loads((ROOT/'previous-order.json').read_text(encoding='utf-8')),
 'subtitle': 'From mathematics to AI, one concept at a time.',
 'sources':[dict(title=v[0],url=v[1]) for v in SOURCES.values()]}
(ROOT/'dist').mkdir(exist_ok=True)
(ROOT/'dist/curriculum.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
print(f"Built {len(course)} concepts and {sum(len(c['questions']) for c in course)} questions.")
