import { __decorate } from "../../../tslib.es6.js";
import { NodeMaterialBlock } from "../nodeMaterialBlock.js";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets.js";
import { RegisterClass } from "../../../Misc/typeStore.js";
import { InputBlock } from "./Input/inputBlock.js";
import { MorphTargetsBlock } from "./Vertex/morphTargetsBlock.js";
import { editableInPropertyPage } from "../../../Decorators/nodeDecorator.js";
export var MeshAttributeExistsBlockTypes;
(function (MeshAttributeExistsBlockTypes) {
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["None"] = 0] = "None";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["Normal"] = 1] = "Normal";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["Tangent"] = 2] = "Tangent";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["VertexColor"] = 3] = "VertexColor";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV1"] = 4] = "UV1";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV2"] = 5] = "UV2";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV3"] = 6] = "UV3";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV4"] = 7] = "UV4";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV5"] = 8] = "UV5";
    MeshAttributeExistsBlockTypes[MeshAttributeExistsBlockTypes["UV6"] = 9] = "UV6";
})(MeshAttributeExistsBlockTypes || (MeshAttributeExistsBlockTypes = {}));
/**
 * Block used to check if Mesh attribute of specified type exists
 * and provide an alternative fallback input for to use in such case
 */
export class MeshAttributeExistsBlock extends NodeMaterialBlock {
    /**
     * Creates a new MeshAttributeExistsBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name, NodeMaterialBlockTargets.Neutral);
        /**
         * Defines which mesh attribute to use
         */
        this.attributeType = 0 /* MeshAttributeExistsBlockTypes.None */;
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("fallback", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
        // Try to auto determine attributeType
        this._inputs[0].onConnectionObservable.add((other) => {
            if (this.attributeType) {
                // But only if not already specified
                return;
            }
            const sourceBlock = other.ownerBlock;
            if (sourceBlock instanceof InputBlock && sourceBlock.isAttribute) {
                switch (sourceBlock.name) {
                    case "color":
                        this.attributeType = 3 /* MeshAttributeExistsBlockTypes.VertexColor */;
                        break;
                    case "normal":
                        this.attributeType = 1 /* MeshAttributeExistsBlockTypes.Normal */;
                        break;
                    case "tangent":
                        this.attributeType = 2 /* MeshAttributeExistsBlockTypes.Tangent */;
                        break;
                    case "uv":
                        this.attributeType = 4 /* MeshAttributeExistsBlockTypes.UV1 */;
                        break;
                    case "uv2":
                        this.attributeType = 5 /* MeshAttributeExistsBlockTypes.UV2 */;
                        break;
                    case "uv3":
                        this.attributeType = 6 /* MeshAttributeExistsBlockTypes.UV3 */;
                        break;
                    case "uv4":
                        this.attributeType = 7 /* MeshAttributeExistsBlockTypes.UV4 */;
                        break;
                    case "uv5":
                        this.attributeType = 8 /* MeshAttributeExistsBlockTypes.UV5 */;
                        break;
                    case "uv6":
                        this.attributeType = 9 /* MeshAttributeExistsBlockTypes.UV6 */;
                        break;
                }
            }
            else if (sourceBlock instanceof MorphTargetsBlock) {
                switch (this.input.connectedPoint?.name) {
                    case "normalOutput":
                        this.attributeType = 1 /* MeshAttributeExistsBlockTypes.Normal */;
                        break;
                    case "tangentOutput":
                        this.attributeType = 2 /* MeshAttributeExistsBlockTypes.Tangent */;
                        break;
                    case "uvOutput":
                        this.attributeType = 4 /* MeshAttributeExistsBlockTypes.UV1 */;
                        break;
                    case "uv2Output":
                        this.attributeType = 5 /* MeshAttributeExistsBlockTypes.UV2 */;
                        break;
                }
            }
        });
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MeshAttributeExistsBlock";
    }
    /**
     * Gets the input component
     */
    get input() {
        return this._inputs[0];
    }
    /**
     * Gets the fallback component when speciefied attribute doesn't exist
     */
    get fallback() {
        return this._inputs[1];
    }
    /**
     * Gets the output component
     */
    get output() {
        return this._outputs[0];
    }
    _buildBlock(state) {
        super._buildBlock(state);
        let attributeDefine = null;
        switch (this.attributeType) {
            case 3 /* MeshAttributeExistsBlockTypes.VertexColor */:
                attributeDefine = "VERTEXCOLOR_NME";
                break;
            case 1 /* MeshAttributeExistsBlockTypes.Normal */:
                attributeDefine = "NORMAL";
                break;
            case 2 /* MeshAttributeExistsBlockTypes.Tangent */:
                attributeDefine = "TANGENT";
                break;
            case 4 /* MeshAttributeExistsBlockTypes.UV1 */:
                attributeDefine = "UV1";
                break;
            case 5 /* MeshAttributeExistsBlockTypes.UV2 */:
                attributeDefine = "UV2";
                break;
            case 6 /* MeshAttributeExistsBlockTypes.UV3 */:
                attributeDefine = "UV3";
                break;
            case 7 /* MeshAttributeExistsBlockTypes.UV4 */:
                attributeDefine = "UV4";
                break;
            case 8 /* MeshAttributeExistsBlockTypes.UV5 */:
                attributeDefine = "UV5";
                break;
            case 9 /* MeshAttributeExistsBlockTypes.UV6 */:
                attributeDefine = "UV6";
                break;
        }
        const output = state._declareOutput(this.output);
        if (attributeDefine) {
            state.compilationString += `#ifdef ${attributeDefine}\n`;
        }
        state.compilationString += `${output} = ${this.input.associatedVariableName};\n`;
        if (attributeDefine) {
            state.compilationString += `#else\n`;
            state.compilationString += `${output} = ${this.fallback.associatedVariableName};\n`;
            state.compilationString += `#endif\n`;
        }
        return this;
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.attributeType = this.attributeType;
        return serializationObject;
    }
    _deserialize(serializationObject, scene, rootUrl) {
        super._deserialize(serializationObject, scene, rootUrl);
        this.attributeType = serializationObject.attributeType ?? 0 /* MeshAttributeExistsBlockTypes.None */;
    }
    _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.attributeType = ${this.attributeType};\n`;
        return codeString;
    }
}
__decorate([
    editableInPropertyPage("Attribute lookup", 4 /* PropertyTypeForEdition.List */, undefined, {
        notifiers: { update: true },
        embedded: true,
        options: [
            { label: "(None)", value: 0 /* MeshAttributeExistsBlockTypes.None */ },
            { label: "Normal", value: 1 /* MeshAttributeExistsBlockTypes.Normal */ },
            { label: "Tangent", value: 2 /* MeshAttributeExistsBlockTypes.Tangent */ },
            { label: "Vertex Color", value: 3 /* MeshAttributeExistsBlockTypes.VertexColor */ },
            { label: "UV1", value: 4 /* MeshAttributeExistsBlockTypes.UV1 */ },
            { label: "UV2", value: 5 /* MeshAttributeExistsBlockTypes.UV2 */ },
            { label: "UV3", value: 6 /* MeshAttributeExistsBlockTypes.UV3 */ },
            { label: "UV4", value: 7 /* MeshAttributeExistsBlockTypes.UV4 */ },
            { label: "UV5", value: 8 /* MeshAttributeExistsBlockTypes.UV5 */ },
            { label: "UV6", value: 9 /* MeshAttributeExistsBlockTypes.UV6 */ },
        ],
    })
], MeshAttributeExistsBlock.prototype, "attributeType", void 0);
RegisterClass("BABYLON.MeshAttributeExistsBlock", MeshAttributeExistsBlock);
//# sourceMappingURL=meshAttributeExistsBlock.js.map