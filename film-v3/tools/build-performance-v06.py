from pathlib import Path
import json,math,wave,re,hashlib
import numpy as np
R=Path(__file__).resolve().parents[1];D=R/'review/v06';old=json.loads((D/'timing-v05-original.json').read_text());words=json.loads((D/'words-asr.json').read_text())
scene_starts=[0,7.04,21.10,34.54,46.46,56.82,65.74,76.46];duration=88.0;frames=2640
anchors=[[0,2.32,3.76],[7.12,8.24,10.24,13.32,15.76],[21.2,24.4,25.44,26.96,30.24,32.12],[34.64,40.64,43.88],[46.56,47.96,50.64,53.68],[56.92,59.64,61.68,63.72],[65.84,67.52,72.28,74.24],[76.56,77.4,78.64,82.72]]
scenes=[];cues=[]
for i,starts in enumerate(anchors):
 end=scene_starts[i+1] if i<7 else duration;scenes.append({'scene':i+1,'start':scene_starts[i],'end':end,'text':old['scenes'][i]['text']})
 source=[c for c in old['cues'] if c['scene']==i+1]
 for j,start in enumerate(starts):
  text=source[j]['text']
  if i==4 and j==2:text='Пришельцы не умеют моргать, у них нет век.'
  if i==7 and j==3:text='Вторжение вторжением, а реснички сами себя не нарастят.'
  cues.append({'scene':i+1,'start':start,'end':starts[j+1] if j+1<len(starts) else min(end,86.72),'text':text,'file':'v06/voice.wav'})
timing={'fps':30,'frames':frames,'duration':duration,'scenes':scenes,'cues':cues,'source':'Recorded performance; speech timings from Russian ASR, narration waveform retained','performance_seconds':86.86441666666667}
for p in [R/'timing.json',R/'src/timing.json'] :p.write_text(json.dumps(timing,ensure_ascii=False,indent=2))
# Cuts are selected from actual spoken actions; every entry has acting/object action.
plans=[
([0,1.62,3.70,5.40],['wide','medium','detail','eyes'],['phone','startled','deadpan','deadpan'],['read-phone','ufo-reaction','lower-phone','date-reaction'],[[540,980],[480,1010],[510,1000],[540,1020]]),
([0,1.60,3.20,5.20,7.30,9.70,11.80],['wide','detail','medium','detail','wide','split','detail'],['','','','','','',''],['map-route','ship-hover','lift-body','drop-phone','empty-space','chat-message','no-signal'],[[540,960],[620,900],[540,1010],[600,1000],[540,950],[540,1050],[570,1090]]),
([0,1.86,3.30,5.25,7.20,9.25,11.30],['detail','medium','medium','wide','detail','split','wide'],['','idea','idea','','','',''],['remove-heels','hold-heels','alien-near','guides-talk','river-boat','human-alien','escape-walk'],[[530,1400],[500,1220],[500,1050],[540,1120],[520,1180],[570,1050],[600,1210]]),
([0,1.92,3.90,5.90,7.95,10.0],['medium','detail','medium','eyes','wide','wide'],['idea','idea','talk','','',''],['alien-question','insert-earbud','say-call','interrupted','wait-clock','escape-run'],[[610,1100],[480,960],[450,1060],[810,930],[620,1100],[690,1210]]),
([0,1.82,3.65,5.72,7.78],['wide','eyes','split','medium','medium'],['idea','','','',''],['door-reveal','double-blink','no-eyelids','hair-preparation','hair-kiss-enter'],[[540,1030],[540,1010],[540,1000],[500,1040],[530,1150]]),
([0,1.8,3.7,5.5,7.3],['wide','detail','medium','split','medium'],['','','','','relief'],['black-curtains','one-lamp','barricade','outside-closed','relieved'],[[540,1050],[800,770],[590,1380],[540,1050],[450,1150]]),
([0,1.75,3.55,5.35,7.20,9.1],['wide','medium','detail','eyes','split','detail'],['','','','','',''],['lie-down','flashback-run','mascara-tears','two-smudges','alien-twin','wipe-then-lash'],[[420,1240],[450,1060],[380,1010],[420,1060],[600,1010],[260,1260]]),
([0,1.95,3.75,5.70,7.60,9.50],['medium','detail','medium','wide','brand','eyes'],['wink','','sip','','wink','wink'],['safe-wink','charge-phone','sip-tea','land-on-bed','invasion-vs-lashes','last-wink'],[[460,1090],[330,1540],[550,1050],[500,1260],[540,960],[540,950]])]
shots=[]
for i,(cuts,kinds,acting,actions,focus) in enumerate(plans):
 for j,start in enumerate(cuts):
  kind=kinds[j];shots.append({'scene':i+1,'from':round(scene_starts[i]+start,4),'to':round(scene_starts[i]+(cuts[j+1] if j+1<len(cuts) else scenes[i]['end']-scene_starts[i]),4),'kind':kind,'focus':focus[j],'zoom':1.28 if kind=='detail' else 1.105 if kind=='medium' else 1,'acting':acting[j],'action':actions[j],'eyeWho':'alien' if i==3 or i==6 and j==4 else 'azi','note':actions[j],'entry':'impact' if actions[j] in ['ufo-reaction','date-reaction','alien-near','interrupted','two-smudges'] else 'cut'})
