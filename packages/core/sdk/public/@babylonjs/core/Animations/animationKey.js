/**
 * Enum for the animation key frame interpolation type
 */
export var AnimationKeyInterpolation;
(function (AnimationKeyInterpolation) {
    /**
     * Use tangents to interpolate between start and end values.
     */
    AnimationKeyInterpolation[AnimationKeyInterpolation["NONE"] = 0] = "NONE";
    /**
     * Do not interpolate between keys and use the start key value only. Tangents are ignored
     */
    AnimationKeyInterpolation[AnimationKeyInterpolation["STEP"] = 1] = "STEP";
})(AnimationKeyInterpolation || (AnimationKeyInterpolation = {}));
//# sourceMappingURL=animationKey.js.map