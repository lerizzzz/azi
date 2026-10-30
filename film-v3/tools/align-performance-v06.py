from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1];segments=json.loads((R/'review/v06/asr-original.json').read_text());allwords=[]
for si,s in enumerate(segments):
 words=[];cur=None
 for token,t in zip(s['tokens'],s['timestamps']):
  if token.startswith(' '):
   if cur and cur['text'].strip():words.append(cur)
   cur={'text':token.strip(),'start':t,'end':t+.1}
  else:
   if cur is None:cur={'text':'','start':t,'end':t+.1}
   cur['text']+=token;cur['end']=t+.1
 if cur and cur['text'].strip():words.append(cur)
 # Prefer the earlier block in its 1s overlap, preserving complete words.
 for w in words:
  if si>0 and w['start']<s['offset']+.8:
   nearby=[q for q in allwords if abs(q['start']-w['start'])<.65]
   if any(q['text']==w['text'] for q in nearby):continue
   if any(min(q['end'],w['end'])-max(q['start'],w['start'])>.025 for q in nearby):continue
  if si<len(segments)-1 and w['start']>=s['offset']+20.8:continue
  allwords.append(w)
allwords.sort(key=lambda w:w['start'])
# Remove duplicate overlap words.
clean=[]
for w in allwords:
 if clean and w['text']==clean[-1]['text'] and abs(w['start']-clean[-1]['start'])<.65:continue
 clean.append(w)
(R/'review/v06/words-asr.json').write_text(json.dumps(clean,ensure_ascii=False,indent=2))
for i,w in enumerate(clean):print(i,round(w['start'],2),w['text'])
