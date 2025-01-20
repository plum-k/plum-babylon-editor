import { Engine } from "../../Engines/engine.js";
import { AbstractMesh } from "../../Meshes/abstractMesh.js";
import { _TimeToken } from "../../Instrumentation/timeToken.js";
import { PerfCounter } from "../../Misc/perfCounter.js";
import "../AbstractEngine/abstractEngine.query.js";
Engine.prototype.createQuery = function () {
    const query = this._gl.createQuery();
    if (!query) {
        throw new Error("Unable to create Occlusion Query");
    }
    return query;
};
Engine.prototype.deleteQuery = function (query) {
    this._gl.deleteQuery(query);
    return this;
};
Engine.prototype.isQueryResultAvailable = function (query) {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT_AVAILABLE);
};
Engine.prototype.getQueryResult = function (query) {
    return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT);
};
Engine.prototype.beginOcclusionQuery = function (algorithmType, query) {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.beginQuery(glAlgorithm, query);
    return true;
};
Engine.prototype.endOcclusionQuery = function (algorithmType) {
    const glAlgorithm = this._getGlAlgorithmType(algorithmType);
    this._gl.endQuery(glAlgorithm);
    return this;
};
Engine.prototype._createTimeQuery = function () {
    const timerQuery = this.getCaps().timerQuery;
    if (timerQuery.createQueryEXT) {
        return timerQuery.createQueryEXT();
    }
    return this.createQuery();
};
Engine.prototype._deleteTimeQuery = function (query) {
    const timerQuery = this.getCaps().timerQuery;
    if (timerQuery.deleteQueryEXT) {
        timerQuery.deleteQueryEXT(query);
        return;
    }
    this.deleteQuery(query);
};
Engine.prototype._getTimeQueryResult = function (query) {
    const timerQuery = this.getCaps().timerQuery;
    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_EXT);
    }
    return this.getQueryResult(query);
};
Engine.prototype._getTimeQueryAvailability = function (query) {
    const timerQuery = this.getCaps().timerQuery;
    if (timerQuery.getQueryObjectEXT) {
        return timerQuery.getQueryObjectEXT(query, timerQuery.QUERY_RESULT_AVAILABLE_EXT);
    }
    return this.isQueryResultAvailable(query);
};
Engine.prototype.startTimeQuery = function () {
    const caps = this.getCaps();
    const timerQuery = caps.timerQuery;
    if (!timerQuery) {
        return null;
    }
    const token = new _TimeToken();
    this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    if (caps.canUseTimestampForTimerQuery) {
        token._startTimeQuery = this._createTimeQuery();
        if (token._startTimeQuery) {
            timerQuery.queryCounterEXT(token._startTimeQuery, timerQuery.TIMESTAMP_EXT);
        }
    }
    else {
        if (this._currentNonTimestampToken) {
            return this._currentNonTimestampToken;
        }
        token._timeElapsedQuery = this._createTimeQuery();
        if (token._timeElapsedQuery) {
            if (timerQuery.beginQueryEXT) {
                timerQuery.beginQueryEXT(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            }
            else {
                this._gl.beginQuery(timerQuery.TIME_ELAPSED_EXT, token._timeElapsedQuery);
            }
        }
        this._currentNonTimestampToken = token;
    }
    return token;
};
Engine.prototype.endTimeQuery = function (token) {
    const caps = this.getCaps();
    const timerQuery = caps.timerQuery;
    if (!timerQuery || !token) {
        return -1;
    }
    if (caps.canUseTimestampForTimerQuery) {
        if (!token._startTimeQuery) {
            return -1;
        }
        if (!token._endTimeQuery) {
            token._endTimeQuery = this._createTimeQuery();
            if (token._endTimeQuery) {
                timerQuery.queryCounterEXT(token._endTimeQuery, timerQuery.TIMESTAMP_EXT);
            }
        }
    }
    else if (!token._timeElapsedQueryEnded) {
        if (!token._timeElapsedQuery) {
            return -1;
        }
        if (timerQuery.endQueryEXT) {
            timerQuery.endQueryEXT(timerQuery.TIME_ELAPSED_EXT);
        }
        else {
            this._gl.endQuery(timerQuery.TIME_ELAPSED_EXT);
            this._currentNonTimestampToken = null;
        }
        token._timeElapsedQueryEnded = true;
    }
    const disjoint = this._gl.getParameter(timerQuery.GPU_DISJOINT_EXT);
    let available = false;
    if (token._endTimeQuery) {
        available = this._getTimeQueryAvailability(token._endTimeQuery);
    }
    else if (token._timeElapsedQuery) {
        available = this._getTimeQueryAvailability(token._timeElapsedQuery);
    }
    if (available && !disjoint) {
        let result = 0;
        if (caps.canUseTimestampForTimerQuery) {
            if (!token._startTimeQuery || !token._endTimeQuery) {
                return -1;
            }
            const timeStart = this._getTimeQueryResult(token._startTimeQuery);
            const timeEnd = this._getTimeQueryResult(token._endTimeQuery);
            result = timeEnd - timeStart;
            this._deleteTimeQuery(token._startTimeQuery);
            this._deleteTimeQuery(token._endTimeQuery);
            token._startTimeQuery = null;
            token._endTimeQuery = null;
        }
        else {
            if (!token._timeElapsedQuery) {
                return -1;
            }
            result = this._getTimeQueryResult(token._timeElapsedQuery);
            this._deleteTimeQuery(token._timeElapsedQuery);
            token._timeElapsedQuery = null;
            token._timeElapsedQueryEnded = false;
        }
        return result;
    }
    return -1;
};
Engine.prototype._captureGPUFrameTime = false;
Engine.prototype._gpuFrameTime = new PerfCounter();
Engine.prototype.getGPUFrameTimeCounter = function () {
    return this._gpuFrameTime;
};
Engine.prototype.captureGPUFrameTime = function (value) {
    if (value === this._captureGPUFrameTime) {
        return;
    }
    this._captureGPUFrameTime = value;
    if (value) {
        this._onBeginFrameObserver = this.onBeginFrameObservable.add(() => {
            if (!this._gpuFrameTimeToken) {
                this._gpuFrameTimeToken = this.startTimeQuery();
            }
        });
        this._onEndFrameObserver = this.onEndFrameObservable.add(() => {
            if (!this._gpuFrameTimeToken) {
                return;
            }
            const time = this.endTimeQuery(this._gpuFrameTimeToken);
            if (time > -1) {
                this._gpuFrameTimeToken = null;
                this._gpuFrameTime.fetchNewFrame();
                this._gpuFrameTime.addCount(time, true);
            }
        });
    }
    else {
        this.onBeginFrameObservable.remove(this._onBeginFrameObserver);
        this._onBeginFrameObserver = null;
        this.onEndFrameObservable.remove(this._onEndFrameObserver);
        this._onEndFrameObserver = null;
    }
};
Engine.prototype._getGlAlgorithmType = function (algorithmType) {
    return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? this._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : this._gl.ANY_SAMPLES_PASSED;
};
//# sourceMappingURL=engine.query.js.map