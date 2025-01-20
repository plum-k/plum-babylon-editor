import { BezierCurve } from "../Maths/math.path.js";
/**
 * Base class used for every default easing function.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class EasingFunction {
    constructor() {
        this._easingMode = EasingFunction.EASINGMODE_EASEIN;
    }
    /**
     * Sets the easing mode of the current function.
     * @param easingMode Defines the willing mode (EASINGMODE_EASEIN, EASINGMODE_EASEOUT or EASINGMODE_EASEINOUT)
     */
    setEasingMode(easingMode) {
        const n = Math.min(Math.max(easingMode, 0), 2);
        this._easingMode = n;
    }
    /**
     * Gets the current easing mode.
     * @returns the easing mode
     */
    getEasingMode() {
        return this._easingMode;
    }
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    easeInCore(gradient) {
        throw new Error("You must implement this method");
    }
    /**
     * Given an input gradient between 0 and 1, this returns the corresponding value
     * of the easing function.
     * @param gradient Defines the value between 0 and 1 we want the easing value for
     * @returns the corresponding value on the curve defined by the easing function
     */
    ease(gradient) {
        switch (this._easingMode) {
            case EasingFunction.EASINGMODE_EASEIN:
                return this.easeInCore(gradient);
            case EasingFunction.EASINGMODE_EASEOUT:
                return 1 - this.easeInCore(1 - gradient);
        }
        if (gradient >= 0.5) {
            return (1 - this.easeInCore((1 - gradient) * 2)) * 0.5 + 0.5;
        }
        return this.easeInCore(gradient * 2) * 0.5;
    }
}
/**
 * Interpolation follows the mathematical formula associated with the easing function.
 */
EasingFunction.EASINGMODE_EASEIN = 0;
/**
 * Interpolation follows 100% interpolation minus the output of the formula associated with the easing function.
 */
EasingFunction.EASINGMODE_EASEOUT = 1;
/**
 * Interpolation uses EaseIn for the first half of the animation and EaseOut for the second half.
 */
