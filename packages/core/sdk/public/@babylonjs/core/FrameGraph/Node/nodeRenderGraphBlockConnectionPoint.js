import { Observable } from "../../Misc/observable.js";
import { NodeRenderGraphBlockConnectionPointTypes } from "./Types/nodeRenderGraphTypes.js";
/**
 * Defines a connection point for a block
 */
export class NodeRenderGraphConnectionPoint {
    /** Gets the direction of the point */
    get direction() {
        return this._direction;
    }
    /**
     * Checks if the value is a texture handle
     * @param value The value to check
     * @returns True if the value is a texture handle
     */
    static IsTextureHandle(value) {
        return value !== undefined && Number.isFinite(value);
    }
    /**
     * Checks if the value is a shadow generator task
     * @param value The value to check
     * @returns True if the value is a shadow generator
     */
    static IsShadowGenerator(value) {
        return value !== undefined && value.mapSize !== undefined;
    }
    /**
     * Checks if the value is a shadow light
     * @param value The value to check
     * @returns True if the value is a shadow light
     */
    static IsShadowLight(value) {
        return value !== undefined && value.setShadowProjectionMatrix !== undefined;
    }
    /**
     * Gets or sets the connection point type (default is Undefined)
     */
    get type() {
        if (this._type === NodeRenderGraphBlockConnectionPointTypes.AutoDetect) {
            if (this._ownerBlock.isInput) {
                return this._ownerBlock.type;
            }
            if (this._connectedPoint) {
                return this._connectedPoint.type;
            }
            if (this._linkedConnectionSource) {
                if (this._linkedConnectionSource.isConnected) {
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
        if (this._type === NodeRenderGraphBlockConnectionPointTypes.BasedOnInput) {
            if (this._typeConnectionSource) {
                const typeConnectionSource = typeof this._typeConnectionSource === "function" ? this._typeConnectionSource() : this._typeConnectionSource;
                if (!typeConnectionSource.isConnected) {
                    return this._defaultConnectionPointType ?? typeConnectionSource.type;
                }
                return typeConnectionSource._connectedPoint.type;
            }
            else if (this._defaultConnectionPointType) {
                return this._defaultConnectionPointType;
            }
        }
        return this._type;
    }
    set type(value) {
        this._type = value;
    }
    /**
     * Gets a boolean indicating that the current point is connected to another NodeRenderGraphBlock
     */
    get isConnected() {
        return this.connectedPoint !== null || this.hasEndpoints;
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
    /** Get the inner type (ie AutoDetect for instance instead of the inferred one) */
    get innerType() {
        if (this._linkedConnectionSource && !this._isMainLinkSource && this._linkedConnectionSource.isConnected) {
            return this.type;
        }
        return this._type;
    }
    /**
     * Creates a block suitable to be used as an input for this input point.
     * If null is returned, a block based on the point type will be created.
     * @returns The returned string parameter is the name of the output point of NodeRenderGraphBlock (first parameter of the returned array) that can be connected to the input
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
        this._connectedPoint = null;
        /** @internal */
        this._acceptedConnectionPointType = null;
        this._endpoints = new Array();
        this._type = NodeRenderGraphBlockConnectionPointTypes.Undefined;
        /** @internal */
        this._linkedConnectionSource = null;
        /** @internal */
        this._isMainLinkSource = false;
        /** @internal */
        this._typeConnectionSource = null;
        /** @internal */
        this._defaultConnectionPointType = null;
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
         * Gets or sets a boolean indicating that this connection point is exposed on a frame
         */
        this.isExposedOnFrame = false;
        /**
         * Gets or sets number indicating the position that the port is exposed to on a frame
         */
        this.exposedPortPosition = -1;
        this._ownerBlock = ownerBlock;
        this.name = name;
        this._direction = direction;
    }
    /**
     * Gets the current class name e.g. "NodeRenderGraphConnectionPoint"
     * @returns the class name
     */
    getClassName() {
        return "NodeRenderGraphConnectionPoint";
    }
    /**
     * Gets a boolean indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a boolean
     */
    canConnectTo(connectionPoint) {
        return this.checkCompatibilityState(connectionPoint) === 0 /* NodeRenderGraphConnectionPointCompatibilityStates.Compatible */;
    }
    /**
     * Gets a number indicating if the current point can be connected to another point
     * @param connectionPoint defines the other connection point
     * @returns a number defining the compatibility state
     */
    checkCompatibilityState(connectionPoint) {
        const ownerBlock = this._ownerBlock;
        const otherBlock = connectionPoint.ownerBlock;
        if (this.type !== connectionPoint.type && connectionPoint.innerType !== NodeRenderGraphBlockConnectionPointTypes.AutoDetect) {
            // Accepted types
            if (connectionPoint.acceptedConnectionPointTypes && connectionPoint.acceptedConnectionPointTypes.indexOf(this.type) !== -1) {
                return 0 /* NodeRenderGraphConnectionPointCompatibilityStates.Compatible */;
            }
            else {
                return 1 /* NodeRenderGraphConnectionPointCompatibilityStates.TypeIncompatible */;
            }
        }
        // Excluded
        if (connectionPoint.excludedConnectionPointTypes && connectionPoint.excludedConnectionPointTypes.indexOf(this.type) !== -1) {
            return 1 /* NodeRenderGraphConnectionPointCompatibilityStates.TypeIncompatible */;
        }
        // Check hierarchy
        let targetBlock = otherBlock;
        let sourceBlock = ownerBlock;
        if (this.direction === 0 /* NodeRenderGraphConnectionPointDirection.Input */) {
            targetBlock = ownerBlock;
            sourceBlock = otherBlock;
        }
        if (targetBlock.isAnAncestorOf(sourceBlock)) {
            return 2 /* NodeRenderGraphConnectionPointCompatibilityStates.HierarchyIssue */;
        }
        return 0 /* NodeRenderGraphConnectionPointCompatibilityStates.Compatible */;
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
        this.onDisconnectionObservable.notifyObservers(endpoint);
        endpoint.onDisconnectionObservable.notifyObservers(this);
        return this;
    }
    /**
     * Fills the list of excluded connection point types with all types other than those passed in the parameter
     * @param mask Types (ORed values of NodeRenderGraphBlockConnectionPointTypes) that are allowed, and thus will not be pushed to the excluded list
     */
    addExcludedConnectionPointFromAllowedTypes(mask) {
        let bitmask = 0;
        let val = 2 ** bitmask;
        // Note: don't use 1 << bitmask instead of 2 ** bitmask, as it will cause an infinite loop because 1 << 31 is negative!
        while (val < NodeRenderGraphBlockConnectionPointTypes.All) {
            if (!(mask & val)) {
                this.excludedConnectionPointTypes.push(val);
            }
            bitmask++;
            val = 2 ** bitmask;
        }
    }
    /**
     * Adds accepted connection point types
     * @param mask Types (ORed values of NodeRenderGraphBlockConnectionPointTypes) that are allowed to connect to this point
     */
    addAcceptedConnectionPointTypes(mask) {
        let bitmask = 0;
        let val = 2 ** bitmask;
        // Note: don't use 1 << bitmask instead of 2 ** bitmask, as it will cause an infinite loop because 1 << 31 is negative!
        while (val < NodeRenderGraphBlockConnectionPointTypes.All) {
            if (mask & val && this.acceptedConnectionPointTypes.indexOf(val) === -1) {
                this.acceptedConnectionPointTypes.push(val);
            }
            bitmask++;
            val = 2 ** bitmask;
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
        serializationObject.displayName = this.displayName;
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
    }
}
//# sourceMappingURL=nodeRenderGraphBlockConnectionPoint.js.map