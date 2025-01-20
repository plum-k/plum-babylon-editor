import { __decorate } from "../../../../tslib.es6.js";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes.js";
import { NodeGeometryBlock } from "../../nodeGeometryBlock.js";
import { RegisterClass } from "../../../../Misc/typeStore.js";
import { VertexData } from "../../../../Meshes/mesh.vertexData.js";
import { editableInPropertyPage } from "../../../../Decorators/nodeDecorator.js";
/**
 * Defines a block used to generate a user defined mesh geometry data
 */
export class MeshBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the mesh to use to get vertex data
     */
    get mesh() {
        return this._mesh;
    }
    set mesh(value) {
        this._mesh = value;
    }
    /**
     * Create a new MeshBlock
     * @param name defines the block name
     */
    constructor(name) {
        super(name);
        this._cachedVertexData = null;
        /**
         * Gets or sets a boolean indicating that winding order needs to be reserved
         */
        this.reverseWindingOrder = false;
        /**
         * Gets or sets a boolean indicating that this block should serialize its cached data
         */
        this.serializedCachedData = false;
        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }
    /**
     * Gets the current class name
     * @returns the class name
     */
    getClassName() {
        return "MeshBlock";
    }
    /**
     * Gets a boolean indicating if the block is using cached data
     */
    get isUsingCachedData() {
        return !this.mesh && !!this._cachedVertexData;
    }
    /**
     * Gets the geometry output component
     */
    get geometry() {
        return this._outputs[0];
    }
    /**
     * Remove stored data
     */
    cleanData() {
        this._mesh = null;
        this._cachedVertexData = null;
    }
    _buildBlock() {
        if (!this._mesh) {
            if (this._cachedVertexData) {
                this.geometry._storedValue = this._cachedVertexData.clone();
            }
            else {
                this.geometry._storedValue = null;
            }
            return;
        }
        const vertexData = VertexData.ExtractFromMesh(this._mesh, false, true);
        this._cachedVertexData = null;
        if (this.reverseWindingOrder && vertexData.indices) {
            for (let index = 0; index < vertexData.indices.length; index += 3) {
                const tmp = vertexData.indices[index];
                vertexData.indices[index] = vertexData.indices[index + 2];
                vertexData.indices[index + 2] = tmp;
            }
        }
        this.geometry._storedFunction = () => {
            return vertexData.clone();
        };
    }
    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.serializedCachedData = this.serializedCachedData;
        if (this.serializedCachedData) {
            if (this._mesh) {
                serializationObject.cachedVertexData = VertexData.ExtractFromMesh(this._mesh, false, true).serialize();
            }
            else if (this._cachedVertexData) {
                serializationObject.cachedVertexData = this._cachedVertexData.serialize();
            }
        }
        serializationObject.reverseWindingOrder = this.reverseWindingOrder;
        return serializationObject;
    }
    _deserialize(serializationObject) {
        super._deserialize(serializationObject);
        if (serializationObject.cachedVertexData) {
            this._cachedVertexData = VertexData.Parse(serializationObject.cachedVertexData);
        }
        this.serializedCachedData = !!serializationObject.serializedCachedData;
        this.reverseWindingOrder = serializationObject.reverseWindingOrder;
    }
}
__decorate([
    editableInPropertyPage("Serialize cached data", 0 /* PropertyTypeForEdition.Boolean */, "ADVANCED", { embedded: true, notifiers: { rebuild: true } })
], MeshBlock.prototype, "serializedCachedData", void 0);
RegisterClass("BABYLON.MeshBlock", MeshBlock);
//# sourceMappingURL=meshBlock.js.map