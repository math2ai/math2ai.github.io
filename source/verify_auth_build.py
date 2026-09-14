"""Check configured/unconfigured builds and reject privileged browser credentials."""
from pathlib import Path
import base64, hashlib, json, re, shutil, subprocess, sys, tempfile

root=Path(__file__).resolve().parent
config={'supabaseUrl':'https://example.supabase.co','publishableKey':'sb_publishable_test_only'}
assert hashlib.sha256((root/'vendor/supabase-2.105.0.js').read_bytes()).hexdigest()=='24e8c00dc25da420ee741068b60bcdb5f62cb3598d8834058acf37ec6ee1a724'
with tempfile.TemporaryDirectory(prefix='math2ai-auth-build-') as folder:
 stage=Path(folder)/'source'
 shutil.copytree(root,stage,ignore=shutil.ignore_patterns('__pycache__'))
 def build(values):
  (stage/'auth-config.json').write_text(json.dumps(values),encoding='utf-8')
  return subprocess.run([sys.executable,str(stage/'build_site.py')],capture_output=True,text=True)
 for values in [{'supabaseUrl':'','publishableKey':''},config]:
  result=build(values);assert result.returncode==0,result.stderr
  html=(stage/'dist/index.html').read_text(encoding='utf-8')
  assert not re.search(r'/\*(?:AUTH|GOOGLE|COURSE|PROGRESS)_\w+\*/',html)
  embedded=json.loads(re.search(r'id="auth-config">(.*?)</script>',html,re.S).group(1))
  assert embedded==values
  for identifier in re.findall(r"el\('([^']+)'\)",(stage/'auth.js').read_text(encoding='utf-8')):
   assert f'id="{identifier}"' in html,identifier
  assert html.index('window.math2aiProgress =')<html.index('Capture OAuth parameters')<html.index('const requestedIndex = hashIndex()')
  assert 'data:image/png;base64,'+base64.b64encode((stage/'assets/google-signin.png').read_bytes()).decode('ascii') in html
  assert '<script src=' not in html
  assert ((stage/'vendor/supabase-2.105.0.js').read_text(encoding='utf-8') in html)==bool(values['supabaseUrl'])
 for changes in [
  {'publishableKey':'sb_secret_do_not_embed'}, {'publishableKey':'eyJhbGciOiJIUzI1NiJ9.service_role.signature'},
  {'publishableKey':''}, {'supabaseUrl':''}, {'supabaseUrl':'http://example.supabase.co'},
  {'supabaseUrl':'https://user:password@example.supabase.co'}, {'supabaseUrl':'https://example.supabase.co/path'},
  {'supabaseUrl':'https://example.supabase.co?token=secret'}, {'serviceRoleKey':'anything'},
  {'publishableKey':'sb_publishable_</script>'}
 ]:
  assert build(config|changes).returncode!=0,changes
print('PASS: pinned SDK integrity; configured and guest-only builds; embedded auth assets; callback ordering; privileged/malformed configuration rejected.')
