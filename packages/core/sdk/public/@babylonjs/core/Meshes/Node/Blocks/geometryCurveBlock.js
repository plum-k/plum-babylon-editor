import { __decorate } from "../../../tslib.es6.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Types of curves supported by the Curve block
 */
export var GeometryCurveBlockTypes;
(function (GeometryCurveBlockTypes) {
    /** EaseInSine */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInSine"] = 0] = "EaseInSine";
    /** EaseOutSine */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutSine"] = 1] = "EaseOutSine";
    /** EaseInOutSine */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutSine"] = 2] = "EaseInOutSine";
    /** EaseInQuad */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInQuad"] = 3] = "EaseInQuad";
    /** EaseOutQuad */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutQuad"] = 4] = "EaseOutQuad";
    /** EaseInOutQuad */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutQuad"] = 5] = "EaseInOutQuad";
    /** EaseInCubic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInCubic"] = 6] = "EaseInCubic";
    /** EaseOutCubic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutCubic"] = 7] = "EaseOutCubic";
    /** EaseInOutCubic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutCubic"] = 8] = "EaseInOutCubic";
    /** EaseInQuart */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInQuart"] = 9] = "EaseInQuart";
    /** EaseOutQuart */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutQuart"] = 10] = "EaseOutQuart";
    /** EaseInOutQuart */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutQuart"] = 11] = "EaseInOutQuart";
    /** EaseInQuint */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInQuint"] = 12] = "EaseInQuint";
    /** EaseOutQuint */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutQuint"] = 13] = "EaseOutQuint";
    /** EaseInOutQuint */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutQuint"] = 14] = "EaseInOutQuint";
    /** EaseInExpo */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInExpo"] = 15] = "EaseInExpo";
    /** EaseOutExpo */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutExpo"] = 16] = "EaseOutExpo";
    /** EaseInOutExpo */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutExpo"] = 17] = "EaseInOutExpo";
    /** EaseInCirc */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInCirc"] = 18] = "EaseInCirc";
    /** EaseOutCirc */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutCirc"] = 19] = "EaseOutCirc";
    /** EaseInOutCirc */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutCirc"] = 20] = "EaseInOutCirc";
    /** EaseInBack */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInBack"] = 21] = "EaseInBack";
    /** EaseOutBack */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutBack"] = 22] = "EaseOutBack";
    /** EaseInOutBack */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutBack"] = 23] = "EaseInOutBack";
    /** EaseInElastic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInElastic"] = 24] = "EaseInElastic";
    /** EaseOutElastic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseOutElastic"] = 25] = "EaseOutElastic";
    /** EaseInOutElastic */
    GeometryCurveBlockTypes[GeometryCurveBlockTypes["EaseInOutElastic"] = 26] = "EaseInOutElastic";
})(GeometryCurveBlockTypes || (GeometryCurveBlockTypes = {}));
/**
 * Block used to apply curve operation
 */
