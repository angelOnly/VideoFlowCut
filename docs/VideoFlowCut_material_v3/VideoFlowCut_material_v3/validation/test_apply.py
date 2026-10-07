import importlib.util,json,shutil,tempfile,unittest
from pathlib import Path
PACKAGE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patcher',PACKAGE/'apply_changes.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class ApplyTests(unittest.TestCase):
 def setUp(self):
  self.tmp=Path(tempfile.mkdtemp());self.repo=self.tmp/'repo';self.repo.mkdir()
  self.package=self.tmp/'package';(self.package/'patches').mkdir(parents=True);(self.package/'new').mkdir()
  (self.repo/'test.md').write_text('header\nOLD\ntail\n')
  (self.package/'patches/old.md').write_text('OLD');(self.package/'patches/new.md').write_text('NEW')
  (self.package/'new/a.md').write_text('new file\n')
  self.m={'changes':[{'id':'X','path':'test.md','before_file':'patches/old.md','after_file':'patches/new.md'}], 'new_files':[{'path':'refs/a.md','content_file':'new/a.md'}]}
  self.save();self.previous=a.PACKAGE;a.PACKAGE=self.package
 def save(self):(self.package/'patches/manifest.json').write_text(json.dumps(self.m))
 def tearDown(self):a.PACKAGE=self.previous;shutil.rmtree(self.tmp)
 def test_dry_run_no_writes(self):
  a.run(self.repo);self.assertEqual((self.repo/'test.md').read_text(),'header\nOLD\ntail\n');self.assertFalse((self.repo/'refs').exists())
 def test_apply_and_idempotent(self):
  a.run(self.repo,True);self.assertEqual((self.repo/'test.md').read_text(),'header\nNEW\ntail\n');r=a.run(self.repo,True);self.assertEqual(r['message'],'Already applied; no files changed')
 def test_conflict_preflight_no_partial_writes(self):
  (self.repo/'refs').mkdir();(self.repo/'refs/a.md').write_text('different');self.assertRaises(ValueError,a.run,self.repo,True);self.assertIn('OLD',(self.repo/'test.md').read_text())
 def test_unrelated_local_changes_preserved(self):
  (self.repo/'test.md').write_text('user additions\nOLD\nlocal tail');a.run(self.repo,True);self.assertEqual((self.repo/'test.md').read_text(),'user additions\nNEW\nlocal tail')
 def test_crlf_bom_preserved(self):
  (self.repo/'test.md').write_bytes(b'\xef\xbb\xbfheader\r\nOLD\r\ntail\r\n');a.run(self.repo,True);self.assertEqual((self.repo/'test.md').read_bytes(),b'\xef\xbb\xbfheader\r\nNEW\r\ntail\r\n')
 def test_duplicate_anchor_stops(self):
  (self.repo/'test.md').write_text('OLD\nOLD');self.assertRaises(ValueError,a.run,self.repo,True)
 def test_path_escape_stops(self):
  self.m['new_files'][0]['path']='../outside';self.save();self.assertRaises(ValueError,a.run,self.repo,True)
 def test_insertion_idempotent(self):
  (self.package/'patches/new.md').write_text('OLD\ninserted');a.run(self.repo,True);a.run(self.repo,True);self.assertEqual((self.repo/'test.md').read_text().count('inserted'),1)
 def test_symlink_refused(self):
  (self.repo/'test.md').unlink();other=self.tmp/'other';other.write_text('OLD');(self.repo/'test.md').symlink_to(other);self.assertRaises(ValueError,a.run,self.repo,True)
if __name__=='__main__':unittest.main(verbosity=2)
