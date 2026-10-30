import { Series, Sequence, useVideoConfig } from "remotion";
import { Film } from "./Film";
export function MotionCheckV06() {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence durationInFrames={3 * fps} premountFor={fps}>
        <Sequence from={-1 * fps} premountFor={fps}>
          <Film />
        </Sequence>
      </Series.Sequence>
      <Series.Sequence durationInFrames={3 * fps} premountFor={fps}>
        <Sequence from={-Math.round(38.3 * fps)} premountFor={fps}>
          <Film />
        </Sequence>
      </Series.Sequence>
      <Series.Sequence durationInFrames={3 * fps} premountFor={fps}>
        <Sequence from={-48 * fps} premountFor={fps}>
          <Film />
        </Sequence>
      </Series.Sequence>
      <Series.Sequence durationInFrames={3 * fps} premountFor={fps}>
        <Sequence from={-Math.round(79.4 * fps)} premountFor={fps}>
          <Film />
        </Sequence>
      </Series.Sequence>
    </Series>
  );
}
