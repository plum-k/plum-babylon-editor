import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
/**
 * Operations supported by the Wave block
 */
export var WaveBlockKind;
(function (WaveBlockKind) {
    /** SawTooth */
    WaveBlockKind[WaveBlockKind["SawTooth"] = 0] = "SawTooth";
    /** Square */
    WaveBlockKind[WaveBlockKind["Square"] = 1] = "Square";
    /** Triangle */
    WaveBlockKind[WaveBlockKind["Triangle"] = 2] = "Triangle";
})(WaveBlockKind || (WaveBlockKind = {}));
/**
 * Block used to apply wave operation to floats
 */
export class WaveBlock extends NodeMaterialBlock {
    /**
     * Creates a new WaveBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Gets or sets the kibnd of wave to be applied by the block
         */
        this.kind = 0 /* WaveBlockKind.SawTooth */;
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "WaveBlock";
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
        switch (this.kind) {
            case 0 /* WaveBlockKind.SawTooth */: {
                state.compilationString += state._declareOutput(output) + ` = ${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName});\n`;
                break;
            }
            case 1 /* WaveBlockKind.Square */: {
                state.compilationString += state._declareOutput(output) + ` = 1.0 - 2.0 * round(fract(${this.input.associatedVariableName}));\n`;
                break;
            }
            case 2 /* WaveBlockKind.Triangle */: {
                state.compilationString +=
                    state._declareOutput(output) + ` = 2.0 * abs(2.0 * (${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName}))) - 1.0;\n`;
                break;
            }
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.kind = this.kind;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.kind = serializationObject.kind;
    }
}
__decorate([
    editableInPropertyPage("Kind", 4 /* PropertyTypeForEdition.List */, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "SawTooth", value: 0 /* WaveBlockKind.SawTooth */ },
            { label: "Square", value: 1 /* WaveBlockKind.Square */ },
            { label: "Triangle", value: 2 /* WaveBlockKind.Triangle */ },
        ],
    })
], WaveBlock.prototype, "kind", void 0);
RegisterClass("BABYLON.WaveBlock", WaveBlock);
//# sourceMappingURL=waveBlock.js.map