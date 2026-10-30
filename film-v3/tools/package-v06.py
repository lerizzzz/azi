"""Create download bundles. Never include the private original performance."""
from pathlib import Path
import hashlib,json,zipfile,shutil
R=Path(__file__).resolve().parents[1]
DEL=R.parent/'review-delivery'
DEL.mkdir(exist_ok=True)
SKIP={'node_modules','.remotion','out','build','private','recovery','decoded','validate','__pycache__','walk-sequence'}
def source_asset(rel):
    parts=rel.parts
    if parts[0]!='public':return True
    if len(parts)<3:return False
    if parts[1] in {'v05','v06','fonts','world','props'}:return True
    if parts[1]=='v04':return rel.name in {'studio-light.png','studio-dark.png'}
    return rel.as_posix()=='public/azi/canonical.png'
def checked_zip(path,entries):
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED,6) as z:
        for source,name in entries:z.write(source,name)
    with zipfile.ZipFile(path) as z:
        assert not any('private' in Path(n).parts for n in z.namelist())
        assert z.testzip() is None
    assert path.stat().st_size<100_000_000,(path,path.stat().st_size)
    return {'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'zip_crc':'passed'}
entries=[]
for p in sorted(R.rglob('*')):
    rel=p.relative_to(R)
    if not p.is_file() or any(x in SKIP for x in rel.parts):continue
    if not source_asset(rel):continue
    if rel.parts[0]=='review' and (rel.parts[1]!='v06' or p.suffix in {'.mp4','.png','.jpg','.log','.headers','.zip','.mp3'}):continue
    entries.append((p,str(Path('azi-lashes-v06')/rel)))
for p in sorted((R.parent/'docs').glob('*.md')):
    entries.append((p,str(Path('docs')/p.name)))
checks={}
name='azi-lashes-v06-sources.zip'
checks[name]=checked_zip(DEL/name,entries)
# Optional finished movie bundle, once both exports exist.
exports=R/'review/v06/exports.json'
if exports.exists():
    for n in ['azi-lashes-v06-1080.mp4','azi-lashes-v06-phone.mp4']:
        shutil.copy2(R/'out/v06'/n,DEL/n)
        p=DEL/n;checks[n]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    entries=[(DEL/n,n) for n in ['azi-lashes-v06-1080.mp4','azi-lashes-v06-phone.mp4','README-v06.md','REPORT-v06.md','contact-v06.jpg'] if (DEL/n).exists()]
    name='azi-lashes-v06-video.zip';checks[name]=checked_zip(DEL/name,entries)
    entries=[(p,str(Path('v06-workfiles')/p.relative_to(R/'review/v06'))) for p in sorted((R/'review/v06').rglob('*')) if p.is_file() and not any(x in {'decoded','validate'} for x in p.relative_to(R/'review/v06').parts)]
    name='azi-lashes-v06-workfiles.zip';checks[name]=checked_zip(DEL/name,entries)
(DEL/'SHA256SUMS-v06.txt').write_text(''.join(f"{v['sha256']}  {n}\n" for n,v in checks.items()))
(R/'review/v06/bundles.json').write_text(json.dumps(checks,indent=2))
print(json.dumps(checks,indent=2))
