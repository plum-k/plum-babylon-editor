
import { BindMorphTargetParameters } from "../Materials/materialHelper.functions.js";
/**
 * A helper class to simplify work with FAST snapshot mode (WebGPU only - can be used in WebGL too, but won't do anything).
 */
export class SnapshotRenderingHelper {
    /**
     * Creates a new snapshot rendering helper
     * Note that creating an instance of the helper will set the snapshot rendering mode to SNAPSHOTRENDERING_FAST but will not enable snapshot rendering (engine.snapshotRendering is not updated).
     * Note also that fixMeshes() is called as part of the construction
     * @param scene The scene to use the helper in
     * @param options The options for the helper
     */
    constructor(scene, options) {
        this._disableRenderingRefCount = 0;
        this._currentPerformancePriorityMode = 0 /* ScenePerformancePriority.BackwardCompatible */;
        this._scene = scene;
        this._engine = scene.getEngine();
        if (!this._engine.isWebGPU) {
            return;
        }
        this._options = {
            morphTargetsNumMaxInfluences: 20,
            ...options,
        };
        this._engine.snapshotRenderingMode = 1;
        this.fixMeshes();
        this._onResizeObserver = this._engine.onResizeObservable.add(() => {
            // enableSnapshotRendering() will delay the actual enabling of snapshot rendering by at least a frame, so these two lines are not redundant!
            this.disableSnapshotRendering();
            this.enableSnapshotRendering();
        });
        this._scene.onBeforeRenderObservable.add(() => {
            if (!this._fastSnapshotRenderingEnabled) {
                return;
            }
            // Animate skeletons
            scene.skeletons.forEach((skeleton) => skeleton.prepare(true));
            for (const mesh of scene.meshes) {
                if (mesh.infiniteDistance) {
                    mesh.transferToEffect(mesh.computeWorldMatrix(true));
                }
                if (mesh.skeleton) {
                    mesh.transferToEffect(mesh.computeWorldMatrix(true));
                }
                if (mesh.getClassName() === "GaussianSplattingMesh") {
                    mesh._postToWorker();
                }
                if (mesh.morphTargetManager && mesh.subMeshes) {
                    // Make sure morph target animations work
                    for (const subMesh of mesh.subMeshes) {
                        const dw = subMesh._drawWrapper;
                        const effect = dw.effect;
                        if (effect) {
                            const dataBuffer = dw.drawContext.buffers["LeftOver"];
                            const ubLeftOver = effect._pipelineContext?.uniformBuffer;
                            if (dataBuffer && ubLeftOver && ubLeftOver.setDataBuffer(dataBuffer)) {
                                mesh.morphTargetManager._bind(effect);
                                BindMorphTargetParameters(mesh, effect);
                                ubLeftOver.update();
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Enable snapshot rendering
     * Use this method instead of engine.snapshotRendering=true, to make sure everything is ready before enabling snapshot rendering.
     * Note that this method is ref-counted and works in pair with disableSnapshotRendering(): you should call enableSnapshotRendering() as many times as you call disableSnapshotRendering().
     */
    enableSnapshotRendering() {
        if (!this._engine.isWebGPU) {
            return;
        }
        if (--this._disableRenderingRefCount > 0) {
            return;
        }
        this._disableRenderingRefCount = 0;
        this._currentPerformancePriorityMode = this._pendingCurrentPerformancePriorityMode ?? this._scene.performancePriority;
        this._pendingCurrentPerformancePriorityMode = undefined;
        this._scene.performancePriority = 0 /* ScenePerformancePriority.BackwardCompatible */;
        this._scene.executeWhenReady(() => {
            if (this._disableRenderingRefCount > 0) {
                return;
            }
            // Make sure a full frame is rendered before enabling snapshot rendering, so use "+2" instead of "+1"
            this._executeAtFrame(this._engine.frameId + 2, () => {
                this._engine.snapshotRendering = true;
            });
        });
    }
    /**
     * Disable snapshot rendering
     * Note that this method is ref-counted and works in pair with disableSnapshotRendering(): you should call enableSnapshotRendering() as many times as you call disableSnapshotRendering().
     */
    disableSnapshotRendering() {
        if (!this._engine.isWebGPU) {
            return;
        }
        if (this._disableRenderingRefCount === 0) {
            // Snapshot rendering switches from enabled to disabled
            // We reset the performance priority mode to that which it was before enabling snapshot rendering, but first set it to “BackwardCompatible” to allow the system to regenerate resources that may have been optimized for snapshot rendering.
            // We'll then restore the original mode at the next frame.
            this._scene.performancePriority = 0 /* ScenePerformancePriority.BackwardCompatible */;
            if (this._currentPerformancePriorityMode !== 0 /* ScenePerformancePriority.BackwardCompatible */) {
                this._pendingCurrentPerformancePriorityMode = this._currentPerformancePriorityMode;
                this._scene.executeWhenReady(() => {
                    this._executeAtFrame(this._engine.frameId + 2, () => {
                        // if this._disableRenderingRefCount === 0, snapshot rendering has been enabled in the meantime, so do nothing
                        if (this._disableRenderingRefCount > 0 && this._pendingCurrentPerformancePriorityMode !== undefined) {
                            this._scene.performancePriority = this._pendingCurrentPerformancePriorityMode;
                        }
                        this._pendingCurrentPerformancePriorityMode = undefined;
                    }, true);
                });
            }
        }
        this._engine.snapshotRendering = false;
        this._disableRenderingRefCount++;
    }
    /**
     * Fix meshes for snapshot rendering.
     * This method will make sure that some features are disabled or fixed to make sure snapshot rendering works correctly.
     * @param meshes List of meshes to fix. If not provided, all meshes in the scene will be fixed.
     */
    fixMeshes(meshes) {
        if (!this._engine.isWebGPU) {
            return;
        }
        meshes = meshes || this._scene.meshes;
        for (const mesh of meshes) {
            mesh.ignoreCameraMaxZ = false;
            if (mesh.morphTargetManager) {
                mesh.morphTargetManager.numMaxInfluencers = Math.min(mesh.morphTargetManager.numTargets, this._options.morphTargetsNumMaxInfluences);
            }
        }
    }
    /**
     * Call this method to update a mesh on the GPU after some properties have changed (position, rotation, scaling, visibility).
     * @param mesh The mesh to update. Can be a single mesh or an array of meshes to update.
     */
    updateMesh(mesh) {
        if (!this._fastSnapshotRenderingEnabled) {
            return;
        }
        if (Array.isArray(mesh)) {
            for (const m of mesh) {
                m.transferToEffect(m.computeWorldMatrix(true));
            }
            return;
        }
        mesh.transferToEffect(mesh.computeWorldMatrix(true));
    }
    /**
     * Update the meshes used in an effect layer to ensure that snapshot rendering works correctly for these meshes in this layer.
     * @param effectLayer The effect layer
     * @param autoUpdate If true, the helper will automatically update the effect layer meshes with each frame. If false, you'll need to call this method manually when the camera or layer meshes move or rotate.
     */
    updateMeshesForEffectLayer(effectLayer, autoUpdate = true) {
        if (!this._engine.isWebGPU) {
            return;
        }
        const renderPassId = effectLayer.mainTexture.renderPassId;
        if (autoUpdate) {
            this._onBeforeRenderObserverUpdateLayer = this._scene.onBeforeRenderObservable.add(() => {
                this._updateMeshMatricesForRenderPassId(renderPassId);
            });
        }
        else {
            this._updateMeshMatricesForRenderPassId(renderPassId);
        }
    }
    /**
     * Dispose the helper
     */
    dispose() {
        if (!this._engine.isWebGPU) {
            return;
        }
        this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        this._scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserverUpdateLayer);
        this._engine.onResizeObservable.remove(this._onResizeObserver);
    }
    get _fastSnapshotRenderingEnabled() {
        return this._engine.snapshotRendering && this._engine.snapshotRenderingMode === 1;
    }
    _updateMeshMatricesForRenderPassId(renderPassId) {
        if (!this._fastSnapshotRenderingEnabled) {
            return;
        }
        const sceneTransformationMatrix = this._scene.getTransformMatrix();
        for (let i = 0; i < this._scene.meshes.length; ++i) {
            const mesh = this._scene.meshes[i];
            if (!mesh.subMeshes) {
                continue;
            }
            for (let j = 0; j < mesh.subMeshes.length; ++j) {
                const dw = mesh.subMeshes[j]._getDrawWrapper(renderPassId);
                const effect = dw?.effect;
                if (effect) {
                    const dataBuffer = dw.drawContext.buffers["LeftOver"];
                    const ubLeftOver = effect._pipelineContext?.uniformBuffer;
                    if (dataBuffer && ubLeftOver && ubLeftOver.setDataBuffer(dataBuffer)) {
                        effect.setMatrix("viewProjection", sceneTransformationMatrix);
                        effect.setMatrix("world", mesh.computeWorldMatrix());
                        ubLeftOver.update();
                    }
                }
            }
        }
    }
    _executeAtFrame(frameId, func, executeWhenModeIsDisabled = false) {
        const obs = this._engine.onEndFrameObservable.add(() => {
            if ((this._disableRenderingRefCount > 0 && !executeWhenModeIsDisabled) || (this._disableRenderingRefCount === 0 && executeWhenModeIsDisabled)) {
                this._engine.onEndFrameObservable.remove(obs);
                return;
            }
            if (this._engine.frameId >= frameId) {
                this._engine.onEndFrameObservable.remove(obs);
                func();
            }
        });
    }
}
//# sourceMappingURL=snapshotRenderingHelper.js.map