import { __decorate } from "../../../../tslib.es6.js";
import { Vector4 } from "../../../../Maths/math.vector.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Block used to fetch a color from texture data
 */
export class GeometryTextureFetchBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryTextureFetchBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        /**
         * Gets or sets a boolean indicating if coordinates should be clamped between 0 and 1
         */
        this.clampCoordinates = true;
        this.registerInput("texture", NodeGeometryBlockConnectionPointTypes.Texture);
        this.registerInput("coordinates", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("rgba", NodeGeometryBlockConnectionPointTypes.Vector4);
        this.registerOutput("rgb", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("r", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("g", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("b", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("a", NodeGeometryBlockConnectionPointTypes.Float);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "GeometryTextureFetchBlock";
    }
    /**
     * Gets the texture component
     */
    get texture() {
        return this.inputs[0];
    }
    /**
     * Gets the coordinates component
     */
    get coordinates() {
        return this.inputs[1];
    }
    /**
     * Gets the rgba component
     */
    get rgba() {
        return this._outputs[0];
    }
    /**
     * Gets the rgb component
     */
    get rgb() {
        return this._outputs[1];
    }
    /**
     * Gets the r component
     */
    get r() {
        return this._outputs[2];
    }
    /**
     * Gets the g component
     */
    get g() {
        return this._outputs[3];
    }
    /**
     * Gets the b component
     */
    get b() {
        return this._outputs[4];
    }
    /**
     * Gets the a component
     */
    get a() {
        return this._outputs[5];
    }
    _repeatClamp(num) {
        if (num >= 0) {
            return num % 1;
        }
        else {
            return 1 - (Math.abs(num) % 1);
        }
    }
    _buildBlock() {
        const func = (state) => {
            const textureData = this.texture.getConnectedValue(state);
            if (!textureData || !textureData.data) {
                return null;
            }
            const uv = this.coordinates.getConnectedValue(state);
            if (!uv) {
                return null;
            }
            const u = this.clampCoordinates ? Math.max(0, Math.min(uv.x, 1.0)) : this._repeatClamp(uv.x);
            const v = this.clampCoordinates ? Math.max(0, Math.min(uv.y, 1.0)) : this._repeatClamp(uv.y);
            const x = Math.floor(u * (textureData.width - 1));
            const y = Math.floor(v * (textureData.height - 1));
            const index = x + textureData.width * y;
            return Vector4.FromArray(textureData.data, index * 4);
        };
        this.rgba._storedFunction = (state) => {
            return func(state);
        };
        this.rgb._storedFunction = (state) => {
            const color = func(state);
            return color ? color.toVector3() : null;
        };
        this.r._storedFunction = (state) => {
            const color = func(state);
            return color ? color.x : null;
        };
        this.g._storedFunction = (state) => {
            const color = func(state);
            return color ? color.y : null;
        };
        this.b._storedFunction = (state) => {
            const color = func(state);
            return color ? color.z : null;
        };
        this.a._storedFunction = (state) => {
            const color = func(state);
            return color ? color.w : null;
        };
    }
    _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.clampCoordinates = ${this.clampCoordinates};\n`;
        return codeString;
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.clampCoordinates = this.clampCoordinates;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        this.clampCoordinates = serializationObject.clampCoordinates;
    }
}
__decorate([
    editableInPropertyPage("Clamp Coordinates", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], GeometryTextureFetchBlock.prototype, "clampCoordinates", void 0);
RegisterClass("BABYLON.GeometryTextureFetchBlock", GeometryTextureFetchBlock);
//# sourceMappingURL=geometryTextureFetchBlock.js.map