import { NodeMaterialConnectionPoint } from "./nodeMaterialBlockConnectionPoint.js";
/**
 * Defines a connection point to be used for points with a custom object type
 */
export class NodeMaterialConnectionPointCustomObject extends NodeMaterialConnectionPoint {
    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     * @param _blockType
     * @param _blockName
     */
    constructor(name, ownerBlock, direction, 
    // @internal
    _blockType, _blockName) {
        super(name, ownerBlock, direction);
        this._blockType = _blockType;
        this._blockName = _blockName;
        this.needDualDirectionValidation = true;
    }
    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    checkCompatibilityState(connectionPoint) {
        return connectionPoint instanceof NodeMaterialConnectionPointCustomObject && connectionPoint._blockName === this._blockName
            ? 0 /* NodeMaterialConnectionPointCompatibilityStates.Compatible */
            : 1 /* NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible */;
    }
    /**
     * Creates a block suitable to be used as an input for this input point.
     * If null is returned, a block based on the point type will be created.
     * @returns The returned string parameter is the name of the output point of NodeMaterialBlock (first parameter of the returned array) that can be connected to the input
     */
    createCustomInputBlock() {
        return [new this._blockType(this._blockName), this.name];
    }
}
//# sourceMappingURL=nodeMaterialConnectionPointCustomObject.js.map