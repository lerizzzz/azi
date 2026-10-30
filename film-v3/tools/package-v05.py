from pathlib import Path
import zipfile
R=Path(__file__).resolve().parents[1];out=R.parent/'review-delivery/azi-lashes-v05-sources.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,6) as z:
 for p in R.rglob('*'):
  rel=p.relative_to(R)
  if not p.is_file() or any(x in {'node_modules','.remotion','out','build','recovery','decoded','validate','__pycache__','walk-sequence'} for x in rel.parts):continue
  if 'review' in rel.parts and p.suffix in {'.mp4','.png','.log','.headers','.zip'}:continue
  z.write(p,Path('azi-lashes-v05')/rel)
 for n in ['PRODUCTION_REQUIREMENTS_v03.md','SCREENPLAY_ALIENS_v03.md','PRODUCTION_REQUIREMENTS_v04.md','PRODUCTION_REQUIREMENTS_v05.md']:z.write(R.parent/'docs'/n,'docs/'+n)
print(out,out.stat().st_size)
