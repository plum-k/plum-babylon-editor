/**
 * Enum defining the type of animations supported by InputBlock
 */
export var AnimatedInputBlockTypes;
(function (AnimatedInputBlockTypes) {
    /** No animation */
    AnimatedInputBlockTypes[AnimatedInputBlockTypes["None"] = 0] = "None";
    /** Time based animation (is incremented by 0.6 each second). Will only work for floats */
    AnimatedInputBlockTypes[AnimatedInputBlockTypes["Time"] = 1] = "Time";
    /** Time elapsed (in seconds) since the engine was initialized. Will only work for floats */
    AnimatedInputBlockTypes[AnimatedInputBlockTypes["RealTime"] = 2] = "RealTime";
    AnimatedInputBlockTypes[AnimatedInputBlockTypes["MouseInfo"] = 3] = "MouseInfo";
})(AnimatedInputBlockTypes || (AnimatedInputBlockTypes = {}));
//# sourceMappingURL=animatedInputBlockTypes.js.map