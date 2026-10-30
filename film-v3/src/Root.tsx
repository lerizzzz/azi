import { Composition } from "remotion";
import { DrawingCheck } from "./IllustratedActor";
import { Film } from "./Film";
import timing from "./timing.json";
export const Root = () => (
  <>
    <Composition
      id="AziFilm"
      component={Film}
      durationInFrames={timing.frames}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="AnatomyCheck"
      component={DrawingCheck}
      durationInFrames={360}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
