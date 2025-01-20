import { Animation } from "../Animations/animation.js";
/**
 * Class used to override all child animations of a given target
 */
export class AnimationPropertiesOverride {
    constructor() {
        /**
         * Gets or sets a value indicating if animation blending must be used
         */
        this.enableBlending = false;
        /**
         * Gets or sets the blending speed to use when enableBlending is true
         */
        this.blendingSpeed = 0.01;
        /**
         * Gets or sets the default loop mode to use
         */
        this.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
    }
}
//# sourceMappingURL=animationPropertiesOverride.js.map