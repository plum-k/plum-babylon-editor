import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { InputBlock } from "./Input/inputBlock.js";
/**
 * Operations supported by the ConditionalBlock block
 */
export var ConditionalBlockConditions;
(function (ConditionalBlockConditions) {
    /** Equal */
    ConditionalBlockConditions[ConditionalBlockConditions["Equal"] = 0] = "Equal";
    /** NotEqual */
    ConditionalBlockConditions[ConditionalBlockConditions["NotEqual"] = 1] = "NotEqual";
    /** LessThan */
    ConditionalBlockConditions[ConditionalBlockConditions["LessThan"] = 2] = "LessThan";
    /** GreaterThan */
    ConditionalBlockConditions[ConditionalBlockConditions["GreaterThan"] = 3] = "GreaterThan";
    /** LessOrEqual */
    ConditionalBlockConditions[ConditionalBlockConditions["LessOrEqual"] = 4] = "LessOrEqual";
    /** GreaterOrEqual */
    ConditionalBlockConditions[ConditionalBlockConditions["GreaterOrEqual"] = 5] = "GreaterOrEqual";
    /** Logical Exclusive OR */
    ConditionalBlockConditions[ConditionalBlockConditions["Xor"] = 6] = "Xor";
    /** Logical Or */
    ConditionalBlockConditions[ConditionalBlockConditions["Or"] = 7] = "Or";
    /** Logical And */
    ConditionalBlockConditions[ConditionalBlockConditions["And"] = 8] = "And";
})(ConditionalBlockConditions || (ConditionalBlockConditions = {}));
/**
 * Block used to apply conditional operation between floats
 * @since 5.0.0
 */
export class ConditionalBlock extends NodeMaterialBlock {
    /**
     * Creates a new ConditionalBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the condition applied by the block
         */
        this.condition = ConditionalBlockConditions.LessThan;
        this.registerInput("a", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("b", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("true", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("false", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._linkConnectionTypes(2, 3);
        this._outputs[0]._typeConnectionSource = this._inputs[2];
        this._outputs[0]._defaultConnectionPointType = NodeMaterialBlockConnectionPointTypes.Float;
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ConditionalBlock";
    }
    /**
     * Gets the first operand component
     */
    get a() {
        return this._inputs[0];
    }
    /**
     * Gets the second operand component
     */
    get b() {
        return this._inputs[1];
    }
    /**
     * Gets the value to return if condition is true
     */
    get true() {
        return this._inputs[2];
    }
    /**
     * Gets the value to return if condition is false
     */
    get false() {
        return this._inputs[3];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure(nodeMaterial) {
        if (!this.true.isConnected) {
            const minInput = nodeMaterial.getBlockByPredicate((b) => b.isInput && b.value === 1 && b.name === "True") || new InputBlock("True");
            minInput.value = 1;
            minInput.output.connectTo(this.true);
        }
        if (!this.false.isConnected) {
            const maxInput = nodeMaterial.getBlockByPredicate((b) => b.isInput && b.value === 0 && b.name === "False") || new InputBlock("False");
            maxInput.value = 0;
            maxInput.output.connectTo(this.false);
        }
    }
    _buildBlock(state) {
        super._buildBlock(state);
        const output = this._outputs[0];
        const trueStatement = this.true.isConnected ? this.true.associatedVariableName : "1.0";
        const falseStatement = this.false.isConnected ? this.false.associatedVariableName : "0.0";
        switch (this.condition) {
            case ConditionalBlockConditions.Equal: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} == ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.NotEqual: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} != ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.LessThan: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} < ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.LessOrEqual: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} <= ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.GreaterThan: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} > ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.GreaterOrEqual: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `${this.a.associatedVariableName} >= ${this.b.associatedVariableName}`)};\n`;
                break;
            }
            case ConditionalBlockConditions.Xor: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `(((${this.a.associatedVariableName} + ${this.b.associatedVariableName}) % 2.0) > 0.0)`)};\n`;
                break;
            }
            case ConditionalBlockConditions.Or: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `(min(${this.a.associatedVariableName} + ${this.b.associatedVariableName}, 1.0) > 0.0)`)};\n`;
                break;
            }
            case ConditionalBlockConditions.And: {
                state.compilationString +=
                    state._declareOutput(output) +
                        ` = ${state._generateTernary(trueStatement, falseStatement, `(${this.a.associatedVariableName} * ${this.b.associatedVariableName} > 0.0)`)};\n`;
                break;
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.condition = this.condition;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.condition = serializationObject.condition;
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.condition = BABYLON.ConditionalBlockConditions.${ConditionalBlockConditions[this.condition]};\n`;
        return codeString;
    }
}
__decorate([
    editableInPropertyPage("Condition", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Equal", value: ConditionalBlockConditions.Equal },
            { label: "NotEqual", value: ConditionalBlockConditions.NotEqual },
            { label: "LessThan", value: ConditionalBlockConditions.LessThan },
            { label: "GreaterThan", value: ConditionalBlockConditions.GreaterThan },
            { label: "LessOrEqual", value: ConditionalBlockConditions.LessOrEqual },
            { label: "GreaterOrEqual", value: ConditionalBlockConditions.GreaterOrEqual },
            { label: "Xor", value: ConditionalBlockConditions.Xor },
            { label: "And", value: ConditionalBlockConditions.And },
            { label: "Or", value: ConditionalBlockConditions.Or },
        ],
    })
], ConditionalBlock.prototype, "condition", void 0);
RegisterClass("BABYLON.ConditionalBlock", ConditionalBlock);
//# sourceMappingURL=conditionalBlock.js.map