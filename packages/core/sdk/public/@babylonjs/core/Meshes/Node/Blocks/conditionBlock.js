import { __decorate } from "../../../tslib.es6.js";
import { NodeGeometryBlock } from "../nodeGeometryBlock.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
import { WithinEpsilon } from "../../../Maths/math.scalar.functions.js";
import { Epsilon } from "../../../Maths/math.constants.js";
import { GeometryInputBlock } from "./geometryInputBlock.js";
/**
 * Conditions supported by the condition block
 */
export var ConditionBlockTests;
(function (ConditionBlockTests) {
    /** Equal */
    ConditionBlockTests[ConditionBlockTests["Equal"] = 0] = "Equal";
    /** NotEqual */
    ConditionBlockTests[ConditionBlockTests["NotEqual"] = 1] = "NotEqual";
    /** LessThan */
    ConditionBlockTests[ConditionBlockTests["LessThan"] = 2] = "LessThan";
    /** GreaterThan */
    ConditionBlockTests[ConditionBlockTests["GreaterThan"] = 3] = "GreaterThan";
    /** LessOrEqual */
    ConditionBlockTests[ConditionBlockTests["LessOrEqual"] = 4] = "LessOrEqual";
    /** GreaterOrEqual */
    ConditionBlockTests[ConditionBlockTests["GreaterOrEqual"] = 5] = "GreaterOrEqual";
    /** Logical Exclusive OR */
    ConditionBlockTests[ConditionBlockTests["Xor"] = 6] = "Xor";
    /** Logical Or */
    ConditionBlockTests[ConditionBlockTests["Or"] = 7] = "Or";
    /** Logical And */
    ConditionBlockTests[ConditionBlockTests["And"] = 8] = "And";
})(ConditionBlockTests || (ConditionBlockTests = {}));
/**
 * Block used to evaluate a condition and return a true or false value
 */
export class ConditionBlock extends NodeGeometryBlock {
    /**
     * Create a new ConditionBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets the test used by the block
         */
        this.test = ConditionBlockTests.Equal;
        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("ifTrue", NodeGeometryBlockConnectionPointTypes.AutoDetect, true, 1);
        this.registerInput("ifFalse", NodeGeometryBlockConnectionPointTypes.AutoDetect, true, 0);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[2];
        this._outputs[0]._defaultConnectionPointType = NodeGeometryBlockConnectionPointTypes.Float;
        this._inputs[0].acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Int);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Int);
        this._linkConnectionTypes(2, 3);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "ConditionBlock";
    }
    /**
     * Gets the left input component
     */
    get left() {
        return this._inputs[0];
    }
    /**
     * Gets the right input component
     */
    get right() {
        return this._inputs[1];
    }
    /**
     * Gets the ifTrue input component
     */
    get ifTrue() {
        return this._inputs[2];
    }
    /**
     * Gets the ifFalse input component
     */
    get ifFalse() {
        return this._inputs[3];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    autoConfigure(nodeGeometry) {
        if (!this.ifTrue.isConnected) {
            const minInput = nodeGeometry.getBlockByPredicate((b) => b.isInput && b.value === 1 && b.name === "True") ||
                new GeometryInputBlock("True");
            minInput.value = 1;
            minInput.output.connectTo(this.ifTrue);
        }
        if (!this.ifFalse.isConnected) {
            const maxInput = nodeGeometry.getBlockByPredicate((b) => b.isInput && b.value === 0 && b.name === "False") ||
                new GeometryInputBlock("False");
            maxInput.value = 0;
            maxInput.output.connectTo(this.ifFalse);
        }
    }
    _buildBlock() {
        if (!this.left.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (state) => {
            const left = this.left.getConnectedValue(state);
            const right = this.right.getConnectedValue(state);
            let condition = false;
            switch (this.test) {
                case ConditionBlockTests.Equal:
                    condition = WithinEpsilon(left, right, Epsilon);
                    break;
                case ConditionBlockTests.NotEqual:
                    condition = left !== right;
                    break;
                case ConditionBlockTests.LessThan:
                    condition = left < right;
                    break;
                case ConditionBlockTests.GreaterThan:
                    condition = left > right;
                    break;
                case ConditionBlockTests.LessOrEqual:
                    condition = left <= right;
                    break;
                case ConditionBlockTests.GreaterOrEqual:
                    condition = left >= right;
                    break;
                case ConditionBlockTests.Xor:
                    condition = (!!left && !right) || (!left && !!right);
                    break;
                case ConditionBlockTests.Or:
                    condition = !!left || !!right;
                    break;
                case ConditionBlockTests.And:
                    condition = !!left && !!right;
                    break;
            }
            return condition;
        };
        this.output._storedFunction = (state) => {
            if (func(state)) {
                return this.ifTrue.getConnectedValue(state);
            }
            return this.ifFalse.getConnectedValue(state);
        };
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.test = BABYLON.ConditionBlockTests.${ConditionBlockTests[this.test]};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.test = this.test;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.test = serializationObject.test;
    }
}
__decorate([
    editableInPropertyPage("Test", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Equal", value: ConditionBlockTests.Equal },
            { label: "NotEqual", value: ConditionBlockTests.NotEqual },
            { label: "LessThan", value: ConditionBlockTests.LessThan },
            { label: "GreaterThan", value: ConditionBlockTests.GreaterThan },
            { label: "LessOrEqual", value: ConditionBlockTests.LessOrEqual },
            { label: "GreaterOrEqual", value: ConditionBlockTests.GreaterOrEqual },
            { label: "Xor", value: ConditionBlockTests.Xor },
            { label: "Or", value: ConditionBlockTests.Or },
            { label: "And", value: ConditionBlockTests.And },
        ],
    })
], ConditionBlock.prototype, "test", void 0);
RegisterClass("BABYLON.ConditionBlock", ConditionBlock);
//# sourceMappingURL=conditionBlock.js.map