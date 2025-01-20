import { NodeMaterialBlockConnectionPointTypes } from "./Enums/nodeMaterialBlockConnectionPointTypes.js";
import { NodeMaterialBlockTargets } from "./Enums/nodeMaterialBlockTargets.js";
import { Observable } from "../../Misc/observable.js";
/**
 * Enum used to define the compatibility state between two connection points
 */
export var NodeMaterialConnectionPointCompatibilityStates;
(function (NodeMaterialConnectionPointCompatibilityStates) {
    /** Points are compatibles */
    NodeMaterialConnectionPointCompatibilityStates[NodeMaterialConnectionPointCompatibilityStates["Compatible"] = 0] = "Compatible";
    /** Points are incompatible because of their types */
    NodeMaterialConnectionPointCompatibilityStates[NodeMaterialConnectionPointCompatibilityStates["TypeIncompatible"] = 1] = "TypeIncompatible";
    /** Points are incompatible because of their targets (vertex vs fragment) */
    NodeMaterialConnectionPointCompatibilityStates[NodeMaterialConnectionPointCompatibilityStates["TargetIncompatible"] = 2] = "TargetIncompatible";
    /** Points are incompatible because they are in the same hierarchy **/
    NodeMaterialConnectionPointCompatibilityStates[NodeMaterialConnectionPointCompatibilityStates["HierarchyIssue"] = 3] = "HierarchyIssue";
})(NodeMaterialConnectionPointCompatibilityStates || (NodeMaterialConnectionPointCompatibilityStates = {}));
/**
 * Defines the direction of a connection point
 */
export var NodeMaterialConnectionPointDirection;
(function (NodeMaterialConnectionPointDirection) {
    /** Input */
    NodeMaterialConnectionPointDirection[NodeMaterialConnectionPointDirection["Input"] = 0] = "Input";
    /** Output */
    NodeMaterialConnectionPointDirection[NodeMaterialConnectionPointDirection["Output"] = 1] = "Output";
})(NodeMaterialConnectionPointDirection || (NodeMaterialConnectionPointDirection = {}));
/**
 * Defines a connection point for a block
 */
