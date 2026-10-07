from pathlib import Path
import importlib.util, tempfile, json, subprocess, sys, unittest, shutil
PACKAGE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('app',PACKAGE/'apply_changes.py'); app=importlib.util.module_from_spec(spec);spec.loader.exec_module(app)
MAN=json.loads((PACKAGE/'skill-edits/edits.json').read_text())
OLD=['sim-paper','smooth-relay','ticket-phone','product-fan','cover-flow','comment-focus']
def fixture(root):
 (root/'.agents/skills').mkdir(parents=True);(root/'package.json').write_text('{}')
 for e in MAN['edits']:
  p=root/e['path'];p.parent.mkdir(parents=True,exist_ok=True)
  if not p.exists():p.write_text('---\nname: fixture\ndescription: fixture\n---\n\n# Fixture\n\nExisting body.\n',encoding='utf8')
  if e['mode']=='replace_exact':p.write_text(p.read_text()+'\n'+e['old']+'\n',encoding='utf8')
 for c in OLD:
  p=root/'.agents/skills'/('motion-case-'+c)/'SKILL.md';p.parent.mkdir(parents=True,exist_ok=True);p.write_text('# Historical fixture\n')
class ApplyTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'repo';self.root.mkdir();fixture(self.root)
 def tearDown(self):self.tmp.cleanup()
 def run_apply(self,*args):return subprocess.run([sys.executable,str(PACKAGE/'apply_changes.py'),'--repo-root',str(self.root),*args],capture_output=True,text=True)
 def test_dry_run_does_not_write(self):
  before={p.relative_to(self.root).as_posix():p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
  r=self.run_apply();self.assertEqual(r.returncode,0,r.stderr);self.assertGreater(json.loads(r.stdout)['changedFileCount'],10)
  after={p.relative_to(self.root).as_posix():p.read_bytes() for p in self.root.rglob('*') if p.is_file()};self.assertEqual(before,after)
 def test_apply_is_idempotent_and_retains_history(self):
  r=self.run_apply('--apply');self.assertEqual(r.returncode,0,r.stderr)
  r=self.run_apply();self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(json.loads(r.stdout)['changedFileCount'],0)
  for c in OLD:self.assertEqual((self.root/'.agents/skills'/('motion-case-'+c)/'SKILL.md').read_text(),'# Historical fixture\n')
 def test_missing_anchor_aborts_all(self):
  p=self.root/'.agents/skills/motion-case-library/SKILL.md';p.write_text('# Changed\n')
  r=self.run_apply('--apply');self.assertEqual(r.returncode,2);self.assertFalse((self.root/'.agents/skills/_shared/TOPIC_TO_FILM.md').exists())
 def test_locally_edited_installed_block_is_not_overwritten(self):
  self.assertEqual(self.run_apply('--apply').returncode,0)
  p=self.root/'.agents/skills/production-director/SKILL.md';p.write_text(p.read_text().replace('## 主题驱动整片的默认生产正文','## Local edit'))
  self.assertEqual(self.run_apply('--apply').returncode,2);self.assertIn('## Local edit',p.read_text())
 def test_reference_validator_after_apply(self):
  r=self.run_apply('--apply');self.assertEqual(r.returncode,0,r.stderr)
  r=subprocess.run(['node',str(self.root/'scripts/check-topic-film-skills.mjs')],capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertEqual(json.loads(r.stdout)['failures'],[])
if __name__=='__main__':unittest.main(verbosity=2)
