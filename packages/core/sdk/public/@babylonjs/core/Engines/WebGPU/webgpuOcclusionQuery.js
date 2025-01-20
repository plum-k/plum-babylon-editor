import { WebGPUQuerySet } from "./webgpuQuerySet.js";
/** @internal */
export class WebGPUOcclusionQuery {
    get querySet() {
        return this._querySet.querySet;
    }
    get hasQueries() {
        return this._currentTotalIndices !== this._availableIndices.length;
    }
    canBeginQuery(index) {
        if (this._frameQuerySetIsDirty === this._engine.frameId || this._queryFrameId[index] === this._engine.frameId) {
            return false;
        }
        const canBegin = this._engine._getCurrentRenderPassWrapper().renderPassDescriptor.occlusionQuerySet !== undefined;
        if (canBegin) {
            this._queryFrameId[index] = this._engine.frameId;
        }
        return canBegin;
    }
    constructor(engine, device, bufferManager, startCount = 50, incrementCount = 100) {
        this._availableIndices = [];
        this._frameQuerySetIsDirty = -1;
        this._queryFrameId = [];
        this._engine = engine;
        this._device = device;
        this._bufferManager = bufferManager;
        this._frameLastBuffer = -1;
        this._currentTotalIndices = 0;
        this._countIncrement = incrementCount;
        this._allocateNewIndices(startCount);
    }
    createQuery() {
        if (this._availableIndices.length === 0) {
            this._allocateNewIndices();
        }
        const index = this._availableIndices[this._availableIndices.length - 1];
        this._availableIndices.length--;
        return index;
    }
    deleteQuery(index) {
        this._availableIndices[this._availableIndices.length] = index;
    }
    isQueryResultAvailable(index) {
        this._retrieveQueryBuffer();
        return !!this._lastBuffer && index < this._lastBuffer.length;
    }
    getQueryResult(index) {
        return Number(this._lastBuffer?.[index] ?? -1);
    }
    _retrieveQueryBuffer() {
        if (this._lastBuffer && this._frameLastBuffer === this._engine.frameId) {
            return;
        }
        if (this._frameLastBuffer !== this._engine.frameId) {
            this._frameLastBuffer = this._engine.frameId;
            this._querySet.readValues(0, this._currentTotalIndices).then((arrayBuffer) => {
                this._lastBuffer = arrayBuffer;
            });
        }
    }
    _allocateNewIndices(numIndices) {
        numIndices = numIndices ?? this._countIncrement;
        this._delayQuerySetDispose();
        for (let i = 0; i < numIndices; ++i) {
            this._availableIndices.push(this._currentTotalIndices + i);
        }
        this._currentTotalIndices += numIndices;
        this._querySet = new WebGPUQuerySet(this._engine, this._currentTotalIndices, "occlusion" /* WebGPUConstants.QueryType.Occlusion */, this._device, this._bufferManager, false, "QuerySet_OcclusionQuery_count_" + this._currentTotalIndices);
        this._frameQuerySetIsDirty = this._engine.frameId;
    }
    _delayQuerySetDispose() {
        const querySet = this._querySet;
        if (querySet) {
            // Wait a bit before disposing of the queryset, in case some queries are still running for it
            setTimeout(() => querySet.dispose, 1000);
        }
    }
    dispose() {
        this._querySet?.dispose();
        this._availableIndices.length = 0;
    }
}
//# sourceMappingURL=webgpuOcclusionQuery.js.map