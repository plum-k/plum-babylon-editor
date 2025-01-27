import { NodeRenderGraphConnectionPoint } from "./nodeRenderGraphBlockConnectionPoint.js";
/**
 * Defines a connection point to be used for points with a custom object type
 */
export class NodeRenderGraphConnectionPointCustomObject extends NodeRenderGraphConnectionPoint {
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
    checkCompatibilityState(connectionPoint) {
        return connectionPoint instanceof NodeRenderGraphConnectionPointCustomObject && connectionPoint._blockName === this._blockName
            ? 0 /* NodeRenderGraphConnectionPointCompatibilityStates.Compatible */
            : 1 /* NodeRenderGraphConnectionPointCompatibilityStates.TypeIncompatible */;
    }
    createCustomInputBlock() {
        return [new this._blockType(this._blockName), this.name];
    }
}
//# sourceMappingURL=nodeRenderGraphConnectionPointCustomObject.js.map