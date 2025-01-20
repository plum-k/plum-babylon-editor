import { __decorate } from "../../../tslib.es6.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Operations supported by the Trigonometry block
 */
export var GeometryTrigonometryBlockOperations;
(function (GeometryTrigonometryBlockOperations) {
    /** Cos */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Cos"] = 0] = "Cos";
    /** Sin */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Sin"] = 1] = "Sin";
    /** Abs */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Abs"] = 2] = "Abs";
    /** Exp */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Exp"] = 3] = "Exp";
    /** Round */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Round"] = 4] = "Round";
    /** Floor */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Floor"] = 5] = "Floor";
    /** Ceiling */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Ceiling"] = 6] = "Ceiling";
    /** Square root */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Sqrt"] = 7] = "Sqrt";
    /** Log */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Log"] = 8] = "Log";
    /** Tangent */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Tan"] = 9] = "Tan";
    /** Arc tangent */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["ArcTan"] = 10] = "ArcTan";
    /** Arc cosinus */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["ArcCos"] = 11] = "ArcCos";
    /** Arc sinus */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["ArcSin"] = 12] = "ArcSin";
    /** Sign */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Sign"] = 13] = "Sign";
    /** Negate */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Negate"] = 14] = "Negate";
    /** OneMinus */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["OneMinus"] = 15] = "OneMinus";
    /** Reciprocal */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Reciprocal"] = 16] = "Reciprocal";
    /** ToDegrees */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["ToDegrees"] = 17] = "ToDegrees";
    /** ToRadians */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["ToRadians"] = 18] = "ToRadians";
    /** Fract */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Fract"] = 19] = "Fract";
    /** Exp2 */
    GeometryTrigonometryBlockOperations[GeometryTrigonometryBlockOperations["Exp2"] = 20] = "Exp2";
})(GeometryTrigonometryBlockOperations || (GeometryTrigonometryBlockOperations = {}));
/**
 * Block used to apply trigonometry operation to floats
 */
export class GeometryTrigonometryBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryTrigonometryBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets the operation applied by the block
         */
        this.operation = GeometryTrigonometryBlockOperations.Cos;
        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryTrigonometryBlock";
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
    _buildBlock(state) {
        super._buildBlock(state);
        let func = null;
        switch (this.operation) {
            case GeometryTrigonometryBlockOperations.Cos: {
                func = (value) => Math.cos(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sin: {
                func = (value) => Math.sin(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Abs: {
                func = (value) => Math.abs(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Exp: {
                func = (value) => Math.exp(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Exp2: {
                func = (value) => Math.pow(2, value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Round: {
                func = (value) => Math.round(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Floor: {
                func = (value) => Math.floor(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Ceiling: {
                func = (value) => Math.ceil(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sqrt: {
                func = (value) => Math.sqrt(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Log: {
                func = (value) => Math.log(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Tan: {
                func = (value) => Math.tan(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcTan: {
                func = (value) => Math.atan(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcCos: {
                func = (value) => Math.acos(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.ArcSin: {
                func = (value) => Math.asin(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Sign: {
                func = (value) => Math.sign(value);
                break;
            }
            case GeometryTrigonometryBlockOperations.Negate: {
                func = (value) => -value;
                break;
            }
            case GeometryTrigonometryBlockOperations.OneMinus: {
                func = (value) => 1 - value;
                break;
            }
            case GeometryTrigonometryBlockOperations.Reciprocal: {
                func = (value) => 1 / value;
                break;
            }
            case GeometryTrigonometryBlockOperations.ToRadians: {
                func = (value) => (value * Math.PI) / 180;
                break;
            }
            case GeometryTrigonometryBlockOperations.ToDegrees: {
                func = (value) => (value * 180) / Math.PI;
                break;
            }
            case GeometryTrigonometryBlockOperations.Fract: {
                func = (value) => {
                    if (value >= 0) {
                        return value - Math.floor(value);
                    }
                    else {
                        return value - Math.ceil(value);
                    }
                };
                break;
            }
        }
        if (!func) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        switch (this.input.type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
            case NodeGeometryBlockConnectionPointTypes.Float: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return func(source);
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector2(func(source.x), func(source.y));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector3: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector3(func(source.x), func(source.y), func(source.z));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector4: {
                this.output._storedFunction = (state) => {
                    const source = this.input.getConnectedValue(state);
                    return new Vector4(func(source.x), func(source.y), func(source.z), func(source.w));
                };
                break;
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.operation = this.operation;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.operation = serializationObject.operation;
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() +
            `${this._codeVariableName}.operation = BABYLON.GeometryTrigonometryBlockOperations.${GeometryTrigonometryBlockOperations[this.operation]};\n`;
        return codeString;
    }
}
__decorate([
    editableInPropertyPage("Operation", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
        options: [
            { label: "Cos", value: GeometryTrigonometryBlockOperations.Cos },
            { label: "Sin", value: GeometryTrigonometryBlockOperations.Sin },
            { label: "Abs", value: GeometryTrigonometryBlockOperations.Abs },
            { label: "Exp", value: GeometryTrigonometryBlockOperations.Exp },
            { label: "Exp2", value: GeometryTrigonometryBlockOperations.Exp2 },
            { label: "Round", value: GeometryTrigonometryBlockOperations.Round },
            { label: "Floor", value: GeometryTrigonometryBlockOperations.Floor },
            { label: "Ceiling", value: GeometryTrigonometryBlockOperations.Ceiling },
            { label: "Sqrt", value: GeometryTrigonometryBlockOperations.Sqrt },
            { label: "Log", value: GeometryTrigonometryBlockOperations.Log },
            { label: "Tan", value: GeometryTrigonometryBlockOperations.Tan },
            { label: "ArcTan", value: GeometryTrigonometryBlockOperations.ArcTan },
            { label: "ArcCos", value: GeometryTrigonometryBlockOperations.ArcCos },
            { label: "ArcSin", value: GeometryTrigonometryBlockOperations.ArcSin },
            { label: "Sign", value: GeometryTrigonometryBlockOperations.Sign },
            { label: "Negate", value: GeometryTrigonometryBlockOperations.Negate },
            { label: "OneMinus", value: GeometryTrigonometryBlockOperations.OneMinus },
            { label: "Reciprocal", value: GeometryTrigonometryBlockOperations.Reciprocal },
            { label: "ToDegrees", value: GeometryTrigonometryBlockOperations.ToDegrees },
            { label: "ToRadians", value: GeometryTrigonometryBlockOperations.ToRadians },
            { label: "Fract", value: GeometryTrigonometryBlockOperations.Fract },
        ],
    })
], GeometryTrigonometryBlock.prototype, "operation", void 0);
RegisterClass("BABYLON.GeometryTrigonometryBlock", GeometryTrigonometryBlock);
//# sourceMappingURL=geometryTrigonometryBlock.js.map