export class GeometryCurveBlock extends NodeGeometryBlock {
    /**
     * Creates a new CurveBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets the type of the curve applied by the block
         */
        this.type = GeometryCurveBlockTypes.EaseInOutSine;
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Int);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryCurveBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock() {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        let func;
        switch (this.type) {
            case GeometryCurveBlockTypes.EaseInSine:
                func = (v) => 1.0 - Math.cos((v * 3.1415) / 2.0);
                break;
            case GeometryCurveBlockTypes.EaseOutSine:
                func = (v) => Math.sin((v * 3.1415) / 2.0);
                break;
            case GeometryCurveBlockTypes.EaseInOutSine:
                func = (v) => -(Math.cos(v * 3.1415) - 1.0) / 2.0;
                break;
            case GeometryCurveBlockTypes.EaseInQuad:
                func = (v) => v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuad:
                func = (v) => (1.0 - v) * (1.0 - v);
                break;
            case GeometryCurveBlockTypes.EaseInOutQuad: {
                func = (v) => (v < 0.5 ? 2.0 * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 2.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInCubic:
                func = (v) => v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutCubic: {
                func = (v) => 1.0 - Math.pow(1.0 - v, 3.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutCubic: {
                func = (v) => (v < 0.5 ? 4.0 * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 3.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInQuart:
                func = (v) => v * v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuart: {
                func = (v) => 1.0 - Math.pow(1.0 - v, 4.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutQuart: {
                func = (v) => (v < 0.5 ? 8.0 * v * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 4.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInQuint:
                func = (v) => v * v * v * v * v;
                break;
            case GeometryCurveBlockTypes.EaseOutQuint: {
                func = (v) => 1.0 - Math.pow(1.0 - v, 5.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutQuint: {
                func = (v) => (v < 0.5 ? 16.0 * v * v * v * v * v : 1.0 - Math.pow(-2.0 * v + 2.0, 5.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInExpo: {
                func = (v) => (v === 0.0 ? 0.0 : Math.pow(2.0, 10.0 * v - 10.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutExpo: {
                func = (v) => (v === 1.0 ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * v));
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutExpo: {
                func = (v) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : v < 0.5 ? Math.pow(2.0, 20.0 * v - 10.0) / 2.0 : (2.0 - Math.pow(2.0, -20.0 * v + 10.0)) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInCirc: {
                func = (v) => 1.0 - Math.sqrt(1.0 - Math.pow(v, 2.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutCirc: {
                func = (v) => Math.sqrt(1.0 - Math.pow(v - 1.0, 2.0));
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutCirc: {
                func = (v) => (v < 0.5 ? (1.0 - Math.sqrt(1.0 - Math.pow(2.0 * v, 2.0))) / 2.0 : (Math.sqrt(1.0 - Math.pow(-2.0 * v + 2.0, 2.0)) + 1.0) / 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInBack: {
                func = (v) => 2.70158 * v * v * v - 1.70158 * v * v;
                break;
            }
            case GeometryCurveBlockTypes.EaseOutBack: {
                func = (v) => 2.70158 * Math.pow(v - 1.0, 3.0) + 1.70158 * Math.pow(v - 1.0, 2.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutBack: {
                func = (v) => v < 0.5
                    ? (Math.pow(2.0 * v, 2.0) * (3.5949095 * 2.0 * v - 2.5949095)) / 2.0
                    : (Math.pow(2.0 * v - 2.0, 2.0) * (3.5949095 * (v * 2.0 - 2.0) + 3.5949095) + 2.0) / 2.0;
                break;
            }
            case GeometryCurveBlockTypes.EaseInElastic: {
                func = (v) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : -Math.pow(2.0, 10.0 * v - 10.0) * Math.sin((v * 10.0 - 10.75) * ((2.0 * 3.1415) / 3.0)));
                break;
            }
            case GeometryCurveBlockTypes.EaseOutElastic: {
                func = (v) => (v === 0.0 ? 0.0 : v === 1.0 ? 1.0 : Math.pow(2.0, -10.0 * v) * Math.sin((v * 10.0 - 0.75) * ((2.0 * 3.1415) / 3.0)) + 1.0);
                break;
            }
            case GeometryCurveBlockTypes.EaseInOutElastic: {
                func = (v) => v === 0.0
                    ? 0.0
                    : v == 1.0
                        ? 1.0
                        : v < 0.5
                            ? -(Math.pow(2.0, 20.0 * v - 10.0) * Math.sin((20.0 * v - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0
                            : (Math.pow(2.0, -20.0 * v + 10.0) * Math.sin((20.0 * v - 11.125) * ((2.0 * 3.1415) / 4.5))) / 2.0 + 1.0;
                break;
            }
        }
        this.output._storedFunction = (state) => {
            const input = this.input.getConnectedValue(state);
            switch (this.input.type) {
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func(input);
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(input.x), func(input.y));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(input.x), func(input.y), func(input.z));
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    return new Vector4(func(input.x), func(input.y), func(input.z), func(input.w));
                }
            }
            return 0;
        };
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.curveType = this.type;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.type = serializationObject.curveType;
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.type = BABYLON.GeometryCurveBlockTypes.${GeometryCurveBlockTypes[this.type]};\n`;
        return codeString;
    }
}
__decorate([
    editableInPropertyPage("Type", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "EaseInSine", value: GeometryCurveBlockTypes.EaseInSine },
            { label: "EaseOutSine", value: GeometryCurveBlockTypes.EaseOutSine },
            { label: "EaseInOutSine", value: GeometryCurveBlockTypes.EaseInOutSine },
            { label: "EaseInQuad", value: GeometryCurveBlockTypes.EaseInQuad },
            { label: "EaseOutQuad", value: GeometryCurveBlockTypes.EaseOutQuad },
            { label: "EaseInOutQuad", value: GeometryCurveBlockTypes.EaseInOutQuad },
            { label: "EaseInCubic", value: GeometryCurveBlockTypes.EaseInCubic },
            { label: "EaseOutCubic", value: GeometryCurveBlockTypes.EaseOutCubic },
            { label: "EaseInOutCubic", value: GeometryCurveBlockTypes.EaseInOutCubic },
            { label: "EaseInQuart", value: GeometryCurveBlockTypes.EaseInQuart },
            { label: "EaseOutQuart", value: GeometryCurveBlockTypes.EaseOutQuart },
            { label: "EaseInOutQuart", value: GeometryCurveBlockTypes.EaseInOutQuart },
            { label: "EaseInQuint", value: GeometryCurveBlockTypes.EaseInQuint },
            { label: "EaseOutQuint", value: GeometryCurveBlockTypes.EaseOutQuint },
            { label: "EaseInOutQuint", value: GeometryCurveBlockTypes.EaseInOutQuint },
            { label: "EaseInExpo", value: GeometryCurveBlockTypes.EaseInExpo },
            { label: "EaseOutExpo", value: GeometryCurveBlockTypes.EaseOutExpo },
            { label: "EaseInOutExpo", value: GeometryCurveBlockTypes.EaseInOutExpo },
            { label: "EaseInCirc", value: GeometryCurveBlockTypes.EaseInCirc },
            { label: "EaseOutCirc", value: GeometryCurveBlockTypes.EaseOutCirc },
            { label: "EaseInOutCirc", value: GeometryCurveBlockTypes.EaseInOutCirc },
            { label: "EaseInBack", value: GeometryCurveBlockTypes.EaseInBack },
            { label: "EaseOutBack", value: GeometryCurveBlockTypes.EaseOutBack },
            { label: "EaseInOutBack", value: GeometryCurveBlockTypes.EaseInOutBack },
            { label: "EaseInElastic", value: GeometryCurveBlockTypes.EaseInElastic },
            { label: "EaseOutElastic", value: GeometryCurveBlockTypes.EaseOutElastic },
            { label: "EaseInOutElastic", value: GeometryCurveBlockTypes.EaseInOutElastic },
        ],
    })
], GeometryCurveBlock.prototype, "type", void 0);
RegisterClass("BABYLON.GeometryCurveBlock", GeometryCurveBlock);
//# sourceMappingURL=geometryCurveBlock.js.map