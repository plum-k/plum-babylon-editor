import { BuildArray } from "../Misc/arrayTools.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { Epsilon, ToGammaSpace, ToLinearSpace } from "./math.constants.js";
import { Clamp, ToHex, WithinEpsilon } from "./math.scalar.functions.js";
function colorChannelToLinearSpace(color) {
    return Math.pow(color, ToLinearSpace);
}
function colorChannelToLinearSpaceExact(color) {
    if (color <= 0.04045) {
        return 0.0773993808 * color;
    }
    return Math.pow(0.947867299 * (color + 0.055), 2.4);
}
function colorChannelToGammaSpace(color) {
    return Math.pow(color, ToGammaSpace);
}
function colorChannelToGammaSpaceExact(color) {
    if (color <= 0.0031308) {
        return 12.92 * color;
    }
    return 1.055 * Math.pow(color, 0.41666) - 0.055;
}
/**
 * Class used to hold a RGB color
 */
export class Color3 {
    /**
     * Creates a new Color3 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     */
    constructor(
    /**
     * [0] Defines the red component (between 0 and 1, default is 0)
     */
    r = 0, 
    /**
     * [0] Defines the green component (between 0 and 1, default is 0)
     */
    g = 0, 
    /**
     * [0] Defines the blue component (between 0 and 1, default is 0)
     */
    b = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    /**
     * Creates a string with the Color3 current values
     * @returns the string representation of the Color3 object
     */
    toString() {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
    }
    /**
     * Returns the string "Color3"
     * @returns "Color3"
     */
    getClassName() {
        return "Color3";
    }
    /**
     * Compute the Color3 hash code
     * @returns an unique number that can be used to hash Color3 objects
     */
    getHashCode() {
        let hash = (this.r * 255) | 0;
        hash = (hash * 397) ^ ((this.g * 255) | 0);
        hash = (hash * 397) ^ ((this.b * 255) | 0);
        return hash;
    }
    // Operators
    /**
     * Stores in the given array from the given starting index the red, green, blue values as successive elements
     * @param array defines the array where to store the r,g,b components
     * @param index defines an optional index in the target array to define where to start storing values
     * @returns the current Color3 object
     */
    toArray(array, index = 0) {
        array[index] = this.r;
        array[index + 1] = this.g;
        array[index + 2] = this.b;
        return this;
    }
    /**
     * Update the current color with values stored in an array from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns the current Color3 object
     */
    fromArray(array, offset = 0) {
        Color3.FromArrayToRef(array, offset, this);
        return this;
    }
    /**
     * Returns a new Color4 object from the current Color3 and the given alpha
     * @param alpha defines the alpha component on the new Color4 object (default is 1)
     * @returns a new Color4 object
     */
    toColor4(alpha = 1) {
        return new Color4(this.r, this.g, this.b, alpha);
    }
    /**
     * Returns a new array populated with 3 numeric elements : red, green and blue values
     * @returns the new array
     */
    asArray() {
        return [this.r, this.g, this.b];
    }
    /**
     * Returns the luminance value
     * @returns a float value
     */
    toLuminance() {
        return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
    }
    /**
     * Multiply each Color3 rgb values by the given Color3 rgb values in a new Color3 object
     * @param otherColor defines the second operand
     * @returns the new Color3 object
     */
    multiply(otherColor) {
        return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
    }
    /**
     * Multiply the rgb values of the Color3 and the given Color3 and stores the result in the object "result"
     * @param otherColor defines the second operand
     * @param result defines the Color3 object where to store the result
     * @returns the result Color3
     */
    multiplyToRef(otherColor, result) {
        result.r = this.r * otherColor.r;
        result.g = this.g * otherColor.g;
        result.b = this.b * otherColor.b;
        return result;
    }
    /**
     * Multiplies the current Color3 coordinates by the given ones
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    multiplyInPlace(otherColor) {
        this.r *= otherColor.r;
        this.g *= otherColor.g;
        this.b *= otherColor.b;
        return this;
    }
    /**
     * Returns a new Color3 set with the result of the multiplication of the current Color3 coordinates by the given floats
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the new Color3
     */
    multiplyByFloats(r, g, b) {
        return new Color3(this.r * r, this.g * g, this.b * b);
    }
    /**
     * @internal
     * Do not use
     */
    divide(_other) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * @internal
     * Do not use
     */
    divideToRef(_other, _result) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * @internal
     * Do not use
     */
    divideInPlace(_other) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * Updates the current Color3 with the minimal coordinate values between its and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color3
     */
    minimizeInPlace(other) {
        return this.minimizeInPlaceFromFloats(other.r, other.g, other.b);
    }
    /**
     * Updates the current Color3 with the maximal coordinate values between its and the given color ones.
     * @param other defines the second operand
     * @returns the current updated Color3
     */
    maximizeInPlace(other) {
        return this.maximizeInPlaceFromFloats(other.r, other.g, other.b);
    }
    /**
     * Updates the current Color3 with the minimal coordinate values between its and the given coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    minimizeInPlaceFromFloats(r, g, b) {
        this.r = Math.min(r, this.r);
        this.g = Math.min(g, this.g);
        this.b = Math.min(b, this.b);
        return this;
    }
    /**
     * Updates the current Color3 with the maximal coordinate values between its and the given coordinates.
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    maximizeInPlaceFromFloats(r, g, b) {
        this.r = Math.max(r, this.r);
        this.g = Math.max(g, this.g);
        this.b = Math.max(b, this.b);
        return this;
    }
    /**
     * @internal
     * Do not use
     */
    floorToRef(_result) {
        throw new ReferenceError("Can not floor a color");
    }
    /**
     * @internal
     * Do not use
     */
    floor() {
        throw new ReferenceError("Can not floor a color");
    }
    /**
     * @internal
     * Do not use
     */
    fractToRef(_result) {
        throw new ReferenceError("Can not fract a color");
    }
    /**
     * @internal
     * Do not use
     */
    fract() {
        throw new ReferenceError("Can not fract a color");
    }
    /**
     * Determines equality between Color3 objects
     * @param otherColor defines the second operand
     * @returns true if the rgb values are equal to the given ones
     */
    equals(otherColor) {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
    }
    /**
     * Alias for equalsToFloats
     * @param r red color component
     * @param g green color component
     * @param b blue color component
     * @returns boolean
     */
    equalsFloats(r, g, b) {
        return this.equalsToFloats(r, g, b);
    }
    /**
     * Determines equality between the current Color3 object and a set of r,b,g values
     * @param r defines the red component to check
     * @param g defines the green component to check
     * @param b defines the blue component to check
     * @returns true if the rgb values are equal to the given ones
     */
    equalsToFloats(r, g, b) {
        return this.r === r && this.g === g && this.b === b;
    }
    /**
     * Returns true if the current Color3 and the given color coordinates are distant less than epsilon
     * @param otherColor defines the second operand
     * @param epsilon defines the minimal distance to define values as equals
     * @returns true if both colors are distant less than epsilon
     */
    equalsWithEpsilon(otherColor, epsilon = Epsilon) {
        return WithinEpsilon(this.r, otherColor.r, epsilon) && WithinEpsilon(this.g, otherColor.g, epsilon) && WithinEpsilon(this.b, otherColor.b, epsilon);
    }
    /**
     * @internal
     * Do not use
     */
    negate() {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * @internal
     * Do not use
     */
    negateInPlace() {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * @internal
     * Do not use
     */
    negateToRef(_result) {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * Creates a new Color3 with the current Color3 values multiplied by scale
     * @param scale defines the scaling factor to apply
     * @returns a new Color3 object
     */
    scale(scale) {
        return new Color3(this.r * scale, this.g * scale, this.b * scale);
    }
    /**
     * Multiplies the Color3 values by the float "scale"
     * @param scale defines the scaling factor to apply
     * @returns the current updated Color3
     */
    scaleInPlace(scale) {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        return this;
    }
    /**
     * Multiplies the rgb values by scale and stores the result into "result"
     * @param scale defines the scaling factor
     * @param result defines the Color3 object where to store the result
     * @returns the result Color3
     */
    scaleToRef(scale, result) {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        return result;
    }
    /**
     * Scale the current Color3 values by a factor and add the result to a given Color3
     * @param scale defines the scale factor
     * @param result defines color to store the result into
     * @returns the result Color3
     */
    scaleAndAddToRef(scale, result) {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        return result;
    }
    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into
     * @returns the result Color3
     */
    clampToRef(min = 0, max = 1, result) {
        result.r = Clamp(this.r, min, max);
        result.g = Clamp(this.g, min, max);
        result.b = Clamp(this.b, min, max);
        return result;
    }
    /**
     * Creates a new Color3 set with the added values of the current Color3 and of the given one
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    add(otherColor) {
        return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
    }
    /**
     * Adds the given color to the current Color3
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    addInPlace(otherColor) {
        this.r += otherColor.r;
        this.g += otherColor.g;
        this.b += otherColor.b;
        return this;
    }
    /**
     * Adds the given coordinates to the current Color3
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the current updated Color3
     */
    addInPlaceFromFloats(r, g, b) {
        this.r += r;
        this.g += g;
        this.b += b;
        return this;
    }
    /**
     * Stores the result of the addition of the current Color3 and given one rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    addToRef(otherColor, result) {
        result.r = this.r + otherColor.r;
        result.g = this.g + otherColor.g;
        result.b = this.b + otherColor.b;
        return result;
    }
    /**
     * Returns a new Color3 set with the subtracted values of the given one from the current Color3
     * @param otherColor defines the second operand
     * @returns the new Color3
     */
    subtract(otherColor) {
        return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
    }
    /**
     * Stores the result of the subtraction of given one from the current Color3 rgb values into "result"
     * @param otherColor defines the second operand
     * @param result defines Color3 object to store the result into
     * @returns the unmodified current Color3
     */
    subtractToRef(otherColor, result) {
        result.r = this.r - otherColor.r;
        result.g = this.g - otherColor.g;
        result.b = this.b - otherColor.b;
        return result;
    }
    /**
     * Subtract the given color from the current Color3
     * @param otherColor defines the second operand
     * @returns the current updated Color3
     */
    subtractInPlace(otherColor) {
        this.r -= otherColor.r;
        this.g -= otherColor.g;
        this.b -= otherColor.b;
        return this;
    }
    /**
     * Returns a new Color3 set with the subtraction of the given floats from the current Color3 coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @returns the resulting Color3
     */
    subtractFromFloats(r, g, b) {
        return new Color3(this.r - r, this.g - g, this.b - b);
    }
    /**
     * Subtracts the given floats from the current Color3 coordinates and set the given color "result" with this result
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param result defines the Color3 object where to store the result
     * @returns the result
     */
    subtractFromFloatsToRef(r, g, b, result) {
        result.r = this.r - r;
        result.g = this.g - g;
        result.b = this.b - b;
        return result;
    }
    /**
     * Copy the current object
     * @returns a new Color3 copied the current one
     */
    clone() {
        return new Color3(this.r, this.g, this.b);
    }
    /**
     * Copies the rgb values from the source in the current Color3
     * @param source defines the source Color3 object
     * @returns the updated Color3 object
     */
    copyFrom(source) {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
        return this;
    }
    /**
     * Updates the Color3 rgb values from the given floats
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @returns the current Color3 object
     */
    copyFromFloats(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }
    /**
     * Updates the Color3 rgb values from the given floats
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @returns the current Color3 object
     */
    set(r, g, b) {
        return this.copyFromFloats(r, g, b);
    }
    /**
     * Copies the given float to the current Color3 coordinates
     * @param v defines the r, g and b coordinates of the operand
     * @returns the current updated Color3
     */
    setAll(v) {
        this.r = this.g = this.b = v;
        return this;
    }
    /**
     * Compute the Color3 hexadecimal code as a string
     * @returns a string containing the hexadecimal representation of the Color3 object
     */
    toHexString() {
        const intR = Math.round(this.r * 255);
        const intG = Math.round(this.g * 255);
        const intB = Math.round(this.b * 255);
        return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB);
    }
    /**
     * Updates the Color3 rgb values from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns the current Color3 object
     */
    fromHexString(hex) {
        if (hex.substring(0, 1) !== "#" || hex.length !== 7) {
            return this;
        }
        this.r = parseInt(hex.substring(1, 3), 16) / 255;
        this.g = parseInt(hex.substring(3, 5), 16) / 255;
        this.b = parseInt(hex.substring(5, 7), 16) / 255;
        return this;
    }
    /**
     * Converts current color in rgb space to HSV values
     * @returns a new color3 representing the HSV values
     */
    toHSV() {
        return this.toHSVToRef(new Color3());
    }
    /**
     * Converts current color in rgb space to HSV values
     * @param result defines the Color3 where to store the HSV values
     * @returns the updated result
     */
    toHSVToRef(result) {
        const r = this.r;
        const g = this.g;
        const b = this.b;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const v = max;
        const dm = max - min;
        if (max !== 0) {
            s = dm / max;
        }
        if (max != min) {
            if (max == r) {
                h = (g - b) / dm;
                if (g < b) {
                    h += 6;
                }
            }
            else if (max == g) {
                h = (b - r) / dm + 2;
            }
            else if (max == b) {
                h = (r - g) / dm + 4;
            }
            h *= 60;
        }
        result.r = h;
        result.g = s;
        result.b = v;
        return result;
    }
    /**
     * Computes a new Color3 converted from the current one to linear space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color3 object
     */
    toLinearSpace(exact = false) {
        const convertedColor = new Color3();
        this.toLinearSpaceToRef(convertedColor, exact);
        return convertedColor;
    }
    /**
     * Converts the Color3 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the linear space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color3
     */
    toLinearSpaceToRef(convertedColor, exact = false) {
        if (exact) {
            convertedColor.r = colorChannelToLinearSpaceExact(this.r);
            convertedColor.g = colorChannelToLinearSpaceExact(this.g);
            convertedColor.b = colorChannelToLinearSpaceExact(this.b);
        }
        else {
            convertedColor.r = colorChannelToLinearSpace(this.r);
            convertedColor.g = colorChannelToLinearSpace(this.g);
            convertedColor.b = colorChannelToLinearSpace(this.b);
        }
        return this;
    }
    /**
     * Computes a new Color3 converted from the current one to gamma space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color3 object
     */
    toGammaSpace(exact = false) {
        const convertedColor = new Color3();
        this.toGammaSpaceToRef(convertedColor, exact);
        return convertedColor;
    }
    /**
     * Converts the Color3 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color3 object where to store the gamma space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color3
     */
    toGammaSpaceToRef(convertedColor, exact = false) {
        if (exact) {
            convertedColor.r = colorChannelToGammaSpaceExact(this.r);
            convertedColor.g = colorChannelToGammaSpaceExact(this.g);
            convertedColor.b = colorChannelToGammaSpaceExact(this.b);
        }
        else {
            convertedColor.r = colorChannelToGammaSpace(this.r);
            convertedColor.g = colorChannelToGammaSpace(this.g);
            convertedColor.b = colorChannelToGammaSpace(this.b);
        }
        return this;
    }
    /**
     * Converts Hue, saturation and value to a Color3 (RGB)
     * @param hue defines the hue (value between 0 and 360)
     * @param saturation defines the saturation (value between 0 and 1)
     * @param value defines the value (value between 0 and 1)
     * @param result defines the Color3 where to store the RGB values
     * @returns the updated result
     */
    static HSVtoRGBToRef(hue, saturation, value, result) {
        const chroma = value * saturation;
        const h = hue / 60;
        const x = chroma * (1 - Math.abs((h % 2) - 1));
        let r = 0;
        let g = 0;
        let b = 0;
        if (h >= 0 && h <= 1) {
            r = chroma;
            g = x;
        }
        else if (h >= 1 && h <= 2) {
            r = x;
            g = chroma;
        }
        else if (h >= 2 && h <= 3) {
            g = chroma;
            b = x;
        }
        else if (h >= 3 && h <= 4) {
            g = x;
            b = chroma;
        }
        else if (h >= 4 && h <= 5) {
            r = x;
            b = chroma;
        }
        else if (h >= 5 && h <= 6) {
            r = chroma;
            b = x;
        }
        const m = value - chroma;
        result.r = r + m;
        result.g = g + m;
        result.b = b + m;
        return result;
    }
    /**
     * Converts Hue, saturation and value to a new Color3 (RGB)
     * @param hue defines the hue (value between 0 and 360)
     * @param saturation defines the saturation (value between 0 and 1)
     * @param value defines the value (value between 0 and 1)
     * @returns a new Color3 object
     */
    static FromHSV(hue, saturation, value) {
        const result = new Color3(0, 0, 0);
        Color3.HSVtoRGBToRef(hue, saturation, value, result);
        return result;
    }
    /**
     * Creates a new Color3 from the string containing valid hexadecimal values
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color3 object
     */
    static FromHexString(hex) {
        return new Color3(0, 0, 0).fromHexString(hex);
    }
    /**
     * Creates a new Color3 from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns a new Color3 object
     */
    static FromArray(array, offset = 0) {
        return new Color3(array[offset], array[offset + 1], array[offset + 2]);
    }
    /**
     * Creates a new Color3 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @param result defines the target Color3 object
     */
    static FromArrayToRef(array, offset = 0, result) {
        result.r = array[offset];
        result.g = array[offset + 1];
        result.b = array[offset + 2];
    }
    /**
     * Creates a new Color3 from integer values (\< 256)
     * @param r defines the red component to read from (value between 0 and 255)
     * @param g defines the green component to read from (value between 0 and 255)
     * @param b defines the blue component to read from (value between 0 and 255)
     * @returns a new Color3 object
     */
    static FromInts(r, g, b) {
        return new Color3(r / 255.0, g / 255.0, b / 255.0);
    }
    /**
     * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
     * @param start defines the start Color3 value
     * @param end defines the end Color3 value
     * @param amount defines the gradient value between start and end
     * @returns a new Color3 object
     */
    static Lerp(start, end, amount) {
        const result = new Color3(0.0, 0.0, 0.0);
        Color3.LerpToRef(start, end, amount, result);
        return result;
    }
    /**
     * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @param result defines the Color3 object where to store the result
     */
    static LerpToRef(left, right, amount, result) {
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
    }
    /**
     * Returns a new Color3 located for "amount" (float) on the Hermite interpolation spline defined by the vectors "value1", "tangent1", "value2", "tangent2"
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent Color3
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent Color3
     * @param amount defines the amount on the interpolation spline (between 0 and 1)
     * @returns the new Color3
     */
    static Hermite(value1, tangent1, value2, tangent2, amount) {
        const squared = amount * amount;
        const cubed = amount * squared;
        const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
        const part2 = -2.0 * cubed + 3.0 * squared;
        const part3 = cubed - 2.0 * squared + amount;
        const part4 = cubed - squared;
        const r = value1.r * part1 + value2.r * part2 + tangent1.r * part3 + tangent2.r * part4;
        const g = value1.g * part1 + value2.g * part2 + tangent1.g * part3 + tangent2.g * part4;
        const b = value1.b * part1 + value2.b * part2 + tangent1.b * part3 + tangent2.b * part4;
        return new Color3(r, g, b);
    }
    /**
     * Returns a new Color3 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    static Hermite1stDerivative(value1, tangent1, value2, tangent2, time) {
        const result = Color3.Black();
        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);
        return result;
    }
    /**
     * Returns a new Color3 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
    static Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result) {
        const t2 = time * time;
        result.r = (t2 - time) * 6 * value1.r + (3 * t2 - 4 * time + 1) * tangent1.r + (-t2 + time) * 6 * value2.r + (3 * t2 - 2 * time) * tangent2.r;
        result.g = (t2 - time) * 6 * value1.g + (3 * t2 - 4 * time + 1) * tangent1.g + (-t2 + time) * 6 * value2.g + (3 * t2 - 2 * time) * tangent2.g;
        result.b = (t2 - time) * 6 * value1.b + (3 * t2 - 4 * time + 1) * tangent1.b + (-t2 + time) * 6 * value2.b + (3 * t2 - 2 * time) * tangent2.b;
    }
    /**
     * Returns a Color3 value containing a red color
     * @returns a new Color3 object
     */
    static Red() {
        return new Color3(1, 0, 0);
    }
    /**
     * Returns a Color3 value containing a green color
     * @returns a new Color3 object
     */
    static Green() {
        return new Color3(0, 1, 0);
    }
    /**
     * Returns a Color3 value containing a blue color
     * @returns a new Color3 object
     */
    static Blue() {
        return new Color3(0, 0, 1);
    }
    /**
     * Returns a Color3 value containing a black color
     * @returns a new Color3 object
     */
    static Black() {
        return new Color3(0, 0, 0);
    }
    /**
     * Gets a Color3 value containing a black color that must not be updated
     */
    static get BlackReadOnly() {
        return Color3._BlackReadOnly;
    }
    /**
     * Returns a Color3 value containing a white color
     * @returns a new Color3 object
     */
    static White() {
        return new Color3(1, 1, 1);
    }
    /**
     * Returns a Color3 value containing a purple color
     * @returns a new Color3 object
     */
    static Purple() {
        return new Color3(0.5, 0, 0.5);
    }
    /**
     * Returns a Color3 value containing a magenta color
     * @returns a new Color3 object
     */
    static Magenta() {
        return new Color3(1, 0, 1);
    }
    /**
     * Returns a Color3 value containing a yellow color
     * @returns a new Color3 object
     */
    static Yellow() {
        return new Color3(1, 1, 0);
    }
    /**
     * Returns a Color3 value containing a gray color
     * @returns a new Color3 object
     */
    static Gray() {
        return new Color3(0.5, 0.5, 0.5);
    }
    /**
     * Returns a Color3 value containing a teal color
     * @returns a new Color3 object
     */
    static Teal() {
        return new Color3(0, 1.0, 1.0);
    }
    /**
     * Returns a Color3 value containing a random color
     * @returns a new Color3 object
     */
    static Random() {
        return new Color3(Math.random(), Math.random(), Math.random());
    }
}
/**
 * If the first color is flagged with integers (as everything is 0,0,0), V8 stores all of the properties as integers internally because it doesn't know any better yet.
 * If subsequent colors are created with non-integer values, V8 determines that it would be best to represent these properties as doubles instead of integers,
 * and henceforth it will use floating-point representation for all color instances that it creates.
 * But the original color instances are unchanged and has a "deprecated map".
 * If we keep using the color instances from step 1, it will now be a poison pill which will mess up optimizations in any code it touches.
 */
Color3._V8PerformanceHack = new Color3(0.5, 0.5, 0.5);
// Statics
Color3._BlackReadOnly = Color3.Black();
Object.defineProperties(Color3.prototype, {
    dimension: { value: [3] },
    rank: { value: 1 },
});
/**
 * Class used to hold a RBGA color
 */
export class Color4 {
    /**
     * Creates a new Color4 object from red, green, blue values, all between 0 and 1
     * @param r defines the red component (between 0 and 1, default is 0)
     * @param g defines the green component (between 0 and 1, default is 0)
     * @param b defines the blue component (between 0 and 1, default is 0)
     * @param a defines the alpha component (between 0 and 1, default is 1)
     */
    constructor(
    /**
     * [0] Defines the red component (between 0 and 1, default is 0)
     */
    r = 0, 
    /**
     * [0] Defines the green component (between 0 and 1, default is 0)
     */
    g = 0, 
    /**
     * [0] Defines the blue component (between 0 and 1, default is 0)
     */
    b = 0, 
    /**
     * [1] Defines the alpha component (between 0 and 1, default is 1)
     */
    a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    // Operators
    /**
     * Creates a new array populated with 4 numeric elements : red, green, blue, alpha values
     * @returns the new array
     */
    asArray() {
        return [this.r, this.g, this.b, this.a];
    }
    /**
     * Stores from the starting index in the given array the Color4 successive values
     * @param array defines the array where to store the r,g,b components
     * @param index defines an optional index in the target array to define where to start storing values
     * @returns the current Color4 object
     */
    toArray(array, index = 0) {
        array[index] = this.r;
        array[index + 1] = this.g;
        array[index + 2] = this.b;
        array[index + 3] = this.a;
        return this;
    }
    /**
     * Update the current color with values stored in an array from the starting index of the given array
     * @param array defines the source array
     * @param offset defines an offset in the source array
     * @returns the current Color4 object
     */
    fromArray(array, offset = 0) {
        this.r = array[offset];
        this.g = array[offset + 1];
        this.b = array[offset + 2];
        this.a = array[offset + 3];
        return this;
    }
    /**
     * Determines equality between Color4 objects
     * @param otherColor defines the second operand
     * @returns true if the rgba values are equal to the given ones
     */
    equals(otherColor) {
        return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b && this.a === otherColor.a;
    }
    /**
     * Creates a new Color4 set with the added values of the current Color4 and of the given one
     * @param otherColor defines the second operand
     * @returns a new Color4 object
     */
    add(otherColor) {
        return new Color4(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b, this.a + otherColor.a);
    }
    /**
     * Updates the given color "result" with the result of the addition of the current Color4 and the given one.
     * @param otherColor the color to add
     * @param result the color to store the result
     * @returns result input
     */
    addToRef(otherColor, result) {
        result.r = this.r + otherColor.r;
        result.g = this.g + otherColor.g;
        result.b = this.b + otherColor.b;
        result.a = this.a + otherColor.a;
        return result;
    }
    /**
     * Adds in place the given Color4 values to the current Color4 object
     * @param otherColor defines the second operand
     * @returns the current updated Color4 object
     */
    addInPlace(otherColor) {
        this.r += otherColor.r;
        this.g += otherColor.g;
        this.b += otherColor.b;
        this.a += otherColor.a;
        return this;
    }
    /**
     * Adds the given coordinates to the current Color4
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    addInPlaceFromFloats(r, g, b, a) {
        this.r += r;
        this.g += g;
        this.b += b;
        this.a += a;
        return this;
    }
    /**
     * Creates a new Color4 set with the subtracted values of the given one from the current Color4
     * @param otherColor defines the second operand
     * @returns a new Color4 object
     */
    subtract(otherColor) {
        return new Color4(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b, this.a - otherColor.a);
    }
    /**
     * Subtracts the given ones from the current Color4 values and stores the results in "result"
     * @param otherColor defines the second operand
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4 object
     */
    subtractToRef(otherColor, result) {
        result.r = this.r - otherColor.r;
        result.g = this.g - otherColor.g;
        result.b = this.b - otherColor.b;
        result.a = this.a - otherColor.a;
        return result;
    }
    /**
     * Subtract in place the given color from the current Color4.
     * @param otherColor the color to subtract
     * @returns the updated Color4.
     */
    subtractInPlace(otherColor) {
        this.r -= otherColor.r;
        this.g -= otherColor.g;
        this.b -= otherColor.b;
        this.a -= otherColor.a;
        return this;
    }
    /**
     * Returns a new Color4 set with the result of the subtraction of the given floats from the current Color4 coordinates.
     * @param r value to subtract
     * @param g value to subtract
     * @param b value to subtract
     * @param a value to subtract
     * @returns new color containing the result
     */
    subtractFromFloats(r, g, b, a) {
        return new Color4(this.r - r, this.g - g, this.b - b, this.a - a);
    }
    /**
     * Sets the given color "result" set with the result of the subtraction of the given floats from the current Color4 coordinates.
     * @param r value to subtract
     * @param g value to subtract
     * @param b value to subtract
     * @param a value to subtract
     * @param result the color to store the result in
     * @returns result input
     */
    subtractFromFloatsToRef(r, g, b, a, result) {
        result.r = this.r - r;
        result.g = this.g - g;
        result.b = this.b - b;
        result.a = this.a - a;
        return result;
    }
    /**
     * Creates a new Color4 with the current Color4 values multiplied by scale
     * @param scale defines the scaling factor to apply
     * @returns a new Color4 object
     */
    scale(scale) {
        return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
    }
    /**
     * Multiplies the Color4 values by the float "scale"
     * @param scale defines the scaling factor to apply
     * @returns the current updated Color4
     */
    scaleInPlace(scale) {
        this.r *= scale;
        this.g *= scale;
        this.b *= scale;
        this.a *= scale;
        return this;
    }
    /**
     * Multiplies the current Color4 values by scale and stores the result in "result"
     * @param scale defines the scaling factor to apply
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4
     */
    scaleToRef(scale, result) {
        result.r = this.r * scale;
        result.g = this.g * scale;
        result.b = this.b * scale;
        result.a = this.a * scale;
        return result;
    }
    /**
     * Scale the current Color4 values by a factor and add the result to a given Color4
     * @param scale defines the scale factor
     * @param result defines the Color4 object where to store the result
     * @returns the result Color4
     */
    scaleAndAddToRef(scale, result) {
        result.r += this.r * scale;
        result.g += this.g * scale;
        result.b += this.b * scale;
        result.a += this.a * scale;
        return result;
    }
    /**
     * Clamps the rgb values by the min and max values and stores the result into "result"
     * @param min defines minimum clamping value (default is 0)
     * @param max defines maximum clamping value (default is 1)
     * @param result defines color to store the result into.
     * @returns the result Color4
     */
    clampToRef(min = 0, max = 1, result) {
        result.r = Clamp(this.r, min, max);
        result.g = Clamp(this.g, min, max);
        result.b = Clamp(this.b, min, max);
        result.a = Clamp(this.a, min, max);
        return result;
    }
    /**
     * Multiply an Color4 value by another and return a new Color4 object
     * @param color defines the Color4 value to multiply by
     * @returns a new Color4 object
     */
    multiply(color) {
        return new Color4(this.r * color.r, this.g * color.g, this.b * color.b, this.a * color.a);
    }
    /**
     * Multiply a Color4 value by another and push the result in a reference value
     * @param color defines the Color4 value to multiply by
     * @param result defines the Color4 to fill the result in
     * @returns the result Color4
     */
    multiplyToRef(color, result) {
        result.r = this.r * color.r;
        result.g = this.g * color.g;
        result.b = this.b * color.b;
        result.a = this.a * color.a;
        return result;
    }
    /**
     * Multiplies in place the current Color4 by the given one.
     * @param otherColor color to multiple with
     * @returns the updated Color4.
     */
    multiplyInPlace(otherColor) {
        this.r *= otherColor.r;
        this.g *= otherColor.g;
        this.b *= otherColor.b;
        this.a *= otherColor.a;
        return this;
    }
    /**
     * Returns a new Color4 set with the multiplication result of the given floats and the current Color4 coordinates.
     * @param r value multiply with
     * @param g value multiply with
     * @param b value multiply with
     * @param a value multiply with
     * @returns resulting new color
     */
    multiplyByFloats(r, g, b, a) {
        return new Color4(this.r * r, this.g * g, this.b * b, this.a * a);
    }
    /**
     * @internal
     * Do not use
     */
    divide(_other) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * @internal
     * Do not use
     */
    divideToRef(_other, _result) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * @internal
     * Do not use
     */
    divideInPlace(_other) {
        throw new ReferenceError("Can not divide a color");
    }
    /**
     * Updates the Color4 coordinates with the minimum values between its own and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color4
     */
    minimizeInPlace(other) {
        this.r = Math.min(this.r, other.r);
        this.g = Math.min(this.g, other.g);
        this.b = Math.min(this.b, other.b);
        this.a = Math.min(this.a, other.a);
        return this;
    }
    /**
     * Updates the Color4 coordinates with the maximum values between its own and the given color ones
     * @param other defines the second operand
     * @returns the current updated Color4
     */
    maximizeInPlace(other) {
        this.r = Math.max(this.r, other.r);
        this.g = Math.max(this.g, other.g);
        this.b = Math.max(this.b, other.b);
        this.a = Math.max(this.a, other.a);
        return this;
    }
    /**
     * Updates the current Color4 with the minimal coordinate values between its and the given coordinates
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    minimizeInPlaceFromFloats(r, g, b, a) {
        this.r = Math.min(r, this.r);
        this.g = Math.min(g, this.g);
        this.b = Math.min(b, this.b);
        this.a = Math.min(a, this.a);
        return this;
    }
    /**
     * Updates the current Color4 with the maximal coordinate values between its and the given coordinates.
     * @param r defines the r coordinate of the operand
     * @param g defines the g coordinate of the operand
     * @param b defines the b coordinate of the operand
     * @param a defines the a coordinate of the operand
     * @returns the current updated Color4
     */
    maximizeInPlaceFromFloats(r, g, b, a) {
        this.r = Math.max(r, this.r);
        this.g = Math.max(g, this.g);
        this.b = Math.max(b, this.b);
        this.a = Math.max(a, this.a);
        return this;
    }
    /**
     * @internal
     * Do not use
     */
    floorToRef(_result) {
        throw new ReferenceError("Can not floor a color");
    }
    /**
     * @internal
     * Do not use
     */
    floor() {
        throw new ReferenceError("Can not floor a color");
    }
    /**
     * @internal
     * Do not use
     */
    fractToRef(_result) {
        throw new ReferenceError("Can not fract a color");
    }
    /**
     * @internal
     * Do not use
     */
    fract() {
        throw new ReferenceError("Can not fract a color");
    }
    /**
     * @internal
     * Do not use
     */
    negate() {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * @internal
     * Do not use
     */
    negateInPlace() {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * @internal
     * Do not use
     */
    negateToRef(_result) {
        throw new ReferenceError("Can not negate a color");
    }
    /**
     * Boolean : True if the current Color4 coordinates are each beneath the distance "epsilon" from the given color ones.
     * @param otherColor color to compare against
     * @param epsilon (Default: very small number)
     * @returns true if they are equal
     */
    equalsWithEpsilon(otherColor, epsilon = Epsilon) {
        return (WithinEpsilon(this.r, otherColor.r, epsilon) &&
            WithinEpsilon(this.g, otherColor.g, epsilon) &&
            WithinEpsilon(this.b, otherColor.b, epsilon) &&
            WithinEpsilon(this.a, otherColor.a, epsilon));
    }
    /**
     * Boolean : True if the given floats are strictly equal to the current Color4 coordinates.
     * @param x x value to compare against
     * @param y y value to compare against
     * @param z z value to compare against
     * @param w w value to compare against
     * @returns true if equal
     */
    equalsToFloats(x, y, z, w) {
        return this.r === x && this.g === y && this.b === z && this.a === w;
    }
    /**
     * Creates a string with the Color4 current values
     * @returns the string representation of the Color4 object
     */
    toString() {
        return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
    }
    /**
     * Returns the string "Color4"
     * @returns "Color4"
     */
    getClassName() {
        return "Color4";
    }
    /**
     * Compute the Color4 hash code
     * @returns an unique number that can be used to hash Color4 objects
     */
    getHashCode() {
        let hash = (this.r * 255) | 0;
        hash = (hash * 397) ^ ((this.g * 255) | 0);
        hash = (hash * 397) ^ ((this.b * 255) | 0);
        hash = (hash * 397) ^ ((this.a * 255) | 0);
        return hash;
    }
    /**
     * Creates a new Color4 copied from the current one
     * @returns a new Color4 object
     */
    clone() {
        const result = new Color4();
        return result.copyFrom(this);
    }
    /**
     * Copies the given Color4 values into the current one
     * @param source defines the source Color4 object
     * @returns the current updated Color4 object
     */
    copyFrom(source) {
        this.r = source.r;
        this.g = source.g;
        this.b = source.b;
        this.a = source.a;
        return this;
    }
    /**
     * Copies the given float values into the current one
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @param a defines the alpha component to read from
     * @returns the current updated Color4 object
     */
    copyFromFloats(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }
    /**
     * Copies the given float values into the current one
     * @param r defines the red component to read from
     * @param g defines the green component to read from
     * @param b defines the blue component to read from
     * @param a defines the alpha component to read from
     * @returns the current updated Color4 object
     */
    set(r, g, b, a) {
        return this.copyFromFloats(r, g, b, a);
    }
    /**
     * Copies the given float to the current Vector4 coordinates
     * @param v defines the r, g, b, and a coordinates of the operand
     * @returns the current updated Vector4
     */
    setAll(v) {
        this.r = this.g = this.b = this.a = v;
        return this;
    }
    /**
     * Compute the Color4 hexadecimal code as a string
     * @param returnAsColor3 defines if the string should only contains RGB values (off by default)
     * @returns a string containing the hexadecimal representation of the Color4 object
     */
    toHexString(returnAsColor3 = false) {
        const intR = Math.round(this.r * 255);
        const intG = Math.round(this.g * 255);
        const intB = Math.round(this.b * 255);
        if (returnAsColor3) {
            return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB);
        }
        const intA = Math.round(this.a * 255);
        return "#" + ToHex(intR) + ToHex(intG) + ToHex(intB) + ToHex(intA);
    }
    /**
     * Updates the Color4 rgba values from the string containing valid hexadecimal values.
     *
     * A valid hex string is either in the format #RRGGBB or #RRGGBBAA.
     *
     * When a hex string without alpha is passed, the resulting Color4 keeps
     * its previous alpha value.
     *
     * An invalid string does not modify this object
     *
     * @param hex defines a string containing valid hexadecimal values
     * @returns the current updated Color4 object
     */
    fromHexString(hex) {
        if (hex.substring(0, 1) !== "#" || (hex.length !== 9 && hex.length !== 7)) {
            return this;
        }
        this.r = parseInt(hex.substring(1, 3), 16) / 255;
        this.g = parseInt(hex.substring(3, 5), 16) / 255;
        this.b = parseInt(hex.substring(5, 7), 16) / 255;
        if (hex.length === 9) {
            this.a = parseInt(hex.substring(7, 9), 16) / 255;
        }
        return this;
    }
    /**
     * Computes a new Color4 converted from the current one to linear space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color4 object
     */
    toLinearSpace(exact = false) {
        const convertedColor = new Color4();
        this.toLinearSpaceToRef(convertedColor, exact);
        return convertedColor;
    }
    /**
     * Converts the Color4 values to linear space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the linear space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color4
     */
    toLinearSpaceToRef(convertedColor, exact = false) {
        if (exact) {
            convertedColor.r = colorChannelToLinearSpaceExact(this.r);
            convertedColor.g = colorChannelToLinearSpaceExact(this.g);
            convertedColor.b = colorChannelToLinearSpaceExact(this.b);
        }
        else {
            convertedColor.r = colorChannelToLinearSpace(this.r);
            convertedColor.g = colorChannelToLinearSpace(this.g);
            convertedColor.b = colorChannelToLinearSpace(this.b);
        }
        convertedColor.a = this.a;
        return this;
    }
    /**
     * Computes a new Color4 converted from the current one to gamma space
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns a new Color4 object
     */
    toGammaSpace(exact = false) {
        const convertedColor = new Color4();
        this.toGammaSpaceToRef(convertedColor, exact);
        return convertedColor;
    }
    /**
     * Converts the Color4 values to gamma space and stores the result in "convertedColor"
     * @param convertedColor defines the Color4 object where to store the gamma space version
     * @param exact defines if the conversion will be done in an exact way which is slower but more accurate (default is false)
     * @returns the unmodified Color4
     */
    toGammaSpaceToRef(convertedColor, exact = false) {
        if (exact) {
            convertedColor.r = colorChannelToGammaSpaceExact(this.r);
            convertedColor.g = colorChannelToGammaSpaceExact(this.g);
            convertedColor.b = colorChannelToGammaSpaceExact(this.b);
        }
        else {
            convertedColor.r = colorChannelToGammaSpace(this.r);
            convertedColor.g = colorChannelToGammaSpace(this.g);
            convertedColor.b = colorChannelToGammaSpace(this.b);
        }
        convertedColor.a = this.a;
        return this;
    }
    // Statics
    /**
     * Creates a new Color4 from the string containing valid hexadecimal values.
     *
     * A valid hex string is either in the format #RRGGBB or #RRGGBBAA.
     *
     * When a hex string without alpha is passed, the resulting Color4 has
     * its alpha value set to 1.0.
     *
     * An invalid string results in a Color with all its channels set to 0.0,
     * i.e. "transparent black".
     *
     * @param hex defines a string containing valid hexadecimal values
     * @returns a new Color4 object
     */
    static FromHexString(hex) {
        if (hex.substring(0, 1) !== "#" || (hex.length !== 9 && hex.length !== 7)) {
            return new Color4(0.0, 0.0, 0.0, 0.0);
        }
        return new Color4(0.0, 0.0, 0.0, 1.0).fromHexString(hex);
    }
    /**
     * Creates a new Color4 object set with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @returns a new Color4 object
     */
    static Lerp(left, right, amount) {
        return Color4.LerpToRef(left, right, amount, new Color4());
    }
    /**
     * Set the given "result" with the linearly interpolated values of "amount" between the left Color4 object and the right Color4 object
     * @param left defines the start value
     * @param right defines the end value
     * @param amount defines the gradient factor
     * @param result defines the Color4 object where to store data
     * @returns the updated result
     */
    static LerpToRef(left, right, amount, result) {
        result.r = left.r + (right.r - left.r) * amount;
        result.g = left.g + (right.g - left.g) * amount;
        result.b = left.b + (right.b - left.b) * amount;
        result.a = left.a + (right.a - left.a) * amount;
        return result;
    }
    /**
     * Interpolate between two Color4 using Hermite interpolation
     * @param value1 defines first Color4
     * @param tangent1 defines the incoming tangent
     * @param value2 defines second Color4
     * @param tangent2 defines the outgoing tangent
     * @param amount defines the target Color4
     * @returns the new interpolated Color4
     */
    static Hermite(value1, tangent1, value2, tangent2, amount) {
        const squared = amount * amount;
        const cubed = amount * squared;
        const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
        const part2 = -2.0 * cubed + 3.0 * squared;
        const part3 = cubed - 2.0 * squared + amount;
        const part4 = cubed - squared;
        const r = value1.r * part1 + value2.r * part2 + tangent1.r * part3 + tangent2.r * part4;
        const g = value1.g * part1 + value2.g * part2 + tangent1.g * part3 + tangent2.g * part4;
        const b = value1.b * part1 + value2.b * part2 + tangent1.b * part3 + tangent2.b * part4;
        const a = value1.a * part1 + value2.a * part2 + tangent1.a * part3 + tangent2.a * part4;
        return new Color4(r, g, b, a);
    }
    /**
     * Returns a new Color4 which is the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @returns 1st derivative
     */
    static Hermite1stDerivative(value1, tangent1, value2, tangent2, time) {
        const result = new Color4();
        this.Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result);
        return result;
    }
    /**
     * Update a Color4 with the 1st derivative of the Hermite spline defined by the colors "value1", "value2", "tangent1", "tangent2".
     * @param value1 defines the first control point
     * @param tangent1 defines the first tangent
     * @param value2 defines the second control point
     * @param tangent2 defines the second tangent
     * @param time define where the derivative must be done
     * @param result define where to store the derivative
     */
    static Hermite1stDerivativeToRef(value1, tangent1, value2, tangent2, time, result) {
        const t2 = time * time;
        result.r = (t2 - time) * 6 * value1.r + (3 * t2 - 4 * time + 1) * tangent1.r + (-t2 + time) * 6 * value2.r + (3 * t2 - 2 * time) * tangent2.r;
        result.g = (t2 - time) * 6 * value1.g + (3 * t2 - 4 * time + 1) * tangent1.g + (-t2 + time) * 6 * value2.g + (3 * t2 - 2 * time) * tangent2.g;
        result.b = (t2 - time) * 6 * value1.b + (3 * t2 - 4 * time + 1) * tangent1.b + (-t2 + time) * 6 * value2.b + (3 * t2 - 2 * time) * tangent2.b;
        result.a = (t2 - time) * 6 * value1.a + (3 * t2 - 4 * time + 1) * tangent1.a + (-t2 + time) * 6 * value2.a + (3 * t2 - 2 * time) * tangent2.a;
    }
    /**
     * Creates a new Color4 from a Color3 and an alpha value
     * @param color3 defines the source Color3 to read from
     * @param alpha defines the alpha component (1.0 by default)
     * @returns a new Color4 object
     */
    static FromColor3(color3, alpha = 1.0) {
        return new Color4(color3.r, color3.g, color3.b, alpha);
    }
    /**
     * Creates a new Color4 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @returns a new Color4 object
     */
    static FromArray(array, offset = 0) {
        return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }
    /**
     * Creates a new Color4 from the starting index element of the given array
     * @param array defines the source array to read from
     * @param offset defines the offset in the source array
     * @param result defines the target Color4 object
     */
    static FromArrayToRef(array, offset = 0, result) {
        result.r = array[offset];
        result.g = array[offset + 1];
        result.b = array[offset + 2];
        result.a = array[offset + 3];
    }
    /**
     * Creates a new Color3 from integer values (less than 256)
     * @param r defines the red component to read from (value between 0 and 255)
     * @param g defines the green component to read from (value between 0 and 255)
     * @param b defines the blue component to read from (value between 0 and 255)
     * @param a defines the alpha component to read from (value between 0 and 255)
     * @returns a new Color3 object
     */
    static FromInts(r, g, b, a) {
        return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
    }
    /**
     * Check the content of a given array and convert it to an array containing RGBA data
     * If the original array was already containing count * 4 values then it is returned directly
     * @param colors defines the array to check
     * @param count defines the number of RGBA data to expect
     * @returns an array containing count * 4 values (RGBA)
     */
    static CheckColors4(colors, count) {
        // Check if color3 was used
        if (colors.length === count * 3) {
            const colors4 = [];
            for (let index = 0; index < colors.length; index += 3) {
                const newIndex = (index / 3) * 4;
                colors4[newIndex] = colors[index];
                colors4[newIndex + 1] = colors[index + 1];
                colors4[newIndex + 2] = colors[index + 2];
                colors4[newIndex + 3] = 1.0;
            }
            return colors4;
        }
        return colors;
    }
}
/**
 * If the first color is flagged with integers (as everything is 0,0,0,0), V8 stores all of the properties as integers internally because it doesn't know any better yet.
 * If subsequent colors are created with non-integer values, V8 determines that it would be best to represent these properties as doubles instead of integers,
 * and henceforth it will use floating-point representation for all color instances that it creates.
 * But the original color instances are unchanged and has a "deprecated map".
 * If we keep using the color instances from step 1, it will now be a poison pill which will mess up optimizations in any code it touches.
 */
Color4._V8PerformanceHack = new Color4(0.5, 0.5, 0.5, 0.5);
Object.defineProperties(Color4.prototype, {
    dimension: { value: [4] },
    rank: { value: 1 },
});
/**
 * @internal
 */
export class TmpColors {
}
TmpColors.Color3 = BuildArray(3, Color3.Black);
TmpColors.Color4 = BuildArray(3, () => new Color4(0, 0, 0, 0));
RegisterClass("BABYLON.Color3", Color3);
RegisterClass("BABYLON.Color4", Color4);
//# sourceMappingURL=math.color.js.map