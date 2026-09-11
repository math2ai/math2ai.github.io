"""Build the canonical course data. Python standard library only."""
from pathlib import Path
import json, random, re

ROOT = Path(__file__).resolve().parent
SOURCES = {
 'tensor': ['Introduction to Tensors, TensorFlow', 'https://www.tensorflow.org/guide/tensor'],
 'autocorrelation': ['Autocorrelation, NIST Engineering Statistics Handbook', 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda35c.htm'],
 'autograd': ['Automatic differentiation, PyTorch', 'https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html'],
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
 'australia': ['Australian National Offshore Wells Data Collection, Geoscience Australia', 'https://ecat.ga.gov.au/geonetwork/srv/api/records/afcaf460-6994-40f8-bc24-4a87c30d82ec?language=eng'],
 'nopims': ['NOPIMS, Geoscience Australia', 'https://www.ga.gov.au/nopims'],
 'osdu': ['The Open Group OSDU Forum', 'https://www.opengroup.org/osdu-forum/home'],
 'opensource': ['The Open Source Definition, Open Source Initiative', 'https://opensource.org/osd'],
}

def sources_for(i):
    specific = {7:['tensor'],55:['autocorrelation'],31:['mse'],38:['autograd'],49:['autoencoder'],50:['autoencoder'],
     52:['vq'],53:['vq'],54:['vq'],56:['attention'],57:['attention'],58:['attention'],59:['attention'],60:['attention'],
     65:['sensors'],66:['sensors'],67:['rlbook'],68:['rlbook'],69:['rlbook'],70:['rlbook'],71:['rlbook'],72:['rlbook'],73:['rlbook'],74:['rlbook'],
     75:['rlhf'],76:['rlbook'],78:['sensing'],83:['h100'],84:['cuda'],87:['h100'],88:['cuda'],89:['tsmc'],90:['las','australia','nopims'],93:['osdu'],95:['opensource']}
    return [dict(title=SOURCES[k][0],url=SOURCES[k][1]) for k in specific.get(i,[])]

LEGACY_IDS = json.loads((ROOT/'concept-ids.json').read_text())
course=[]; chapters=[]
for line in (ROOT/'curriculum-source.txt').read_text().splitlines():
    if line.startswith('# Chapter'):
        chapter=line.split('. ',1)[1]
        chapters.append({'title':chapter,'start':len(course)+1})
    elif line and not line.startswith('#'):
        fields=[x.strip().replace('\\n','\n') for x in line.split('|')]
        assert len(fields)==8,(len(course)+1,fields)
        title,definition,formula,example,metaphor,question,choices,feedback=fields
        opts=[x.strip() for x in choices.split('~')]
        assert len(opts)==4 and len(set(opts))==4, title
        correct=opts[0]
        legacy_id=LEGACY_IDS[title]
        random.Random(7041+legacy_id-1).shuffle(opts)
        course.append(dict(id=len(course)+1,legacyId=legacy_id,chapter=chapter,title=title,definition=definition,formula=formula,
         example=example,metaphor=metaphor,question=question,options=opts,correct=opts.index(correct),feedback=feedback,
         sources=sources_for(legacy_id)))
assert len(course)==100
assert not any('—' in json.dumps(c,ensure_ascii=False) for c in course)
payload={'version':'1.2','revisedQuestions':[7,77],'title':'Mathematics to Model Conversations','chapters':chapters,'concepts':course,
 'about': 'A cumulative course for Linus and other curious learners: 100 concepts, 100 worked examples, 100 metaphors, and 100 questions. Numerical examples are teaching examples, not measured project results. Mathematics uses real scalars unless stated otherwise. Bracketed inner lists denote matrix rows. Engineering concepts use operational calculations rather than invented mathematical definitions.',
 'context': 'The application follows Danny Castonguay’s description of Sememe.ai and the proposed Australian well-log demonstration for the Houston OSDU forum. Available prior context also describes work with his mentor Shie Mannor on computational models, sensing, and control. Retrieval did not recover the complete prior Australian autoencoder chat. Dataset choice, SDK methods, model architecture, and performance remain unverified here. The VQ-VAE pipeline is an educational candidate design, not a claim about the current implementation.',
 'background': 'Danny describes bld.ai as providing opportunity identification, product management, R&D, integration, and deployment for enterprises including BHP, BP, and Aramco; working with platforms such as DataRobot, Dataiku, and H2O; and collaborating on learning with Cohere. These are user-provided context, not independently audited case studies. The course uses that context to explain applied engineering, without claiming measured client outcomes.',
 'mentor': 'Shie Mannor, Yishay Mansour, and Aviv Tamar coauthored Reinforcement Learning: Foundations. Mannor’s work on sensing and dynamical systems provides relevant background for the control chapter. These sources do not establish endorsement of this course or of the proposed Sememe.ai design.',
 'sources':[dict(title=v[0],url=v[1]) for v in SOURCES.values()]}
(ROOT/'dist/curriculum.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(course)} concepts, each with four choices, one answer, and feedback.')
