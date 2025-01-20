import { DeepCopier } from "../Misc/deepCopier.js";
import { Color3 } from "../Maths/math.color.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";

import { AbstractEngine } from "../Engines/abstractEngine.js";
/**
 * This represents all the required information to add a fresnel effect on a material:
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/fresnelParameters
 */
export class FresnelParameters {
    /**
     * Define if the fresnel effect is enable or not.
     */
    get isEnabled() {
        return this._isEnabled;
    }
    set isEnabled(value) {
        if (this._isEnabled === value) {
            return;
        }
        this._isEnabled = value;
        AbstractEngine.MarkAllMaterialsAsDirty(4 | 16);
    }
    /**
     * Creates a new FresnelParameters object.
     *
     * @param options provide your own settings to optionally to override defaults
     */
    constructor(options = {}) {
        this._isEnabled = true;
        this.bias = options.bias === undefined ? 0 : options.bias;
        this.power = options.power === undefined ? 1 : options.power;
        this.leftColor = options.leftColor || Color3.White();
        this.rightColor = options.rightColor || Color3.Black();
        if (options.isEnabled === false) {
            this.isEnabled = false;
        }
    }
    /**
     * Clones the current fresnel and its values
     * @returns a clone fresnel configuration
     */
    clone() {
        const newFresnelParameters = new FresnelParameters();
        DeepCopier.DeepCopy(this, newFresnelParameters);
        return newFresnelParameters;
    }
    /**
     * Determines equality between FresnelParameters objects
     * @param otherFresnelParameters defines the second operand
     * @returns true if the power, bias, leftColor, rightColor and isEnabled values are equal to the given ones
     */
    equals(otherFresnelParameters) {
        return (otherFresnelParameters &&
            this.bias === otherFresnelParameters.bias &&
            this.power === otherFresnelParameters.power &&
            this.leftColor.equals(otherFresnelParameters.leftColor) &&
            this.rightColor.equals(otherFresnelParameters.rightColor) &&
            this.isEnabled === otherFresnelParameters.isEnabled);
    }
    /**
     * Serializes the current fresnel parameters to a JSON representation.
     * @returns the JSON serialization
     */
    serialize() {
        return {
            isEnabled: this.isEnabled,
            leftColor: this.leftColor.asArray(),
            rightColor: this.rightColor.asArray(),
            bias: this.bias,
            power: this.power,
        };
    }
    /**
     * Parse a JSON object and deserialize it to a new Fresnel parameter object.
     * @param parsedFresnelParameters Define the JSON representation
     * @returns the parsed parameters
     */
    static Parse(parsedFresnelParameters) {
        return new FresnelParameters({
            isEnabled: parsedFresnelParameters.isEnabled,
            leftColor: Color3.FromArray(parsedFresnelParameters.leftColor),
            rightColor: Color3.FromArray(parsedFresnelParameters.rightColor),
            bias: parsedFresnelParameters.bias,
            power: parsedFresnelParameters.power || 1.0,
        });
    }
}
// References the dependencies.
SerializationHelper._FresnelParametersParser = FresnelParameters.Parse;
//# sourceMappingURL=fresnelParameters.js.map