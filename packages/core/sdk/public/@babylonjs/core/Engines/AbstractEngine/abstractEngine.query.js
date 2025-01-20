import { AbstractMesh } from "../../Meshes/abstractMesh.js";
import { AbstractEngine } from "../abstractEngine.js";
/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _OcclusionDataStorage {
    constructor() {
        /** @internal */
        this.occlusionInternalRetryCounter = 0;
        /** @internal */
        this.isOcclusionQueryInProgress = false;
        /** @internal */
        this.isOccluded = false;
        /** @internal */
        this.occlusionRetryCount = -1;
        /** @internal */
        this.occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE;
        /** @internal */
        this.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        /** @internal */
        this.forceRenderingWhenOccluded = false;
    }
}
AbstractEngine.prototype.getGPUFrameTimeCounter = function () {
    return null;
};
AbstractEngine.prototype.captureGPUFrameTime = function (value) {
    // Do nothing. Must be implemented by child classes
};
AbstractEngine.prototype.createQuery = function () {
    return null;
};
AbstractEngine.prototype.deleteQuery = function (query) {
    // Do nothing. Must be implemented by child classes
    return this;
};
AbstractEngine.prototype.isQueryResultAvailable = function (query) {
    // Do nothing. Must be implemented by child classes
    return false;
};
AbstractEngine.prototype.getQueryResult = function (query) {
    // Do nothing. Must be implemented by child classes
    return 0;
};
AbstractEngine.prototype.beginOcclusionQuery = function (algorithmType, query) {
    // Do nothing. Must be implemented by child classes
    return false;
};
AbstractEngine.prototype.endOcclusionQuery = function (algorithmType) {
    // Do nothing. Must be implemented by child classes
    return this;
};
Object.defineProperty(AbstractMesh.prototype, "isOcclusionQueryInProgress", {
    get: function () {
        return this._occlusionDataStorage.isOcclusionQueryInProgress;
    },
    set: function (value) {
        this._occlusionDataStorage.isOcclusionQueryInProgress = value;
    },
    enumerable: false,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "_occlusionDataStorage", {
    get: function () {
        if (!this.__occlusionDataStorage) {
            this.__occlusionDataStorage = new _OcclusionDataStorage();
        }
        return this.__occlusionDataStorage;
    },
    enumerable: false,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "isOccluded", {
    get: function () {
        return this._occlusionDataStorage.isOccluded;
    },
    set: function (value) {
        this._occlusionDataStorage.isOccluded = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "occlusionQueryAlgorithmType", {
    get: function () {
        return this._occlusionDataStorage.occlusionQueryAlgorithmType;
    },
    set: function (value) {
        this._occlusionDataStorage.occlusionQueryAlgorithmType = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "occlusionType", {
    get: function () {
        return this._occlusionDataStorage.occlusionType;
    },
    set: function (value) {
        this._occlusionDataStorage.occlusionType = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "occlusionRetryCount", {
    get: function () {
        return this._occlusionDataStorage.occlusionRetryCount;
    },
    set: function (value) {
        this._occlusionDataStorage.occlusionRetryCount = value;
    },
    enumerable: true,
    configurable: true,
});
Object.defineProperty(AbstractMesh.prototype, "forceRenderingWhenOccluded", {
    get: function () {
        return this._occlusionDataStorage.forceRenderingWhenOccluded;
    },
    set: function (value) {
        this._occlusionDataStorage.forceRenderingWhenOccluded = value;
    },
    enumerable: true,
    configurable: true,
});
// We also need to update AbstractMesh as there is a portion of the code there
AbstractMesh.prototype._checkOcclusionQuery = function () {
    const dataStorage = this._occlusionDataStorage;
    if (dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_NONE) {
        dataStorage.isOccluded = false;
        return false;
    }
    const engine = this.getEngine();
    if (!engine.getCaps().supportOcclusionQuery) {
        dataStorage.isOccluded = false;
        return false;
    }
    if (!engine.isQueryResultAvailable) {
        // Occlusion query where not referenced
        dataStorage.isOccluded = false;
        return false;
    }
    if (this.isOcclusionQueryInProgress && this._occlusionQuery !== null && this._occlusionQuery !== undefined) {
        const isOcclusionQueryAvailable = engine.isQueryResultAvailable(this._occlusionQuery);
        if (isOcclusionQueryAvailable) {
            const occlusionQueryResult = engine.getQueryResult(this._occlusionQuery);
            dataStorage.isOcclusionQueryInProgress = false;
            dataStorage.occlusionInternalRetryCounter = 0;
            dataStorage.isOccluded = occlusionQueryResult > 0 ? false : true;
        }
        else {
            dataStorage.occlusionInternalRetryCounter++;
            if (dataStorage.occlusionRetryCount !== -1 && dataStorage.occlusionInternalRetryCounter > dataStorage.occlusionRetryCount) {
                dataStorage.isOcclusionQueryInProgress = false;
                dataStorage.occlusionInternalRetryCounter = 0;
                // if optimistic set isOccluded to false regardless of the status of isOccluded. (Render in the current render loop)
                // if strict continue the last state of the object.
                dataStorage.isOccluded = dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC ? false : dataStorage.isOccluded;
            }
            else {
                return dataStorage.occlusionType === AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC ? false : dataStorage.isOccluded;
            }
        }
    }
    const scene = this.getScene();
    if (scene.getBoundingBoxRenderer) {
        const occlusionBoundingBoxRenderer = scene.getBoundingBoxRenderer();
        if (this._occlusionQuery === null) {
            this._occlusionQuery = engine.createQuery();
        }
        if (this._occlusionQuery && engine.beginOcclusionQuery(dataStorage.occlusionQueryAlgorithmType, this._occlusionQuery)) {
            occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
            engine.endOcclusionQuery(dataStorage.occlusionQueryAlgorithmType);
            this._occlusionDataStorage.isOcclusionQueryInProgress = true;
        }
    }
    return dataStorage.isOccluded;
};
//# sourceMappingURL=abstractEngine.query.js.map