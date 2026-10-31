// Root - registers the master composition and one debug composition per scene.

import { loadFont as loadDisplay } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Composition } from "remotion";
import { Master } from "./Master";
import { HookScene } from "./scenes/HookScene";
import { PrivateDetailsScene } from "./scenes/PrivateDetailsScene";
import { canvas } from "./theme";
import { FPS, SCENES, TOTAL_FRAMES } from "./timing";

// Placeholder fonts: load the brand's families here and name them in theme.ts.
// Naming the weights and the "latin" subset keeps this to a few requests; left
// out, every weight of every subset is fetched and the render can time out.
loadDisplay("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
loadMono("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Master"
      component={Master}
      defaultProps={{ sfx: true }}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />
    {/* The same film with the music only: render both and the sound effects
        can be judged by ear (references/sound-effects.md). */}
    <Composition
      id="Master-NoSfx"
      component={Master}
      defaultProps={{ sfx: false }}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />

    {/* One debug composition per scene, so a scene renders alone in seconds.
        IDs take letters, digits and hyphens only: an underscore is rejected at render time. */}
    <Composition
      id="Scene-Hook"
      component={HookScene}
      durationInFrames={SCENES.hook.duration}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />
    <Composition
      id="Scene-PrivateDetails"
      component={PrivateDetailsScene}
      durationInFrames={SCENES.privateDetails.duration}
      fps={FPS}
      width={canvas.width}
      height={canvas.height}
    />
  </>
);
