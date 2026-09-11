from pathlib import Path
import json, math, re
root=Path(__file__).resolve().parent
course=json.loads((root/'dist/curriculum.json').read_text())
cs=course['concepts'];assert len(cs)==100
legacy={c['legacyId']:c for c in cs}
assert sorted(legacy)==list(range(1,101))
for i,c in enumerate(cs,1):
 assert c['id']==i
 assert len(c['options'])==len(set(c['options']))==4
 assert 0<=c['correct']<4
 for field in ['title','definition','formula','example','metaphor','question','feedback']:
  assert c[field].strip(),(i,field)
 assert all(s['url'].startswith('https://') for s in c['sources'])
# Independently solved literal quiz results, rather than copying the answer key.
numeric={2:2*4+1,4:5*6,7:[[[1,2],[3,4]],[[5,6],[7,8]]][1][1][0],8:sum(i*i for i in range(1,4)),9:1*3+4*2,
 13:math.hypot(4-1,5-1),16:8*.25,17:((1-3)**2+(5-3)**2)/2,18:3,19:2*4,
 21:2*(3*2)*3,22:4*5,23:min(range(4),key=lambda x:(x-5)**2),24:4-.1*6,
 26:(14-10)/2,30:2*5+3,31:(1**2+3**2)/2,33:2*3-1*4+1,34:1/(1+math.exp(0)),35:max(0,-2)+max(0,3),
 39:(2+6)/2,40:2*(120/30),44:.9,47:0,52:2,57:.25*2+.75*6,61:.4*.5,
 65:8+4-3,68:1+.5*4,70:(4+8)/2,71:3+.5*4,72:1+.5*6,74:.8*4+.2*1,
 79:2**4,80:abs(2.718-2.72),83:2*3+4,84:8*128,86:20/200}
for i,expected in numeric.items():
 c=legacy[i];answer=c['options'][c['correct']]
 result=float(re.match(r'-?[\d.,]+',answer).group().replace(',',''))
 assert math.isclose(result,expected,abs_tol=1e-12),(i,result,expected)
shapes={5:'(6, 15)',6:'3',10:'2 × 4',11:'A 5 × 2 matrix',14:'1/3',15:'3/4',20:'(4, 6)',25:'20 × 4',43:'(0.5, 0.5)'}
for i,expected in shapes.items():assert legacy[i]['options'][legacy[i]['correct']]==expected
html=(root/'dist/index.html').read_text()
assert '<script src=' not in html and '<link rel="stylesheet"' not in html
assert '/*COURSE_' not in html
assert json.loads(re.search(r'<script type="application/json" id="course-data">(.*?)</script>',html,re.S).group(1))==course
for identifier in re.findall(r"el\('([^']+)'\)", (root/'site.js').read_text()):
 assert ('id="'+identifier+'"') in html, identifier
assert 'fetch(' not in (root/'site.js').read_text()
print(f'PASS: 100 complete concepts and single-answer questions; {len(numeric)+len(shapes)} independently calculated answers; embedded data and assets consistent.')

positions={c['title']:c['id'] for c in cs}
chains=[
 ['Derivative','Gradient','Chain rule','Backpropagation'],
 ['Linear regression','Mean squared error','Supervised learning'],
 ['Parameter and hyperparameter','Training, validation and test','Data leakage','Normalization'],
 ['Artificial neuron','ReLU','Forward pass','Backpropagation','Mini-batch gradient descent','Epoch','Deep neural network'],
 ['Deep neural network','Overfitting','Regularization'],
 ['Embedding','Autoencoder','Latent space and bottleneck','Rate-distortion tradeoff','Vector quantization','Token and vocabulary','Vector-quantized autoencoder'],
 ['Bit and byte','Numerical precision','Rate-distortion tradeoff'],
 ['Token and vocabulary','Sequence and autocorrelation','Autoregressive language model','Causal mask','Transformer'],
 ['Softmax','Scaled dot-product attention','Multi-head attention','Causal mask'],
 ['Positional encoding','Scaled dot-product attention'],
 ['API and SDK','Tool calling','OSDU Data Platform'],
 ['State, observation and action','Dynamical system','Markov decision process','Reward and return','Policy','Value function','Bellman equation','Exploration and exploitation','Q-learning','Policy gradient','Model-based RL','Safety constraint','Model predictive control','RLHF'],
 ['Fine-tuning','RLHF'],
 ['Bit and byte','Memory capacity','Memory bandwidth','H100','Compute cluster'],
 ['Numerical precision','GPU','Tensor core','H100'],
 ['Well log and LAS','Windowing and missing data','Provenance and uncertainty','OSDU Data Platform','Open source and reproducibility','Representation alignment','Sememe.ai framework','Benchmark and ablation','Forward-deployed engineering','Grounded model conversation']
]
for chain in chains:
 assert all(positions[a]<positions[b] for a,b in zip(chain,chain[1:])),chain
print('PASS: prerequisite order across mathematics, training, representations, language, control, computing, and application.')
