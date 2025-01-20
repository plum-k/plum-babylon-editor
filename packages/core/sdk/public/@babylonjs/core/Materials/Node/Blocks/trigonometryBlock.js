import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Operations supported by the Trigonometry block
 */
export var TrigonometryBlockOperations;
(function (TrigonometryBlockOperations) {
    /** Cos */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Cos"] = 0] = "Cos";
    /** Sin */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Sin"] = 1] = "Sin";
    /** Abs */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Abs"] = 2] = "Abs";
    /** Exp */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Exp"] = 3] = "Exp";
    /** Exp2 */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Exp2"] = 4] = "Exp2";
    /** Round */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Round"] = 5] = "Round";
    /** Floor */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Floor"] = 6] = "Floor";
    /** Ceiling */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Ceiling"] = 7] = "Ceiling";
    /** Square root */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Sqrt"] = 8] = "Sqrt";
    /** Log */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Log"] = 9] = "Log";
    /** Tangent */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Tan"] = 10] = "Tan";
    /** Arc tangent */
    TrigonometryBlockOperations[TrigonometryBlockOperations["ArcTan"] = 11] = "ArcTan";
    /** Arc cosinus */
    TrigonometryBlockOperations[TrigonometryBlockOperations["ArcCos"] = 12] = "ArcCos";
    /** Arc sinus */
    TrigonometryBlockOperations[TrigonometryBlockOperations["ArcSin"] = 13] = "ArcSin";
    /** Fraction */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Fract"] = 14] = "Fract";
    /** Sign */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Sign"] = 15] = "Sign";
    /** To radians (from degrees) */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Radians"] = 16] = "Radians";
    /** To degrees (from radians) */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Degrees"] = 17] = "Degrees";
    /** To Set a = b */
    TrigonometryBlockOperations[TrigonometryBlockOperations["Set"] = 18] = "Set";
})(TrigonometryBlockOperations || (TrigonometryBlockOperations = {}));
/**
 * Block used to apply trigonometry operation to floats
 */
export class TrigonometryBlock extends NodeMaterialBlock {
    /**
     * Creates a new TrigonometryBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the operation applied by the block
         */
        this.operation = TrigonometryBlockOperations.Cos;
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "TrigonometryBlock";
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
        const output = this._outputs[0];
        let operation = "";
        switch (this.operation) {
            case TrigonometryBlockOperations.Cos: {
                operation = "cos";
                break;
            }
            case TrigonometryBlockOperations.Sin: {
                operation = "sin";
                break;
            }
            case TrigonometryBlockOperations.Abs: {
                operation = "abs";
                break;
            }
            case TrigonometryBlockOperations.Exp: {
                operation = "exp";
                break;
            }
            case TrigonometryBlockOperations.Exp2: {
                operation = "exp2";
                break;
            }
            case TrigonometryBlockOperations.Round: {
                operation = "round";
                break;
            }
            case TrigonometryBlockOperations.Floor: {
                operation = "floor";
                break;
            }
            case TrigonometryBlockOperations.Ceiling: {
                operation = "ceil";
                break;
            }
            case TrigonometryBlockOperations.Sqrt: {
                operation = "sqrt";
                break;
            }
            case TrigonometryBlockOperations.Log: {
                operation = "log";
                break;
            }
            case TrigonometryBlockOperations.Tan: {
                operation = "tan";
                break;
            }
            case TrigonometryBlockOperations.ArcTan: {
                operation = "atan";
                break;
            }
            case TrigonometryBlockOperations.ArcCos: {
                operation = "acos";
                break;
            }
            case TrigonometryBlockOperations.ArcSin: {
                operation = "asin";
                break;
            }
            case TrigonometryBlockOperations.Fract: {
                operation = "fract";
                break;
            }
            case TrigonometryBlockOperations.Sign: {
                operation = "sign";
                break;
            }
            case TrigonometryBlockOperations.Radians: {
                operation = "radians";
                break;
            }
            case TrigonometryBlockOperations.Degrees: {
                operation = "degrees";
                break;
            }
            case TrigonometryBlockOperations.Set: {
                operation = "";
                break;
            }
        }
        state.compilationString += state._declareOutput(output) + ` = ${operation}(${this.input.associatedVariableName});\n`;
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.operation = this.operation;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.operation = serializationObject.operation;
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.operation = BABYLON.TrigonometryBlockOperations.${TrigonometryBlockOperations[this.operation]};\n`;
        return codeString;
    }
}
__decorate([
    editableInPropertyPage("Operation", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Cos", value: TrigonometryBlockOperations.Cos },
            { label: "Sin", value: TrigonometryBlockOperations.Sin },
            { label: "Abs", value: TrigonometryBlockOperations.Abs },
            { label: "Exp", value: TrigonometryBlockOperations.Exp },
            { label: "Exp2", value: TrigonometryBlockOperations.Exp2 },
            { label: "Round", value: TrigonometryBlockOperations.Round },
            { label: "Floor", value: TrigonometryBlockOperations.Floor },
            { label: "Ceiling", value: TrigonometryBlockOperations.Ceiling },
            { label: "Sqrt", value: TrigonometryBlockOperations.Sqrt },
            { label: "Log", value: TrigonometryBlockOperations.Log },
            { label: "Tan", value: TrigonometryBlockOperations.Tan },
            { label: "ArcTan", value: TrigonometryBlockOperations.ArcTan },
            { label: "ArcCos", value: TrigonometryBlockOperations.ArcCos },
            { label: "ArcSin", value: TrigonometryBlockOperations.ArcSin },
            { label: "Fract", value: TrigonometryBlockOperations.Fract },
            { label: "Sign", value: TrigonometryBlockOperations.Sign },
            { label: "Radians", value: TrigonometryBlockOperations.Radians },
            { label: "Degrees", value: TrigonometryBlockOperations.Degrees },
            { label: "Set", value: TrigonometryBlockOperations.Set },
        ],
    })
], TrigonometryBlock.prototype, "operation", void 0);
RegisterClass("BABYLON.TrigonometryBlock", TrigonometryBlock);
//# sourceMappingURL=trigonometryBlock.js.map