export class NodeMaterialConnectionPoint {
    /**
     * Checks if two types are equivalent
     * @param type1 type 1 to check
     * @param type2 type 2 to check
     * @returns true if both types are equivalent, else false
     */
    static AreEquivalentTypes(type1, type2) {
        switch (type1) {
            case NodeMaterialBlockConnectionPointTypes.Vector3: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Color3) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Vector4: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Color4) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Color3: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Vector3) {
                    return true;
                }
                break;
            }
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                if (type2 === NodeMaterialBlockConnectionPointTypes.Vector4) {
                    return true;
                }
                break;
            }
        }
        return false;
    }
    get _connectedPoint() {
        return this._connectedPointBackingField;
    }
    set _connectedPoint(value) {
        if (this._connectedPointBackingField === value) {
            return;
        }
        this._connectedPointTypeChangedObserver?.remove();
        this._updateTypeDependentState(() => (this._connectedPointBackingField = value));
        if (this._connectedPointBackingField) {
            this._connectedPointTypeChangedObserver = this._connectedPointBackingField.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }
    /** @internal */
    get _typeConnectionSource() {
        return this._typeConnectionSourceBackingField;
    }
    /** @internal */
    set _typeConnectionSource(value) {
        if (this._typeConnectionSourceBackingField === value) {
            return;
        }
        this._typeConnectionSourceTypeChangedObserver?.remove();
        this._updateTypeDependentState(() => (this._typeConnectionSourceBackingField = value));
        if (this._typeConnectionSourceBackingField) {
            this._typeConnectionSourceTypeChangedObserver = this._typeConnectionSourceBackingField.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }
    /** @internal */
    get _defaultConnectionPointType() {
        return this._defaultConnectionPointTypeBackingField;
    }
    /** @internal */
    set _defaultConnectionPointType(value) {
        this._updateTypeDependentState(() => (this._defaultConnectionPointTypeBackingField = value));
    }
    /** @internal */
    get _linkedConnectionSource() {
        return this._linkedConnectionSourceBackingField;
    }
    /** @internal */
    set _linkedConnectionSource(value) {
        if (this._linkedConnectionSourceBackingField === value) {
            return;
        }
        this._linkedConnectionSourceTypeChangedObserver?.remove();
        this._updateTypeDependentState(() => (this._linkedConnectionSourceBackingField = value));
        this._isMainLinkSource = false;
        if (this._linkedConnectionSourceBackingField) {
            this._linkedConnectionSourceTypeChangedObserver = this._linkedConnectionSourceBackingField.onTypeChangedObservable.add(() => {
                this._notifyTypeChanged();
            });
        }
    }
    /** Gets the direction of the point */
    get direction() {
        return this._direction;
    }
    /**
     * Gets the declaration variable name in the shader
     */
    get declarationVariableName() {
        if (this._ownerBlock.isInput) {
            return this._ownerBlock.declarationVariableName;
        }
        if ((!this._enforceAssociatedVariableName || !this._associatedVariableName) && this._connectedPoint) {
            return this._connectedPoint.declarationVariableName;
        }
        return this._associatedVariableName;
    }
    /**
     * Gets or sets the associated variable name in the shader
     */
    get associatedVariableName() {
        if (this._ownerBlock.isInput) {
            return this._ownerBlock.associatedVariableName;
        }
        if ((!this._enforceAssociatedVariableName || !this._associatedVariableName) && this._connectedPoint) {
            return this._connectedPoint.associatedVariableName;
        }
        return this._associatedVariableName;
    }
    set associatedVariableName(value) {
        this._associatedVariableName = value;
    }
    /** Get the inner type (ie AutoDetect for instance instead of the inferred one) */
    get innerType() {
        if (this._linkedConnectionSource && !this._isMainLinkSource && this._linkedConnectionSource.isConnected) {
            return this.type;
        }
        return this._type;
    }
    /**
     * Gets or sets the connection point type (default is float)
     */
    get type() {
        if (this._type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return this._ownerBlock.type;
            }
            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }
            if (this._linkedConnectionSource) {
                if (this._linkedConnectionSource.isConnected) {
                    if (this._linkedConnectionSource.connectedPoint._redirectedSource && this._linkedConnectionSource.connectedPoint._redirectedSource.isConnected) {
                        return this._linkedConnectionSource.connectedPoint._redirectedSource.type;
                    }
                    return this._linkedConnectionSource.type;
                }
                if (this._linkedConnectionSource._defaultConnectionPointType) {
                    return this._linkedConnectionSource._defaultConnectionPointType;
                }
            }
            if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }
        if (this._type === NodeMaterialBlockConnectionPointTypes.BasedOnInput) {
            if (this._typeConnectionSource) {
                if (!this._typeConnectionSource.isConnected && this._defaultConnectionPointType) {
                    return this._defaultConnectionPointType;
                }
                return this._typeConnectionSource.type;
            }
            else if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }
        return this._type;
    }
    set type(value) {
        this._updateTypeDependentState(() => (this._type = value));
    }
    /** Gets or sets the target of that connection point */
    get target() {
        if (!this._prioritizeVertex || !this._ownerBlock) {
            return this._target;
        }
        if (this._target !== NodeMaterialBlockTargets.VertexAndFragment) {
            return this._target;
        }
        if (this._ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            return NodeMaterialBlockTargets.Fragment;
        }
        return NodeMaterialBlockTargets.Vertex;
    }
    set target(value) {
        this._target = value;
    }
    /**
     * Gets a boolean indicating that the current point is connected to another NodeMaterialBlock
     */
    get isConnected() {
        return this.connectedPoint !== null || this.hasEndpoints;
    }
    /**
     * Gets a boolean indicating that the current point is connected to an input block
     */
    get isConnectedToInputBlock() {
        return this.connectedPoint !== null && this.connectedPoint.ownerBlock.isInput;
    }
    /**
     * Gets a the connected input block (if any)
     */
    get connectInputBlock() {
        if (!this.isConnectedToInputBlock) {
            return null;
        }
        return this.connectedPoint.ownerBlock;
    }
    /** Get the other side of the connection (if any) */
    get connectedPoint() {
        return this._connectedPoint;
    }
    /** Get the block that owns this connection point */
    get ownerBlock() {
        return this._ownerBlock;
    }
    /** Get the block connected on the other side of this connection (if any) */
    get sourceBlock() {
        if (!this._connectedPoint) {
            return null;
        }
        return this._connectedPoint.ownerBlock;
    }
    /** Get the block connected on the endpoints of this connection (if any) */
    get connectedBlocks() {
        if (this._endpoints.length === 0) {
            return [];
        }
        return this._endpoints.map((e) => e.ownerBlock);
    }
    /** Gets the list of connected endpoints */
    get endpoints() {
        return this._endpoints;
    }
    /** Gets a boolean indicating if that output point is connected to at least one input */
    get hasEndpoints() {
        return this._endpoints && this._endpoints.length > 0;
    }
    /** Gets a boolean indicating that this connection has a path to the vertex output*/
    get isDirectlyConnectedToVertexOutput() {
        if (!this.hasEndpoints) {
            return false;
        }
        for (const endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.outputs.some((o) => o.isDirectlyConnectedToVertexOutput)) {
                    return true;
                }
            }
        }
        return false;
    }
    /** Gets a boolean indicating that this connection will be used in the vertex shader */
    get isConnectedInVertexShader() {
        if (this.target === NodeMaterialBlockTargets.Vertex) {
            return true;
        }
        if (!this.hasEndpoints) {
            return false;
        }
        for (const endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }
            if (endpoint.target === NodeMaterialBlockTargets.Vertex) {
                return true;
            }
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.outputs.some((o) => o.isConnectedInVertexShader)) {
                    return true;
                }
            }
        }
        return false;
    }
    /** Gets a boolean indicating that this connection will be used in the fragment shader */
    get isConnectedInFragmentShader() {
        if (this.target === NodeMaterialBlockTargets.Fragment) {
            return true;
        }
        if (!this.hasEndpoints) {
            return false;
        }
        for (const endpoint of this._endpoints) {
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
                return true;
            }
            if (endpoint.ownerBlock.target === NodeMaterialBlockTargets.Neutral || endpoint.ownerBlock.target === NodeMaterialBlockTargets.VertexAndFragment) {
                if (endpoint.ownerBlock.isConnectedInFragmentShader()) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Creates a block suitable to be used as an input for this input point.
     * If null is returned, a block based on the point type will be created.
     * @returns The returned string parameter is the name of the output point of NodeMaterialBlock (first parameter of the returned array) that can be connected to the input
     */
    createCustomInputBlock() {
        return null;
    }
    /**
     * Creates a new connection point
     * @param name defines the connection point name
     * @param ownerBlock defines the block hosting this connection point
     * @param direction defines the direction of the connection point
     */
    constructor(name, ownerBlock, direction) {
        /** @internal */
        this._preventBubbleUp = false;
        this._connectedPointBackingField = null;
        this._endpoints = new Array();
        /** @internal */
        this._redirectedSource = null;
        this._typeConnectionSourceBackingField = null;
        this._defaultConnectionPointTypeBackingField = null;
        /** @internal */
        this._isMainLinkSource = false;
        this._linkedConnectionSourceBackingField = null;
        /** @internal */
        this._acceptedConnectionPointType = null;
        this._type = NodeMaterialBlockConnectionPointTypes.Float;
        /** @internal */
        this._enforceAssociatedVariableName = false;
        /** @internal */
        this._forPostBuild = false;
        /** Indicates that this connection point needs dual validation before being connected to another point */
        this.needDualDirectionValidation = false;
        /**
         * Gets or sets the additional types supported by this connection point
         */
        this.acceptedConnectionPointTypes = [];
        /**
         * Gets or sets the additional types excluded by this connection point
         */
        this.excludedConnectionPointTypes = [];
        /**
         * Observable triggered when this point is connected
         */
        this.onConnectionObservable = new Observable();
        /**
         * Observable triggered when this point is disconnected
         */
        this.onDisconnectionObservable = new Observable();
        /**
         * Observable triggered when the type of the connection point is changed
         */
        this.onTypeChangedObservable = new Observable();
        this._isTypeChangeObservableNotifying = false;
        /**
         * Gets or sets a boolean indicating that this connection point is exposed on a frame
         */
        this.isExposedOnFrame = false;
        /**
         * Gets or sets number indicating the position that the port is exposed to on a frame
         */
        this.exposedPortPosition = -1;
        /** @internal */
        this._prioritizeVertex = false;
        this._target = NodeMaterialBlockTargets.VertexAndFragment;
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }
    /**
     * Gets the current class name e.g. "NodeMaterialConnectionPoint"
     * @returns the class name
     */
    getClassName() {
        return "NodeMaterialConnectionPoint";
    }
    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    canConnectTo(connectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === 0 /* NodeMaterialConnectionPointCompatibilityStates.Compatible */;
    }
    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    checkCompatibilityState(connectionPoint) {
        const ownerBlock = this._ownerBlock;
        const otherBlock = connectionPoint.ownerBlock;
        if (ownerBlock.target === NodeMaterialBlockTargets.Fragment) {
            // Let's check we are not going reverse
            if (otherBlock.target === NodeMaterialBlockTargets.Vertex) {
                return 2 /* NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible */;
            }
            for (const output of otherBlock.outputs) {
                if (output.ownerBlock.target != NodeMaterialBlockTargets.Neutral && output.isConnectedInVertexShader) {
                    return 2 /* NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible */;
                }
            }
        }
        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeMaterialBlockConnectionPointTypes.AutoDetect) {
            // Equivalents
            if (NodeMaterialConnectionPoint.AreEquivalentTypes(this.type, connectionPoint.type)) {
                return 0 /* NodeMaterialConnectionPointCompatibilityStates.Compatible */;
            }
            // Accepted types
            if ((connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) ||
                (connectionPoint._acceptedConnectionPointType && NodeMaterialConnectionPoint.AreEquivalentTypes(connectionPoint._acceptedConnectionPointType.type, this.type))) {
                return 0 /* NodeMaterialConnectionPointCompatibilityStates.Compatible */;
            }
            else {
                return 1 /* NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible */;
            }
        }
        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return 1 /* NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible */;
        }
        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === 0 /* NodeMaterialConnectionPointDirection.Input */) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }
        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return 3 /* NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue */;
        }
        return 0 /* NodeMaterialConnectionPointCompatibilityStates.Compatible */;
    }
    /**
     * Connect this point to another connection point
     * @param connectionPoint defines the other connection point
     * @param ignoreConstraints defines if the system will ignore connection type constraints (default is false)
     * @returns the current connection point
     */
    connectTo(connectionPoint, ignoreConstraints = false) {
        if (!ignoreConstraints && !this.canConnectTo(connectionPoint)) {
            // eslint-disable-next-line no-throw-literal
            throw "Cannot connect these two connectors.";
        }
        this._endpoints.push(connectionPoint);
        connectionPoint._connectedPoint = this;
        this._enforceAssociatedVariableName = false;
        this.onConnectionObservable.notifyObservers(connectionPoint);
        connectionPoint.onConnectionObservable.notifyObservers(this);
        return this;
    }
    /**
     * Disconnect this point from one of his endpoint
     * @param endpoint defines the other connection point
     * @returns the current connection point
     */
    disconnectFrom(endpoint) {
        const index = this._endpoints.indexOf(endpoint);
        if (index === -1) {
            return this;
        }
        this._endpoints.splice(index, 1);
        endpoint._connectedPoint = null;
        this._enforceAssociatedVariableName = false;
        endpoint._enforceAssociatedVariableName = false;
        this.onDisconnectionObservable.notifyObservers(endpoint);
        endpoint.onDisconnectionObservable.notifyObservers(this);
        return this;
    }
    /**
     * Fill the list of excluded connection point types with all types other than those passed in the parameter
     * @param mask Types (ORed values of NodeMaterialBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
     */
    addExcludedConnectionPointFromAllowedTypes(mask) {
        let bitmask = 1;
        while (bitmask < NodeMaterialBlockConnectionPointTypes.All) {
            if (!(mask & bitmask)) {
                this.excludedConnectionPointTypes.push(bitmask);
            }
            bitmask = bitmask << 1;
        }
    }
    /**
     * Serializes this point in a JSON representation
     * @param isInput defines if the connection point is an input (default is true)
     * @returns the serialized point object
     */
    serialize(isInput = true) {
        const serializationObject = {};
        serializationObject.name = this.name;
        if (this.displayName) {
            serializationObject.displayName = this.displayName;
        }
        if (isInput && this.connectedPoint) {
            serializationObject.inputName = this.name;
            serializationObject.targetBlockId = this.connectedPoint.ownerBlock.uniqueId;
            serializationObject.targetConnectionName = this.connectedPoint.name;
            serializationObject.isExposedOnFrame = true;
            serializationObject.exposedPortPosition = this.exposedPortPosition;
        }
        if (this.isExposedOnFrame || this.exposedPortPosition >= 0) {
            serializationObject.isExposedOnFrame = true;
            serializationObject.exposedPortPosition = this.exposedPortPosition;
        }
        return serializationObject;
    }
    /**
     * Release resources
     */
    dispose() {
        this.onConnectionObservable.clear();
        this.onDisconnectionObservable.clear();
        this.onTypeChangedObservable.clear();
        this._connectedPoint = null;
        this._typeConnectionSource = null;
        this._linkedConnectionSource = null;
    }
    _updateTypeDependentState(update) {
        const previousType = this.type;
        update();
        if (this.type !== previousType) {
            this._notifyTypeChanged();
        }
    }
    _notifyTypeChanged() {
        // Disallow re-entrancy
        if (this._isTypeChangeObservableNotifying) {
            return;
        }
        this._isTypeChangeObservableNotifying = true;
        this.onTypeChangedObservable.notifyObservers(this.type);
        this._isTypeChangeObservableNotifying = false;
    }
}
//# sourceMappingURL=nodeMaterialBlockConnectionPoint.js.map