(R/'src/shots-v06.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2));(D/'shotlist.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2))
# Semantically timed accents. Function words never compete with the main action.
beats=[]
def beat(t,kind,x,y,scale=1,d=.75,note=''):
 scene=next(s['scene'] for s in scenes if s['start']<=t<s['end']);beats.append({'start':t,'end':min(duration,t+d),'kind':kind,'x':x,'y':y,'scale':scale,'scene':scene,'note':note})
for args in [
(0.05,'cat',160,1120,.8,.75,'Кисунь'),(.56,'sparkle',720,690,.8,.7,'Представь'),(1.24,'pin',850,650,.8,.7,'Питер'),(1.68,'shock',600,730,1,.8,'Пришельцы: испуг'),(2.6,'route',350,1610,1,.9,'Гуляешь'),(3.2,'sparkle',870,680,.7,.65,'Невский'),(4.48,'moon',850,600,.9,.8,'Вечер'),(5.4,'anger',240,690,1,.8,'Катастрофа'),(6.12,'broken-heart',800,1000,1.1,.8,'Свиданьице'),
(7.12,'breathe',220,1050,.8,.9,'Спокойно'),(8.24,'ring',620,820,1,.8,'Корабль'),(9.32,'pin',620,900,.9,.7,'Рубинштейна'),(10.60,'shock',820,980,.8,.75,'Забрали'),(11.88,'calendar',160,1130,.85,1,'Давай на неделе'),(13.32,'ghost',530,1310,1,.85,'Никто не заметил'),(15.0,'ghost',240,1000,.8,.75,'Пропадали'),(17.4,'heart',780,1190,.75,.7,'Малыш'),(18.32,'return',350,1370,.85,.8,'Вернулся'),(19.36,'planet',810,1360,.8,.7,'На корабле'),(20.16,'no-signal',760,1500,1,.9,'Нет связи'),
(21.84,'brackets',430,1420,1,.6,'Каблучки'),(22.92,'sparkle',440,1420,.9,.6,'В ручки'),(23.36,'speed',850,1390,.9,.8,'Бежим'),(24.4,'question',740,700,.8,.8,'Пришелец рядом'),(25.88,'chat',230,900,.7,.8,'Поговорят'),(27.60,'boat',580,1210,.9,.85,'Экскурсия'),(28.28,'waves',600,1390,1.1,.8,'Реки и каналы'),(29.76,'target',600,1160,.9,.7,'Кто стоит'),(30.6,'heart',210,1030,.75,.6,'Хоть тебе'),(31.28,'planet',800,1060,.85,.7,'Марсианину'),(33.16,'discount',810,1220,.9,.85,'Скидку'),(33.72,'speed',700,1400,1,.8,'Свободна'),
(35.92,'question',790,690,.8,.8,'Подошёл'),(36.32,'shock',580,960,.75,.65,'Вплотную'),(37.72,'call',470,810,.75,.8,'Наушник'),(38.8,'clock',180,900,.8,.7,'Секунду'),(40.0,'call',690,950,.9,.75,'Созвон'),(40.64,'stop',790,1120,.8,.8,'Перебить'),(42.52,'sweat',890,720,.85,.8,'Ни одно существо'),(44.32,'clock',780,1050,1,.8,'Ждёт'),(44.8,'speed',300,1430,1,.8,'Быстрее'),(45.84,'route',650,1700,.85,.7,'Ножками'),
(47.36,'target',790,1040,.8,.7,'Дверь'),(48.36,'lock',800,820,.9,.8,'Кодовый жест'),(49.36,'lash',180,1240,.9,.6,'Первое моргание'),(49.92,'lash',850,1240,.9,.6,'Второе моргание'),(51.84,'question',820,1120,.85,.8,'Не умеют моргать'),(52.84,'stop',820,1250,.8,.7,'Нет век'),(54.56,'sparkle',310,950,.9,.7,'Волосики'),(56.2,'heart',760,850,.9,.8,'Поцелуй'),
(57.4,'lock',280,650,.8,.7,'Окна закрыты'),(58.96,'lamp',800,700,.8,.8,'Одна лампа'),(59.64,'sparkle',500,1140,.8,.7,'Мастера'),(60.92,'impact',600,1470,1,.65,'Кушетки'),(62.24,'scan',550,850,1,.8,'Для корабля'),(63.12,'lock',820,850,.8,.7,'Закрыто'),(64.2,'shield',470,1150,1,.85,'Не заберёт'),(65.0,'breathe',730,900,.8,.8,'Облегчение'),
(66.28,'sparkle',270,1240,.8,.7,'Ложись'),(67.8,'speed',810,1340,.8,.65,'После бега'),(68.16,'tear',680,1010,.9,.65,'Рёва'),(68.64,'mascara',790,1230,.9,.8,'Тушь'),(69.0,'tear',260,1150,1,.8,'Размажется'),(70.44,'brackets',460,1050,.9,.75,'Под глазами'),(71.16,'two-dots',780,1100,.9,.8,'Два пятна'),(73.24,'twin',760,1280,.9,.8,'Инопланетянка'),(74.4,'lash',770,1190,.95,.9,'Наращивание'),(75.4,'shield',600,1170,.9,.85,'Не размазывается'),
(76.84,'heart',770,1000,.7,.7,'Кисунь'),(77.76,'shield',220,1090,.85,.8,'Безопасность'),(78.64,'battery',340,1600,.8,.8,'Телефон'),(79.44,'sparkle',350,1700,.75,.65,'Зарядочка'),(80.04,'steam',680,785,.7,.9,'Чаёк'),(81.36,'breathe',700,1030,.8,.7,'Приземляйся'),(82.72,'planet',190,1100,.9,.8,'Вторжение'),(84.08,'lash',200,1090,.9,.9,'Реснички'),(85.56,'sparkle',820,1260,.9,1.0,'Не нарастят')]:beat(*args)
(R/'src/beats-v06.json').write_text(json.dumps(beats,ensure_ascii=False,indent=2));(D/'semantic-beats.json').write_text(json.dumps(beats,ensure_ascii=False,indent=2))
# New mix follows the recorded performance, with gentle sidechain ducking.
with wave.open(str(R/'public/v06/voice.wav')) as w:sr=w.getframerate();voice=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
N=round(duration*sr);mix=np.zeros(N);mix[:len(voice)]=voice*.98;music=np.zeros(N);rng=np.random.default_rng(6006)
def add(target,t,a,g=1):
 k=max(0,round(t*sr));e=min(len(target),k+len(a));target[k:e]+=a[:e-k]*g
