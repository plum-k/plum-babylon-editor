import { Color4 } from "../Maths/math.color.js";
/** Class used to store color4 gradient */
export class ColorGradient {
    /**
     * Creates a new color4 gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param color1 gets or sets first associated color
     * @param color2 gets or sets first second color
     */
    constructor(
    /**
     * Gets or sets the gradient value (between 0 and 1)
     */
    gradient, 
    /**
     * Gets or sets first associated color
     */
    color1, 
    /**
     * Gets or sets second associated color
     */
    color2) {
        this.gradient = gradient;
        this.color1 = color1;
        this.color2 = color2;
    }
    /**
     * Will get a color picked randomly between color1 and color2.
     * If color2 is undefined then color1 will be used
     * @param result defines the target Color4 to store the result in
     */
    getColorToRef(result) {
        if (!this.color2) {
            result.copyFrom(this.color1);
            return;
        }
        Color4.LerpToRef(this.color1, this.color2, Math.random(), result);
    }
}
/** Class used to store color 3 gradient */
export class Color3Gradient {
    /**
     * Creates a new color3 gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param color gets or sets associated color
     */
    constructor(
    /**
     * Gets or sets the gradient value (between 0 and 1)
     */
    gradient, 
    /**
     * Gets or sets the associated color
     */
    color) {
        this.gradient = gradient;
        this.color = color;
    }
}
/** Class used to store factor gradient */
export class FactorGradient {
    /**
     * Creates a new factor gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param factor1 gets or sets first associated factor
     * @param factor2 gets or sets second associated factor
     */
    constructor(
    /**
     * Gets or sets the gradient value (between 0 and 1)
     */
    gradient, 
    /**
     * Gets or sets first associated factor
     */
    factor1, 
    /**
     * Gets or sets second associated factor
     */
    factor2) {
        this.gradient = gradient;
        this.factor1 = factor1;
        this.factor2 = factor2;
    }
    /**
     * Will get a number picked randomly between factor1 and factor2.
     * If factor2 is undefined then factor1 will be used
     * @returns the picked number
     */
    getFactor() {
        if (this.factor2 === undefined || this.factor2 === this.factor1) {
            return this.factor1;
        }
        return this.factor1 + (this.factor2 - this.factor1) * Math.random();
    }
}
/**
 * Helper used to simplify some generic gradient tasks
 */
export class GradientHelper {
    /**
     * Gets the current gradient from an array of IValueGradient
     * @param ratio defines the current ratio to get
     * @param gradients defines the array of IValueGradient
     * @param updateFunc defines the callback function used to get the final value from the selected gradients
     */
    static GetCurrentGradient(ratio, gradients, updateFunc) {
        // Use last index if over
        if (gradients[0].gradient > ratio) {
            updateFunc(gradients[0], gradients[0], 1.0);
            return;
        }
        for (let gradientIndex = 0; gradientIndex < gradients.length - 1; gradientIndex++) {
            const currentGradient = gradients[gradientIndex];
            const nextGradient = gradients[gradientIndex + 1];
            if (ratio >= currentGradient.gradient && ratio <= nextGradient.gradient) {
                const scale = (ratio - currentGradient.gradient) / (nextGradient.gradient - currentGradient.gradient);
                updateFunc(currentGradient, nextGradient, scale);
                return;
            }
        }
        // Use last index if over
        const lastIndex = gradients.length - 1;
        updateFunc(gradients[lastIndex], gradients[lastIndex], 1.0);
    }
}
//# sourceMappingURL=gradients.js.map