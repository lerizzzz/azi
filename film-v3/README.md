# AZI LASHES • V04

Текущая композиция использует цельную векторную анатомию SeamlessRig и монтаж ComicEdit на 40 планов. Папка film-v3 — историческое имя проекта; актуальная версия — V04. Предыдущие публичные MP4 сохранены отдельно.

## Экспорт V04

```sh
npm ci
npm run lint
npx remotion render src/index.ts AziFilm review/v04/picture.mp4 --browser-executable=/usr/bin/chromium --concurrency=2 --codec=h264 --crf=18
python3 tools/export-v04.py
node tools/validate-v04.mjs
```

Итоговые файлы: out/v04/azi-lashes-v04-1080.mp4 и out/v04/azi-lashes-v04-phone.mp4. Исходная озвучка уже включена в public/mix.wav; повторный TTS не требуется. Воспроизводимость, визуальные контрольные случаи и ограничения — review/v04/QA.md и review/v04/REPORT.md.

---

# AZI LASHES • film v03

New eight-scene vertical comic film. Recovered artwork is reused; rejected previous films are not spliced. The current brief is ../docs/PRODUCTION_REQUIREMENTS_v03.md. Storyboards and alternatives are in STORYBOARD.md. Narration text and real cue durations are in script.json / timing.json. Temporary female synthetic Russian voice: RHVoice Elena. No paid APIs.

## Reproduce

Node 24, Python 3 (numpy/scipy), FFmpeg, Chromium. `npm ci`; then `npm run dev -- --no-open` to edit. Run `npm run lint` for ESLint and TypeScript checks. Existing public/mix.wav and voice WAV files allow rendering without the TTS engine.

```sh
mkdir -p out
npx remotion render src/index.ts AziFilm review/picture.mp4 --browser-executable=/usr/bin/chromium --gl=swangle --concurrency=2 --codec=h264 --crf=18
ffmpeg -y -i review/picture.mp4 -i public/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 160k -movflags +faststart out/azi-lashes-film-1080.mp4
ffmpeg -y -i out/azi-lashes-film-1080.mp4 -vf scale=540:960 -c:v libx264 -crf 25 -preset medium -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart out/azi-lashes-film-phone.mp4
```

Outputs are CFR 30 fps, H.264/yuv420p, 1080x1920 and 540x960. Entire canvas filled in 9:16. Black graphic outlines are authored comic borders, not aspect ratio bars. There is no embedded audio in the intermediate picture.mp4; mux step is required. Do not use `-shortest` to hide timing errors.

To regenerate temporary narration: build official RHVoice with Russian+Elena, set the `engine` path in tools/prepare.py; run `python3 tools/prepare.py`. That updates measured timing and synthesized mix; re-render afterwards. On this machine engine is /workspace/azi-tools/RHVoice/local/bin/RHVoice-test. Voices/models are not duplicated in source archive; licenses and generated WAVs are included.

`node tools/review.mjs` renders representative frames from every scene. Read review/REPORT.md for actual checks and remaining limitations. `python3 tools/export.py`, `python3 tools/validate_export.py` and `python3 tools/decoded_review.py` automate muxing, both export checks and decoded contact sheets. Do not infer approval or professional voice quality from a successful render.
