/**
 * Represents the range of an animation
 */
export class AnimationRange {
    /**
     * Initializes the range of an animation
     * @param name The name of the animation range
     * @param from The starting frame of the animation
     * @param to The ending frame of the animation
     */
    constructor(
    /**The name of the animation range**/
    name, 
    /**The starting frame of the animation */
    from, 
    /**The ending frame of the animation*/
    to) {
        this.name = name;
        this.from = from;
        this.to = to;
    }
    /**
     * Makes a copy of the animation range
     * @returns A copy of the animation range
     */
    clone() {
        return new AnimationRange(this.name, this.from, this.to);
    }
}
//# sourceMappingURL=animationRange.js.map