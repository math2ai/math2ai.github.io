"""Create a self-contained index.html, requiring no server or build tools to use."""
from pathlib import Path
import base64, json, re, subprocess
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parent
config=json.loads((ROOT/'auth-config.json').read_text(encoding='utf-8'))
if set(config) != {'supabaseUrl','publishableKey'} or not all(isinstance(v,str) for v in config.values()):
 raise ValueError('auth-config.json must contain only supabaseUrl and publishableKey strings.')
enabled=bool(config['supabaseUrl'] or config['publishableKey'])
if enabled:
 url=urlsplit(config['supabaseUrl'])
 if url.scheme!='https' or not url.hostname or url.username or url.password or url.path not in ('','/') or url.query or url.fragment:
  raise ValueError('supabaseUrl must be the HTTPS project URL with no credentials, query, or extra path.')
 if not re.fullmatch(r'sb_publishable_[A-Za-z0-9_-]+',config['publishableKey']):
  raise ValueError('Use a Supabase publishable key (sb_publishable_...), never a secret or service-role key.')
 config['supabaseUrl']=config['supabaseUrl'].rstrip('/')
# KaTeX runs only during this build; the browser receives HTML, CSS and fonts.
try:
 result=subprocess.run(['node',str(ROOT/'build_math.mjs')],capture_output=True,text=True,encoding='utf-8',check=True)
except FileNotFoundError as exc:
 raise RuntimeError('Node.js is required to build the mathematical notation. The published page needs no KaTeX JavaScript or installation.') from exc
except subprocess.CalledProcessError as exc:
 raise RuntimeError('Mathematical typesetting failed: '+exc.stderr) from exc
math=json.loads(result.stdout)
html=(ROOT/'site-template.html').read_text(encoding='utf-8')
html=html.replace('/*MATH_CSS*/',math['css'])
html=html.replace('/*MATH_DATA*/',json.dumps(math['data'],ensure_ascii=False).replace('</','<\\/'))
html=html.replace('/*MATH_JS*/',(ROOT/'math-display.js').read_text(encoding='utf-8'))
logo=base64.b64encode((ROOT/'assets/math2ai-logo.png').read_bytes()).decode('ascii')
html=html.replace('/*COURSE_LOGO*/','data:image/png;base64,'+logo)
button=base64.b64encode((ROOT/'assets/google-signin.png').read_bytes()).decode('ascii')
html=html.replace('/*GOOGLE_BUTTON*/','data:image/png;base64,'+button)
html=html.replace('/*AUTH_CONFIG*/',json.dumps(config).replace('</','<\\/'))
sdk=(ROOT/'vendor/supabase-2.105.0.js').read_text(encoding='utf-8') if enabled else ''
assert '</script' not in sdk.lower(), 'SDK must be safe to embed in a script element.'
html=html.replace('/*AUTH_SDK*/',sdk)
html=html.replace('/*PROGRESS_JS*/',(ROOT/'progress.js').read_text(encoding='utf-8'))
html=html.replace('/*AUTH_JS*/',(ROOT/'auth.js').read_text(encoding='utf-8'))
html=html.replace('/*COURSE_CSS*/',(ROOT/'site.css').read_text(encoding='utf-8'))
html=html.replace('/*CONCEPT_MENU_JS*/',(ROOT/'concept-menu.js').read_text(encoding='utf-8'))
html=html.replace('/*LEARNING_JS*/',(ROOT/'learning.js').read_text(encoding='utf-8'))
html=html.replace('/*COURSE_JS*/',(ROOT/'site.js').read_text(encoding='utf-8'))
html=html.replace('/*COURSE_DATA*/',(ROOT/'dist/curriculum.json').read_text(encoding='utf-8').replace('</','<\\/'))
(ROOT/'dist/index.html').write_text(html, encoding='utf-8')
print('Built self-contained static index.html')
