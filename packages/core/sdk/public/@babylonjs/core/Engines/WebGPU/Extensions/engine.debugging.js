import { WebGPUEngine } from "../../webgpuEngine.js";
WebGPUEngine.prototype._debugPushGroup = function (groupName, targetObject) {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }
    if (targetObject === 0 || targetObject === 1) {
        if (targetObject === 1) {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            else {
                this._endCurrentRenderPass();
            }
        }
        this._renderEncoder.pushDebugGroup(groupName);
    }
    else if (this._currentRenderPass) {
        this._currentRenderPass.pushDebugGroup(groupName);
        this._debugStackRenderPass.push(groupName);
    }
    else {
        this._pendingDebugCommands.push(["push", groupName, targetObject]);
    }
};
WebGPUEngine.prototype._debugPopGroup = function (targetObject) {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }
    if (targetObject === 0 || targetObject === 1) {
        if (targetObject === 1) {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            else {
                this._endCurrentRenderPass();
            }
        }
        this._renderEncoder.popDebugGroup();
    }
    else if (this._currentRenderPass) {
        this._currentRenderPass.popDebugGroup();
        this._debugStackRenderPass.pop();
    }
    else {
        this._pendingDebugCommands.push(["pop", null, targetObject]);
    }
};
WebGPUEngine.prototype._debugInsertMarker = function (text, targetObject) {
    if (!this._options.enableGPUDebugMarkers) {
        return;
    }
    if (targetObject === 0 || targetObject === 1) {
        if (targetObject === 1) {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            else {
                this._endCurrentRenderPass();
            }
        }
        this._renderEncoder.insertDebugMarker(text);
    }
    else if (this._currentRenderPass) {
        this._currentRenderPass.insertDebugMarker(text);
    }
    else {
        this._pendingDebugCommands.push(["insert", text, targetObject]);
    }
};
WebGPUEngine.prototype._debugFlushPendingCommands = function () {
    if (this._debugStackRenderPass.length !== 0) {
        const currentDebugStack = this._debugStackRenderPass.slice();
        this._debugStackRenderPass.length = 0;
        for (let i = 0; i < currentDebugStack.length; ++i) {
            this._debugPushGroup(currentDebugStack[i], 2);
        }
    }
    for (let i = 0; i < this._pendingDebugCommands.length; ++i) {
        const [name, param, targetObject] = this._pendingDebugCommands[i];
        switch (name) {
            case "push":
                this._debugPushGroup(param, targetObject);
                break;
            case "pop":
                this._debugPopGroup(targetObject);
                break;
            case "insert":
                this._debugInsertMarker(param, targetObject);
                break;
        }
    }
    this._pendingDebugCommands.length = 0;
};
//# sourceMappingURL=engine.debugging.js.map