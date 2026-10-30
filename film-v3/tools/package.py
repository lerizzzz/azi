from pathlib import Path
import zipfile
R=Path(__file__).resolve().parents[1];out=R.parent/'review-delivery/azi-lashes-film-sources.zip'
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,6) as z:
 for p in R.rglob('*'):
  rel=p.relative_to(R)
  if not p.is_file() or any(d in {'node_modules','.remotion','out','build','recovery','decoded','__pycache__'} for d in rel.parts):continue
  if 'review' in rel.parts and p.suffix in {'.mp4','.png','.log','.headers'}:continue
  z.write(p,Path('film-v3')/rel)
 for name in ['PRODUCTION_REQUIREMENTS_v03.md','SCREENPLAY_ALIENS_v03.md']:z.write(R.parent/'docs'/name,'docs/'+name)
print(out,out.stat().st_size)
