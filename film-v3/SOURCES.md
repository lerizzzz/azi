# Sources and rights

- Character canonical artwork, character part textures, UFO, props, Kazan/courtyard backgrounds: recovered from user-designated repository lerizzzz/azi, commit d5dfd44df407509bd39488e7eff3d8ee8a2238d0, review-delivery/scenes-01-02-sources.zip. Prior source manifest identifies these as image_gen-derived artwork. Reused as user project materials; no new claim of authorship over the recovered images. No frames of rejected old MP4s used in the new movie.
- New scene architecture, map (schematic, not a geographic survey), studio, lettering layouts, footwear, rig corrections, music and sound effects: procedural project code in this delivery. Studio and entrance are stylized reconstructions from the user's written brief, not verified replicas of WELL or the actual studio photos. Those photos were not present in recovered materials.
- Neucha: Jovanny Lemonad, SIL Open Font License, public/fonts/OFL.txt. Embedded locally with Cyrillic.
- Speech: RHVoice, https://github.com/RHVoice/RHVoice ; Russian language and Elena voice from official pinned submodules. Free local synthesis. See licenses/RHVoice-LICENSE.md and licenses/Elena-README.md (GPL v3). This is temporary synthetic narration, not professional acting. Original text is user-supplied.
- Remotion 4.0.539 and React: package-lock.json contains exact installed dependencies. No paid voice API, subscription, stock music, remote font, or external credit service used.

## V04 revision

`src/SeamlessRig.tsx` replaces the independent texture limbs with continuous, shared-joint vector anatomy and a single connected trousers silhouette. Original texture body parts are retained for history but not used by V04. Original PNG face layers remain part of the visual identity. The frontal neutral, surprised and smiling heads and the studio light/dark backgrounds in `public/v04/` were produced with native image_gen from the canonical art and the user's textual brief. The real studio photographs and external comic video reference were not available in this machine, so the room is a stylized reconstruction. `src/ComicEdit.tsx` authors 40 shots. Voice and music retain the measured 96.4-second source mix.

## V05 revision

`public/v05/` contains 17 native image_gen PNGs (21 whole-drawing regions). Canonical Azi from the recovered project remains the identity/style reference. Phone, footwear removal, barefoot, earbud, door gestures, walk poses and treatment are complete drawings; no separate head is attached to a procedural body. Man, alien and technician identities derive from recovered character art. Artwork was produced and edited with native image_gen; files are preserved as supplied. The fitted alien space uniform is grey-green. `illustrations.json` contains source-region registration metadata, not newly painted body parts. V04 image-generated studio backgrounds are retained; they are still interpretations of the written description, not verified replicas of unavailable photographs.

`IllustratedActor.tsx` animates whole images on a continuous shared-vertex surface. Four held walking drawings, subtle deformations, camera movement and cuts are limited animation; this is not a fully hand-animated walk or free 3D motion. Prior V04 numerical bone tests do not certify V05. Narration/mix remains the original local free RHVoice version. See review/v05/REVISION.md and REPORT.md.
