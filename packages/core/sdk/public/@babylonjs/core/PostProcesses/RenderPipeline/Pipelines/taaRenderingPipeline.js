import { __decorate } from "../../../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { serialize } from "../../../Misc/decorators.js";
import { SerializationHelper } from "../../../Misc/decorators.serialization.js";
import { PostProcess } from "../../postProcess.js";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline.js";
import { PostProcessRenderEffect } from "../postProcessRenderEffect.js";
import { RegisterClass } from "../../../Misc/typeStore.js";

import { PassPostProcess } from "../../passPostProcess.js";
import { ThinTAAPostProcess } from "../../thinTAAPostProcess.js";
import "../postProcessRenderPipelineManagerSceneComponent.js";
/**
 * Simple implementation of Temporal Anti-Aliasing (TAA).
 * This can be used to improve image quality for still pictures (screenshots for e.g.).
 */
export class TAARenderingPipeline extends PostProcessRenderPipeline {
    /**
     * Number of accumulated samples (default: 16)
     */
    set samples(samples) {
        this._taaThinPostProcess.samples = samples;
    }
    get samples() {
        return this._taaThinPostProcess.samples;
    }
    /**
     * MSAA samples (default: 1)
     */
    set msaaSamples(samples) {
        if (this._msaaSamples === samples) {
            return;
        }
        this._msaaSamples = samples;
        if (this._taaPostProcess) {
            this._taaPostProcess.samples = samples;
        }
    }
    get msaaSamples() {
        return this._msaaSamples;
    }
    /**
     * The factor used to blend the history frame with current frame (default: 0.05)
     */
    get factor() {
        return this._taaThinPostProcess.factor;
    }
    set factor(value) {
        this._taaThinPostProcess.factor = value;
    }
    /**
     * Disable TAA on camera move (default: true).
     * You generally want to keep this enabled, otherwise you will get a ghost effect when the camera moves (but if it's what you want, go for it!)
     */
    get disableOnCameraMove() {
        return this._taaThinPostProcess.disableOnCameraMove;
    }
    set disableOnCameraMove(value) {
        this._taaThinPostProcess.disableOnCameraMove = value;
    }
    /**
     * Gets or sets a boolean indicating if the render pipeline is enabled (default: true).
     */
    get isEnabled() {
        return this._isEnabled;
    }
    set isEnabled(value) {
        if (this._isEnabled === value) {
            return;
        }
        this._isEnabled = value;
        if (!value) {
            if (this._cameras !== null) {
                this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
                this._cameras = this._camerasToBeAttached.slice();
            }
        }
        else if (value) {
            if (!this._isDirty) {
                if (this._cameras !== null) {
                    this._taaThinPostProcess._reset();
                    this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
                }
            }
            else {
                this._buildPipeline();
            }
        }
    }
    /**
     * Gets active scene
     */
    get scene() {
        return this._scene;
    }
    /**
     * Returns true if TAA is supported by the running hardware
     */
    get isSupported() {
        const caps = this._scene.getEngine().getCaps();
        return caps.texelFetch;
    }
    /**
     * Constructor of the TAA rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param cameras The array of cameras that the rendering pipeline will be attached to (default: scene.cameras)
     * @param textureType The type of texture where the scene will be rendered (default: 0)
     */
    constructor(name, scene, cameras, textureType = 0) {
        const engine = scene.getEngine();
        super(engine, name);
        /**
         * The TAA PostProcess effect id in the pipeline
         */
        this.TAARenderEffect = "TAARenderEffect";
        /**
         * The pass PostProcess effect id in the pipeline
         */
        this.TAAPassEffect = "TAAPassEffect";
        this._msaaSamples = 1;
        this._isEnabled = true;
        this._isDirty = false;
        this._camerasToBeAttached = [];
        this._pingpong = 0;
        this._cameras = cameras || scene.cameras;
        this._cameras = this._cameras.slice();
        this._camerasToBeAttached = this._cameras.slice();
        this._scene = scene;
        this._textureType = textureType;
        this._taaThinPostProcess = new ThinTAAPostProcess("TAA", this._scene.getEngine());
        if (this.isSupported) {
            this._createPingPongTextures(engine.getRenderWidth(), engine.getRenderHeight());
            scene.postProcessRenderPipelineManager.addPipeline(this);
            this._buildPipeline();
        }
    }
    /**
     * Get the class name
     * @returns "TAARenderingPipeline"
     */
    getClassName() {
        return "TAARenderingPipeline";
    }
    /**
     * Adds a camera to the pipeline
     * @param camera the camera to be added
     */
    addCamera(camera) {
        this._camerasToBeAttached.push(camera);
        this._buildPipeline();
    }
    /**
     * Removes a camera from the pipeline
     * @param camera the camera to remove
     */
    removeCamera(camera) {
        const index = this._camerasToBeAttached.indexOf(camera);
        this._camerasToBeAttached.splice(index, 1);
        this._buildPipeline();
    }
    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     */
    dispose() {
        this._disposePostProcesses();
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        this._ping.dispose();
        this._pong.dispose();
        super.dispose();
    }
    _createPingPongTextures(width, height) {
        const engine = this._scene.getEngine();
        this._ping?.dispose();
        this._pong?.dispose();
        this._ping = engine.createRenderTargetTexture({ width, height }, { generateMipMaps: false, generateDepthBuffer: false, type: 2, samplingMode: 1 });
        this._pong = engine.createRenderTargetTexture({ width, height }, { generateMipMaps: false, generateDepthBuffer: false, type: 2, samplingMode: 1 });
        this._taaThinPostProcess.textureWidth = width;
        this._taaThinPostProcess.textureHeight = height;
    }
    _buildPipeline() {
        if (!this.isSupported) {
            return;
        }
        if (!this._isEnabled) {
            this._isDirty = true;
            return;
        }
        this._isDirty = false;
        const engine = this._scene.getEngine();
        this._disposePostProcesses();
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
            // get back cameras to be used to reattach pipeline
            this._cameras = this._camerasToBeAttached.slice();
        }
        this._reset();
        this._createTAAPostProcess();
        this.addEffect(new PostProcessRenderEffect(engine, this.TAARenderEffect, () => {
            return this._taaPostProcess;
        }, true));
        this._createPassPostProcess();
        this.addEffect(new PostProcessRenderEffect(engine, this.TAAPassEffect, () => {
            return this._passPostProcess;
        }, true));
        if (this._cameras !== null) {
            this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this._name, this._cameras);
        }
    }
    _disposePostProcesses() {
        for (let i = 0; i < this._cameras.length; i++) {
            const camera = this._cameras[i];
            this._taaPostProcess?.dispose(camera);
            this._passPostProcess?.dispose(camera);
            camera.getProjectionMatrix(true); // recompute the projection matrix
        }
        this._taaPostProcess = null;
        this._passPostProcess = null;
    }
    _createTAAPostProcess() {
        this._taaPostProcess = new PostProcess("TAA", "taa", {
            uniforms: ["factor"],
            samplers: ["historySampler"],
            size: 1.0,
            engine: this._scene.getEngine(),
            textureType: this._textureType,
            effectWrapper: this._taaThinPostProcess,
        });
        this._taaPostProcess.samples = this._msaaSamples;
        this._taaPostProcess.onActivateObservable.add(() => {
            this._taaThinPostProcess.camera = this._scene.activeCamera;
            if (this._taaPostProcess?.width !== this._ping.width || this._taaPostProcess?.height !== this._ping.height) {
                const engine = this._scene.getEngine();
                this._createPingPongTextures(engine.getRenderWidth(), engine.getRenderHeight());
            }
            this._taaThinPostProcess.updateProjectionMatrix();
            if (this._passPostProcess) {
                this._passPostProcess.inputTexture = this._pingpong ? this._ping : this._pong;
            }
            this._pingpong = this._pingpong ^ 1;
        });
        this._taaPostProcess.onApplyObservable.add((effect) => {
            effect._bindTexture("historySampler", this._pingpong ? this._ping.texture : this._pong.texture);
        });
    }
    _createPassPostProcess() {
        const engine = this._scene.getEngine();
        this._passPostProcess = new PassPostProcess("TAAPass", 1, null, 1, engine);
        this._passPostProcess.inputTexture = this._ping;
        this._passPostProcess.autoClear = false;
    }
    /**
     * Serializes the rendering pipeline (Used when exporting)
     * @returns the serialized object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "TAARenderingPipeline";
        return serializationObject;
    }
    /**
     * Parse the serialized pipeline
     * @param source Source pipeline.
     * @param scene The scene to load the pipeline to.
     * @param rootUrl The URL of the serialized pipeline.
     * @returns An instantiated pipeline from the serialized object.
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new TAARenderingPipeline(source._name, scene, source._ratio), source, scene, rootUrl);
    }
}
__decorate([
    serialize("samples")
], TAARenderingPipeline.prototype, "samples", null);
__decorate([
    serialize("msaaSamples")
], TAARenderingPipeline.prototype, "_msaaSamples", void 0);
__decorate([
    serialize()
], TAARenderingPipeline.prototype, "factor", null);
__decorate([
    serialize()
], TAARenderingPipeline.prototype, "disableOnCameraMove", null);
__decorate([
    serialize("isEnabled")
], TAARenderingPipeline.prototype, "_isEnabled", void 0);
RegisterClass("BABYLON.TAARenderingPipeline", TAARenderingPipeline);
//# sourceMappingURL=taaRenderingPipeline.js.map