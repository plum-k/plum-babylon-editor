
import { Vector4 } from "../../Maths/math.vector.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { GeometryBufferRenderer } from "../../Rendering/geometryBufferRenderer.js";
import { ProceduralTexture } from "../../Materials/Textures/Procedurals/proceduralTexture.js";
import { Observable } from "../../Misc/observable.js";
/**
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsAccumulationPass {
    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    getOutputTexture() {
        return this._outputTexture;
    }
    /**
     * Gets the debug pass post process
     * @returns The post process
     */
    getDebugPassPP() {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }
    /**
     * Gets the name of the debug pass
     * @returns The name of the debug pass
     */
    get debugPassName() {
        return this._debugPassName;
    }
    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    get remanence() {
        return this._remanence;
    }
    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    set remanence(value) {
        this._remanence = value;
    }
    /**
     * Reset the accumulation.
     */
    get reset() {
        return this._reset;
    }
    /**
     * Reset the accumulation.
     */
    set reset(value) {
        this._reset = value;
    }
    /**
     * Tell the pass that the camera is moving. This will cause the accumulation
     * rate to change.
     */
    set isMoving(value) {
        this._isMoving = value;
    }
    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    setDebugDisplayParams(x, y, widthScale, heightScale) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }
    /**
     * Creates the debug post process effect for this pass
     */
    _createDebugPass() {
        if (!this._debugPassPP) {
            const isWebGPU = this._engine.isWebGPU;
            const debugOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: 5,
                textureType: 0,
                samplingMode: 1,
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: false,
                shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
                extraInitializations: (useWebGPU, list) => {
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblShadowDebug.fragment.js"));
                    }
                    else {
                        list.push(import("../../Shaders/iblShadowDebug.fragment.js"));
                    }
                },
            };
            this._debugPassPP = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPassPP.autoClear = false;
            this._debugPassPP.onApplyObservable.add((effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTexture("debugSampler", this._outputTexture);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }
    /**
     * Instantiates the accumulation pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The accumulation pass
     */
    constructor(scene, iblShadowsRenderPipeline) {
        this._accumulationParams = new Vector4(0.0, 0.0, 0.0, 0.0);
        /** Enable the debug view for this pass */
        this.debugEnabled = false;
        /**
         * Is the effect enabled
         */
        this.enabled = true;
        /**
         * Observable that triggers when the accumulation texture is ready
         */
        this.onReadyObservable = new Observable();
        this._debugPassName = "Shadow Accumulation Debug Pass";
        this._remanence = 0.9;
        this._reset = true;
        this._isMoving = false;
        this._debugSizeParams = new Vector4(0.0, 0.0, 0.0, 0.0);
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }
    _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
        const outputTextureOptions = {
            type: 2,
            format: 5,
            samplingMode: 1,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowAccumulation.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/iblShadowAccumulation.fragment.js")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture("shadowAccumulationPass", {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
        }, "iblShadowAccumulation", this._scene, outputTextureOptions);
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;
        this._outputTexture.onGeneratedObservable.addOnce(() => {
            this.onReadyObservable.notifyObservers();
        });
        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._setOutputTextureBindings();
        let counter = 0;
        this._scene.onBeforeRenderObservable.add(() => {
            counter = 0;
        });
        this._scene.onAfterRenderTargetsRenderObservable.add(() => {
            if (++counter == 2) {
                if (this.enabled && this._outputTexture.isReady()) {
                    this._setOutputTextureBindings();
                    this._outputTexture.render();
                }
            }
        });
        // Create the accumulation texture for the previous frame.
        // We'll copy the output of the accumulation pass to this texture at the start of every frame.
        const accumulationOptions = {
            type: 2,
            format: 5,
            samplingMode: 1,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/pass.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/pass.fragment.js")]);
                }
            },
        };
        this._oldAccumulationCopy = new ProceduralTexture("oldAccumulationRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, "pass", this._scene, accumulationOptions, false);
        this._oldAccumulationCopy.autoClear = false;
        this._oldAccumulationCopy.refreshRate = 1;
        this._oldAccumulationCopy.onBeforeGenerationObservable.add(this._setAccumulationCopyBindings.bind(this));
        this._setAccumulationCopyBindings();
        // Create the local position texture for the previous frame.
        // We'll copy the previous local position texture to this texture at the start of every frame.
        const localPositionOptions = {
            type: 2,
            format: 5,
            samplingMode: 1,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/pass.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../Shaders/pass.fragment.js")]);
                }
            },
        };
        this._oldPositionCopy = new ProceduralTexture("oldLocalPositionRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, "pass", this._scene, localPositionOptions, false);
        this._updatePositionCopy();
        this._oldPositionCopy.autoClear = false;
        this._oldPositionCopy.refreshRate = 1;
        this._oldPositionCopy.onBeforeGenerationObservable.add(this._updatePositionCopy.bind(this));
    }
    _setOutputTextureBindings() {
        const remanence = this._isMoving ? this.remanence : 0.99;
        this._accumulationParams.set(remanence, this.reset ? 1.0 : 0.0, this._renderPipeline.voxelGridSize, 0.0);
        this._outputTexture.setTexture("spatialBlurSampler", this._renderPipeline._getSpatialBlurTexture());
        this._outputTexture.setVector4("accumulationParameters", this._accumulationParams);
        this._outputTexture.setTexture("oldAccumulationSampler", this._oldAccumulationCopy ? this._oldAccumulationCopy : this._renderPipeline._dummyTexture2d);
        this._outputTexture.setTexture("prevPositionSampler", this._oldPositionCopy ? this._oldPositionCopy : this._renderPipeline._dummyTexture2d);
        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            return;
        }
        const velocityIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE);
        this._outputTexture.setTexture("motionSampler", geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
        const wPositionIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
        this._outputTexture.setTexture("positionSampler", geometryBufferRenderer.getGBuffer().textures[wPositionIndex]);
        this.reset = false;
        this._isMoving = false;
    }
    _updatePositionCopy() {
        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        const index = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
        this._oldPositionCopy.setTexture("textureSampler", geometryBufferRenderer.getGBuffer().textures[index]);
    }
    _setAccumulationCopyBindings() {
        this._oldAccumulationCopy.setTexture("textureSampler", this._outputTexture);
    }
    /**
     * Called by render pipeline when canvas resized.
     * @param scaleFactor The factor by which to scale the canvas size.
     */
    resize(scaleFactor = 1.0) {
        const newSize = {
            width: Math.max(1.0, Math.floor(this._engine.getRenderWidth() * scaleFactor)),
            height: Math.max(1.0, Math.floor(this._engine.getRenderHeight() * scaleFactor)),
        };
        this._outputTexture.resize(newSize, false);
        this._oldAccumulationCopy.resize(newSize, false);
        this._oldPositionCopy.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, false);
        this.reset = true;
    }
    _disposeTextures() {
        this._oldAccumulationCopy.dispose();
        this._oldPositionCopy.dispose();
        this._outputTexture.dispose();
    }
    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    isReady() {
        return (this._oldAccumulationCopy &&
            this._oldAccumulationCopy.isReady() &&
            this._oldPositionCopy &&
            this._oldPositionCopy.isReady() &&
            this._outputTexture.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady()));
    }
    /**
     * Disposes the associated resources
     */
    dispose() {
        this._disposeTextures();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
        this.onReadyObservable.clear();
    }
}
//# sourceMappingURL=iblShadowsAccumulationPass.js.map