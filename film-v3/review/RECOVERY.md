# Recovery after environment reconnection

The environment terminated the running renderer after progress 2459/2892. Source files and the open MP4 mdat survived. The unfinished MP4 had no moov and was not publishable.

A matching H.264 reference supplied decoder parameter sets. Complete length-prefixed NAL units were recovered from the preserved encoder stream. To avoid a partial/reordered tail, recovery retained only the complete closed GOPs before the last IDR at frame 2243. The 2243-frame head was decoded with error checking and saved to a temporary lossless intermediate. Frames 2243–2891 are independently re-rendered from the same composition. Joining and final encoding must be followed by full decode, frame count/timestamp checks and inspection at the 2243 boundary.

Temporary recovery streams and lossless video are not part of the source archive or Git delivery. The ordinary full render command in README reproduces the film without recovery tooling. A recovery-generated file is never treated as valid solely because it exists.