EasingFunction.EASINGMODE_EASEINOUT = 2;
/**
 * Easing function with a circle shape (see link below).
 * @see https://easings.net/#easeInCirc
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class CircleEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        gradient = Math.max(0, Math.min(1, gradient));
        return 1.0 - Math.sqrt(1.0 - gradient * gradient);
    }
}
/**
 * Easing function with a ease back shape (see link below).
 * @see https://easings.net/#easeInBack
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class BackEase extends EasingFunction {
    /**
     * Instantiates a back ease easing
     * @see https://easings.net/#easeInBack
     * @param amplitude Defines the amplitude of the function
     */
    constructor(
    /** [1] Defines the amplitude of the function */
    amplitude = 1) {
        super();
        this.amplitude = amplitude;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        const num = Math.max(0, this.amplitude);
        return Math.pow(gradient, 3.0) - gradient * num * Math.sin(3.1415926535897931 * gradient);
    }
}
/**
 * Easing function with a bouncing shape (see link below).
 * @see https://easings.net/#easeInBounce
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class BounceEase extends EasingFunction {
    /**
     * Instantiates a bounce easing
     * @see https://easings.net/#easeInBounce
     * @param bounces Defines the number of bounces
     * @param bounciness Defines the amplitude of the bounce
     */
    constructor(
    /** [3] Defines the number of bounces */
    bounces = 3, 
    /** [2] Defines the amplitude of the bounce */
    bounciness = 2) {
        super();
        this.bounces = bounces;
        this.bounciness = bounciness;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        const y = Math.max(0.0, this.bounces);
        let bounciness = this.bounciness;
        if (bounciness <= 1.0) {
            bounciness = 1.001;
        }
        const num9 = Math.pow(bounciness, y);
        const num5 = 1.0 - bounciness;
        const num4 = (1.0 - num9) / num5 + num9 * 0.5;
        const num15 = gradient * num4;
        const num65 = Math.log(-num15 * (1.0 - bounciness) + 1.0) / Math.log(bounciness);
        const num3 = Math.floor(num65);
        const num13 = num3 + 1.0;
        const num8 = (1.0 - Math.pow(bounciness, num3)) / (num5 * num4);
        const num12 = (1.0 - Math.pow(bounciness, num13)) / (num5 * num4);
        const num7 = (num8 + num12) * 0.5;
        const num6 = gradient - num7;
        const num2 = num7 - num8;
        return (-Math.pow(1.0 / bounciness, y - num3) / (num2 * num2)) * (num6 - num2) * (num6 + num2);
    }
}
/**
 * Easing function with a power of 3 shape (see link below).
 * @see https://easings.net/#easeInCubic
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class CubicEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        return gradient * gradient * gradient;
    }
}
/**
 * Easing function with an elastic shape (see link below).
 * @see https://easings.net/#easeInElastic
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class ElasticEase extends EasingFunction {
    /**
     * Instantiates an elastic easing function
     * @see https://easings.net/#easeInElastic
     * @param oscillations Defines the number of oscillations
     * @param springiness Defines the amplitude of the oscillations
     */
    constructor(
    /** [3] Defines the number of oscillations*/
    oscillations = 3, 
    /** [3] Defines the amplitude of the oscillations*/
    springiness = 3) {
        super();
        this.oscillations = oscillations;
        this.springiness = springiness;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        let num2;
        const num3 = Math.max(0.0, this.oscillations);
        const num = Math.max(0.0, this.springiness);
        if (num == 0) {
            num2 = gradient;
        }
        else {
            num2 = (Math.exp(num * gradient) - 1.0) / (Math.exp(num) - 1.0);
        }
        return num2 * Math.sin((6.2831853071795862 * num3 + 1.5707963267948966) * gradient);
    }
}
/**
 * Easing function with an exponential shape (see link below).
 * @see https://easings.net/#easeInExpo
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class ExponentialEase extends EasingFunction {
    /**
     * Instantiates an exponential easing function
     * @see https://easings.net/#easeInExpo
     * @param exponent Defines the exponent of the function
     */
    constructor(
    /** [3] Defines the exponent of the function */
    exponent = 2) {
        super();
        this.exponent = exponent;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        if (this.exponent <= 0) {
            return gradient;
        }
        return (Math.exp(this.exponent * gradient) - 1.0) / (Math.exp(this.exponent) - 1.0);
    }
}
/**
 * Easing function with a power shape (see link below).
 * @see https://easings.net/#easeInQuad
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class PowerEase extends EasingFunction {
    /**
     * Instantiates an power base easing function
     * @see https://easings.net/#easeInQuad
     * @param power Defines the power of the function
     */
    constructor(
    /** [2] Defines the power of the function */
    power = 2) {
        super();
        this.power = power;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        const y = Math.max(0.0, this.power);
        return Math.pow(gradient, y);
    }
}
/**
 * Easing function with a power of 2 shape (see link below).
 * @see https://easings.net/#easeInQuad
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class QuadraticEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        return gradient * gradient;
    }
}
/**
 * Easing function with a power of 4 shape (see link below).
 * @see https://easings.net/#easeInQuart
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class QuarticEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        return gradient * gradient * gradient * gradient;
    }
}
/**
 * Easing function with a power of 5 shape (see link below).
 * @see https://easings.net/#easeInQuint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class QuinticEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        return gradient * gradient * gradient * gradient * gradient;
    }
}
/**
 * Easing function with a sin shape (see link below).
 * @see https://easings.net/#easeInSine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class SineEase extends EasingFunction {
    /**
     * @internal
     */
    easeInCore(gradient) {
        return 1.0 - Math.sin(1.5707963267948966 * (1.0 - gradient));
    }
}
/**
 * Easing function with a bezier shape (see link below).
 * @see http://cubic-bezier.com/#.17,.67,.83,.67
 * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#easing-functions
 */
export class BezierCurveEase extends EasingFunction {
    /**
     * Instantiates a bezier function
     * @see http://cubic-bezier.com/#.17,.67,.83,.67
     * @param x1 Defines the x component of the start tangent in the bezier curve
     * @param y1 Defines the y component of the start tangent in the bezier curve
     * @param x2 Defines the x component of the end tangent in the bezier curve
     * @param y2 Defines the y component of the end tangent in the bezier curve
     */
    constructor(
    /** [0] Defines the x component of the start tangent in the bezier curve */
    x1 = 0, 
    /** [0] Defines the y component of the start tangent in the bezier curve */
    y1 = 0, 
    /** [1] Defines the x component of the end tangent in the bezier curve */
    x2 = 1, 
    /** [1] Defines the y component of the end tangent in the bezier curve */
    y2 = 1) {
        super();
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    /**
     * @internal
     */
    easeInCore(gradient) {
        return BezierCurve.Interpolate(gradient, this.x1, this.y1, this.x2, this.y2);
    }
}
//# sourceMappingURL=easing.js.map