for n,t in enumerate(np.arange(0,duration-.8,60/100)):
 z=np.arange(int(.42*sr))/sr;env=np.exp(-z*9)*np.minimum(1,z/.012);bass=np.sin(2*np.pi*[55,55,65.406,49][(n//8)%4]*z)*env;add(music,t,bass,.014)
 if n%2==0:add(music,t,np.sin(2*np.pi*(47*z+15*(1-np.exp(-z*22))))*np.exp(-z*25),.020)
 if n%2:add(music,t,rng.normal(0,1,len(z))*np.exp(-z*45)*np.minimum(1,z/.004),.008)
# Framewise RMS ducking, avoiding speech masking.
block=round(.04*sr);rms=np.array([np.sqrt(np.mean(voice[i:i+block]**2)) for i in range(0,len(voice),block)]);levels=np.interp(np.arange(N)/sr,np.arange(len(rms))*.04,np.clip(rms/.06,0,1),right=0);mix+=music*(1-.65*levels)
def fx(t,kind='hit',g=.035):
 z=np.arange(int(.20*sr))/sr
 if kind=='ding':a=np.sin(2*np.pi*950*z)*np.exp(-z*19)*np.minimum(1,z/.005)
 elif kind=='whoosh':a=rng.normal(0,1,len(z))*np.sin(np.pi*z/.20)**2*.34
 else:a=(np.sin(2*np.pi*90*z)*.7+rng.normal(0,.2,len(z)))*np.exp(-z*36)*np.minimum(1,z/.002)
 add(mix,t,a,g)
for t in [1.68,10.6,21.84,24.4,36.32,44.8,54.56]:fx(t,'whoosh',.025)
for t in [13.05,60.96,81.4]:fx(t,'hit',.055)
for t in [22.95,27.60,37.72,49.46,49.98,56.2,79.44,84.08]:fx(t,'ding',.022)
# Steps follow the actual escape windows, not every scene continuously.
for a,b in [(32.56,34.54),(44.8,46.46)]:
 for t in np.arange(a,b,.40):fx(t,'hit',.022)
fade=int(.6*sr);mix[-fade:]*=np.linspace(1,0,fade);mix*=min(1,.91/max(abs(mix).max(),1e-6))
with wave.open(str(R/'public/v06/mix.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((mix*32767).astype('<i2').tobytes())
report={'duration':duration,'frames':frames,'source_performance_seconds':len(voice)/sr,'scenes':len(scenes),'shots':len(shots),'min_shot_seconds':min(s['to']-s['from'] for s in shots),'max_shot_seconds':max(s['to']-s['from'] for s in shots),'semantic_accents':len(beats),'white_swipe':False,'source_audio_sha256':hashlib.sha256((R/'public/v06/voice.wav').read_bytes()).hexdigest()};(D/'performance-edit.json').write_text(json.dumps(report,indent=2));print(report)
