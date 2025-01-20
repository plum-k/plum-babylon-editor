import { __decorate } from "../tslib.es6.js";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { serialize } from "../Misc/decorators.js";
import { Observable } from "../Misc/observable.js";
import { Scene } from "../scene.js";
import { Vector2 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Material } from "../Materials/material.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { PostProcess } from "../PostProcesses/postProcess.js";
import { PassPostProcess } from "../PostProcesses/passPostProcess.js";
import { BlurPostProcess } from "../PostProcesses/blurPostProcess.js";
import { EffectLayer } from "./effectLayer.js";

import { Logger } from "../Misc/logger.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { Color4, Color3 } from "../Maths/math.color.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { GetExponentOfTwo } from "../Misc/tools.functions.js";
Scene.prototype.getHighlightLayerByName = function (name) {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === HighlightLayer.EffectName) {
            return this.effectLayers[index];
        }
    }
    return null;
};
/**
 * Special Glow Blur post process only blurring the alpha channel
 * It enforces keeping the most luminous color in the color channel.
 */
class GlowBlurPostProcess extends PostProcess {
    constructor(name, direction, kernel, options, camera, samplingMode = Texture.BILINEAR_SAMPLINGMODE, engine, reusable) {
        super(name, "glowBlurPostProcess", ["screenSize", "direction", "blurWidth"], null, options, camera, samplingMode, engine, reusable);
        this.direction = direction;
        this.kernel = kernel;
        this.onApplyObservable.add((effect) => {
            effect.setFloat2("screenSize", this.width, this.height);
            effect.setVector2("direction", this.direction);
            effect.setFloat("blurWidth", this.kernel);
        });
    }
    _gatherImports(useWebGPU, list) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/glowBlurPostProcess.fragment.js"));
        }
        else {
            list.push(import("../Shaders/glowBlurPostProcess.fragment.js"));
        }
        super._gatherImports(useWebGPU, list);
    }
}
/**
 * The highlight layer Helps adding a glow effect around a mesh.
 *
 * Once instantiated in a scene, simply use the addMesh or removeMesh method to add or remove
 * glowy meshes to your scene.
 *
 * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
 */
export class HighlightLayer extends EffectLayer {
    /**
     * Specifies the horizontal size of the blur.
     */
    set blurHorizontalSize(value) {
        this._horizontalBlurPostprocess.kernel = value;
        this._options.blurHorizontalSize = value;
    }
    /**
     * Specifies the vertical size of the blur.
     */
    set blurVerticalSize(value) {
        this._verticalBlurPostprocess.kernel = value;
        this._options.blurVerticalSize = value;
    }
    /**
     * Gets the horizontal size of the blur.
     */
    get blurHorizontalSize() {
        return this._horizontalBlurPostprocess.kernel;
    }
    /**
     * Gets the vertical size of the blur.
     */
    get blurVerticalSize() {
        return this._verticalBlurPostprocess.kernel;
    }
    /**
     * Instantiates a new highlight Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
     */
    constructor(name, scene, options) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false);
        /**
         * Specifies whether or not the inner glow is ACTIVE in the layer.
         */
        this.innerGlow = true;
        /**
         * Specifies whether or not the outer glow is ACTIVE in the layer.
         */
        this.outerGlow = true;
        /**
         * An event triggered when the highlight layer is being blurred.
         */
        this.onBeforeBlurObservable = new Observable();
        /**
         * An event triggered when the highlight layer has been blurred.
         */
        this.onAfterBlurObservable = new Observable();
        this._instanceGlowingMeshStencilReference = HighlightLayer.GlowingMeshStencilReference++;
        this._meshes = {};
        this._excludedMeshes = {};
        this.neutralColor = HighlightLayer.NeutralColor;
        // Warn on stencil
        if (!this._engine.isStencilEnable) {
            Logger.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new Engine(canvas, antialias, { stencil: true }");
        }
        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            blurTextureSizeRatio: 0.5,
            blurHorizontalSize: 1.0,
            blurVerticalSize: 1.0,
            alphaBlendingMode: 2,
            camera: null,
            renderingGroupId: -1,
            mainTextureType: 0,
            forceGLSL: false,
            ...options,
        };
        // Initialize the layer
        this._init({
            alphaBlendingMode: this._options.alphaBlendingMode,
            camera: this._options.camera,
            mainTextureFixedSize: this._options.mainTextureFixedSize,
            mainTextureRatio: this._options.mainTextureRatio,
            renderingGroupId: this._options.renderingGroupId,
            mainTextureType: this._options.mainTextureType,
        });
        // Do not render as long as no meshes have been added
        this._shouldRender = false;
    }
    async _importShadersAsync() {
        if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            await Promise.all([
                import("../ShadersWGSL/glowMapMerge.fragment.js"),
                import("../ShadersWGSL/glowMapMerge.vertex.js"),
                import("../ShadersWGSL/glowBlurPostProcess.fragment.js"),
            ]);
        }
        else {
            await Promise.all([import("../Shaders/glowMapMerge.fragment.js"), import("../Shaders/glowMapMerge.vertex.js"), import("../Shaders/glowBlurPostProcess.fragment.js")]);
        }
        await super._importShadersAsync();
    }
    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    getEffectName() {
        return HighlightLayer.EffectName;
    }
    _numInternalDraws() {
        return 2; // we need two rendering, one for the inner glow and the other for the outer glow
    }
    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect created
     */
    _createMergeEffect() {
        // Effect
        return this._engine.createEffect("glowMapMerge", [VertexBuffer.PositionKind], ["offset"], ["textureSampler"], this._options.isStroke ? "#define STROKE \n" : undefined, undefined, undefined, undefined, undefined, this._shaderLanguage, this._shadersLoaded
            ? undefined
            : async () => {
                await this._importShadersAsync();
                this._shadersLoaded = true;
            });
    }
    /**
     * Creates the render target textures and post processes used in the highlight layer.
     */
    _createTextureAndPostProcesses() {
        let blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
        let blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
        blurTextureWidth = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
        blurTextureHeight = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;
        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = 2;
        }
        else {
            textureType = 0;
        }
        this._blurTexture = new RenderTargetTexture("HighlightLayerBlurRTT", {
            width: blurTextureWidth,
            height: blurTextureHeight,
        }, this._scene, false, true, textureType);
        this._blurTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture.anisotropicFilteringLevel = 16;
        this._blurTexture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
        this._blurTexture.renderParticles = false;
        this._blurTexture.ignoreCameraViewport = true;
        this._textures = [this._blurTexture];
        if (this._options.alphaBlendingMode === 2) {
            this._downSamplePostprocess = new PassPostProcess("HighlightLayerPPP", this._options.blurTextureSizeRatio, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._downSamplePostprocess.externalTextureSamplerBinding = true;
            this._downSamplePostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });
            this._horizontalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerHBP", new Vector2(1.0, 0), this._options.blurHorizontalSize, 1, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });
            this._verticalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerVBP", new Vector2(0, 1.0), this._options.blurVerticalSize, 1, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._verticalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
            });
            this._postProcesses = [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }
        else {
            this._horizontalBlurPostprocess = new BlurPostProcess("HighlightLayerHBP", new Vector2(1.0, 0), this._options.blurHorizontalSize / 2, {
                width: blurTextureWidth,
                height: blurTextureHeight,
            }, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, textureType);
            const horizontalBlurPostprocess = this._horizontalBlurPostprocess;
            horizontalBlurPostprocess.width = blurTextureWidth;
            horizontalBlurPostprocess.height = blurTextureHeight;
            horizontalBlurPostprocess.externalTextureSamplerBinding = true;
            horizontalBlurPostprocess.onApplyObservable.add((effect) => {
                effect.setTexture("textureSampler", this._mainTexture);
            });
            this._verticalBlurPostprocess = new BlurPostProcess("HighlightLayerVBP", new Vector2(0, 1.0), this._options.blurVerticalSize / 2, {
                width: blurTextureWidth,
                height: blurTextureHeight,
            }, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, textureType);
            this._postProcesses = [this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }
        this._mainTexture.onAfterUnbindObservable.add(() => {
            this.onBeforeBlurObservable.notifyObservers(this);
            const internalTexture = this._blurTexture.renderTarget;
            if (internalTexture) {
                this._scene.postProcessManager.directRender(this._postProcesses, internalTexture, true);
                this._engine.unBindFramebuffer(internalTexture, true);
            }
            this.onAfterBlurObservable.notifyObservers(this);
        });
        // Prevent autoClear.
        this._postProcesses.map((pp) => {
            pp.autoClear = false;
        });
    }
    /**
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    needStencil() {
        return true;
    }
    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    isReady(subMesh, useInstances) {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();
        if (!material || !mesh || !this._meshes) {
            return false;
        }
        let emissiveTexture = null;
        const highlightLayerMesh = this._meshes[mesh.uniqueId];
        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            emissiveTexture = material.emissiveTexture;
        }
        return super._isReady(subMesh, useInstances, emissiveTexture);
    }
    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     * @param renderIndex
     */
    _internalRender(effect, renderIndex) {
        // Texture
        effect.setTexture("textureSampler", this._blurTexture);
        // Cache
        const engine = this._engine;
        engine.cacheStencilState();
        // Stencil operations
        engine.setStencilOperationPass(7681);
        engine.setStencilOperationFail(7680);
        engine.setStencilOperationDepthFail(7680);
        // Draw order
        engine.setStencilMask(0x00);
        engine.setStencilBuffer(true);
        engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
        // 2 passes inner outer
        if (this.outerGlow && renderIndex === 0) {
            // the outer glow is rendered the first time _internalRender is called, so when renderIndex == 0 (and only if outerGlow is enabled)
            effect.setFloat("offset", 0);
            engine.setStencilFunction(517);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        if (this.innerGlow && renderIndex === 1) {
            // the inner glow is rendered the second time _internalRender is called, so when renderIndex == 1 (and only if innerGlow is enabled)
            effect.setFloat("offset", 1);
            engine.setStencilFunction(514);
            engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        }
        // Restore Cache
        engine.restoreStencilState();
    }
    /**
     * @returns true if the layer contains information to display, otherwise false.
     */
    shouldRender() {
        if (super.shouldRender()) {
            return this._meshes ? true : false;
        }
        return false;
    }
    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    _shouldRenderMesh(mesh) {
        // Excluded Mesh
        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
            return false;
        }
        if (!super.hasMesh(mesh)) {
            return false;
        }
        return true;
    }
    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    _canRenderMesh(mesh, material) {
        // all meshes can be rendered in the highlight layer, even transparent ones
        return true;
    }
    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    _addCustomEffectDefines(defines) {
        defines.push("#define HIGHLIGHT");
    }
    /**
     * Sets the required values for both the emissive texture and and the main color.
     * @param mesh
     * @param subMesh
     * @param material
     */
    _setEmissiveTextureAndColor(mesh, subMesh, material) {
        const highlightLayerMesh = this._meshes[mesh.uniqueId];
        if (highlightLayerMesh) {
            this._emissiveTextureAndColor.color.set(highlightLayerMesh.color.r, highlightLayerMesh.color.g, highlightLayerMesh.color.b, 1.0);
        }
        else {
            this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
        }
        if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
            this._emissiveTextureAndColor.texture = material.emissiveTexture;
            this._emissiveTextureAndColor.color.set(1.0, 1.0, 1.0, 1.0);
        }
        else {
            this._emissiveTextureAndColor.texture = null;
        }
    }
    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
     * @param mesh The mesh to exclude from the highlight layer
     */
    addExcludedMesh(mesh) {
        if (!this._excludedMeshes) {
            return;
        }
        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (!meshExcluded) {
            const obj = {
                mesh: mesh,
                beforeBind: null,
                afterRender: null,
                stencilState: false,
            };
            obj.beforeBind = mesh.onBeforeBindObservable.add((mesh) => {
                obj.stencilState = mesh.getEngine().getStencilBuffer();
                mesh.getEngine().setStencilBuffer(false);
            });
            obj.afterRender = mesh.onAfterRenderObservable.add((mesh) => {
                mesh.getEngine().setStencilBuffer(obj.stencilState);
            });
            this._excludedMeshes[mesh.uniqueId] = obj;
        }
    }
    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
     * @param mesh The mesh to highlight
     */
    removeExcludedMesh(mesh) {
        if (!this._excludedMeshes) {
            return;
        }
        const meshExcluded = this._excludedMeshes[mesh.uniqueId];
        if (meshExcluded) {
            if (meshExcluded.beforeBind) {
                mesh.onBeforeBindObservable.remove(meshExcluded.beforeBind);
            }
            if (meshExcluded.afterRender) {
                mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
            }
        }
        this._excludedMeshes[mesh.uniqueId] = null;
    }
    /**
     * Determine if a given mesh will be highlighted by the current HighlightLayer
     * @param mesh mesh to test
     * @returns true if the mesh will be highlighted by the current HighlightLayer
     */
    hasMesh(mesh) {
        if (!this._meshes) {
            return false;
        }
        if (!super.hasMesh(mesh)) {
            return false;
        }
        return this._meshes[mesh.uniqueId] !== undefined && this._meshes[mesh.uniqueId] !== null;
    }
    /**
     * Add a mesh in the highlight layer in order to make it glow with the chosen color.
     * @param mesh The mesh to highlight
     * @param color The color of the highlight
     * @param glowEmissiveOnly Extract the glow from the emissive texture
     */
    addMesh(mesh, color, glowEmissiveOnly = false) {
        if (!this._meshes) {
            return;
        }
        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            meshHighlight.color = color;
        }
        else {
            this._meshes[mesh.uniqueId] = {
                mesh: mesh,
                color: color,
                // Lambda required for capture due to Observable this context
                observerHighlight: mesh.onBeforeBindObservable.add((mesh) => {
                    if (this.isEnabled) {
                        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
                            this._defaultStencilReference(mesh);
                        }
                        else {
                            mesh.getScene().getEngine().setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
                        }
                    }
                }),
                observerDefault: mesh.onAfterRenderObservable.add((mesh) => {
                    if (this.isEnabled) {
                        this._defaultStencilReference(mesh);
                    }
                }),
                glowEmissiveOnly: glowEmissiveOnly,
            };
            mesh.onDisposeObservable.add(() => {
                this._disposeMesh(mesh);
            });
        }
        this._shouldRender = true;
    }
    /**
     * Remove a mesh from the highlight layer in order to make it stop glowing.
     * @param mesh The mesh to highlight
     */
    removeMesh(mesh) {
        if (!this._meshes) {
            return;
        }
        const meshHighlight = this._meshes[mesh.uniqueId];
        if (meshHighlight) {
            if (meshHighlight.observerHighlight) {
                mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
            }
            if (meshHighlight.observerDefault) {
                mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
            }
            delete this._meshes[mesh.uniqueId];
        }
        this._shouldRender = false;
        for (const meshHighlightToCheck in this._meshes) {
            if (this._meshes[meshHighlightToCheck]) {
                this._shouldRender = true;
                break;
            }
        }
    }
    /**
     * Remove all the meshes currently referenced in the highlight layer
     */
    removeAllMeshes() {
        if (!this._meshes) {
            return;
        }
        for (const uniqueId in this._meshes) {
            if (Object.prototype.hasOwnProperty.call(this._meshes, uniqueId)) {
                const mesh = this._meshes[uniqueId];
                if (mesh) {
                    this.removeMesh(mesh.mesh);
                }
            }
        }
    }
    /**
     * Force the stencil to the normal expected value for none glowing parts
     * @param mesh
     */
    _defaultStencilReference(mesh) {
        mesh.getScene().getEngine().setStencilFunctionReference(HighlightLayer.NormalMeshStencilReference);
    }
    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    _disposeMesh(mesh) {
        this.removeMesh(mesh);
        this.removeExcludedMesh(mesh);
    }
    /**
     * Dispose the highlight layer and free resources.
     */
    dispose() {
        if (this._meshes) {
            // Clean mesh references
            for (const id in this._meshes) {
                const meshHighlight = this._meshes[id];
                if (meshHighlight && meshHighlight.mesh) {
                    if (meshHighlight.observerHighlight) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.observerHighlight);
                    }
                    if (meshHighlight.observerDefault) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                    }
                }
            }
            this._meshes = null;
        }
        if (this._excludedMeshes) {
            for (const id in this._excludedMeshes) {
                const meshHighlight = this._excludedMeshes[id];
                if (meshHighlight) {
                    if (meshHighlight.beforeBind) {
                        meshHighlight.mesh.onBeforeBindObservable.remove(meshHighlight.beforeBind);
                    }
                    if (meshHighlight.afterRender) {
                        meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                    }
                }
            }
            this._excludedMeshes = null;
        }
        super.dispose();
    }
    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    getClassName() {
        return "HighlightLayer";
    }
    /**
     * Serializes this Highlight layer
     * @returns a serialized Highlight layer object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.HighlightLayer";
        // Highlighted meshes
        serializationObject.meshes = [];
        if (this._meshes) {
            for (const m in this._meshes) {
                const mesh = this._meshes[m];
                if (mesh) {
                    serializationObject.meshes.push({
                        glowEmissiveOnly: mesh.glowEmissiveOnly,
                        color: mesh.color.asArray(),
                        meshId: mesh.mesh.id,
                    });
                }
            }
        }
        // Excluded meshes
        serializationObject.excludedMeshes = [];
        if (this._excludedMeshes) {
            for (const e in this._excludedMeshes) {
                const excludedMesh = this._excludedMeshes[e];
                if (excludedMesh) {
                    serializationObject.excludedMeshes.push(excludedMesh.mesh.id);
                }
            }
        }
        return serializationObject;
    }
    /**
     * Creates a Highlight layer from parsed Highlight layer data
     * @param parsedHightlightLayer defines the Highlight layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the Highlight layer information
     * @returns a parsed Highlight layer
     */
    static Parse(parsedHightlightLayer, scene, rootUrl) {
        const hl = SerializationHelper.Parse(() => new HighlightLayer(parsedHightlightLayer.name, scene, parsedHightlightLayer.options), parsedHightlightLayer, scene, rootUrl);
        let index;
        // Excluded meshes
        for (index = 0; index < parsedHightlightLayer.excludedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedHightlightLayer.excludedMeshes[index]);
            if (mesh) {
                hl.addExcludedMesh(mesh);
            }
        }
        // Included meshes
        for (index = 0; index < parsedHightlightLayer.meshes.length; index++) {
            const highlightedMesh = parsedHightlightLayer.meshes[index];
            const mesh = scene.getMeshById(highlightedMesh.meshId);
            if (mesh) {
                hl.addMesh(mesh, Color3.FromArray(highlightedMesh.color), highlightedMesh.glowEmissiveOnly);
            }
        }
        return hl;
    }
}
/**
 * Effect Name of the highlight layer.
 */
HighlightLayer.EffectName = "HighlightLayer";
/**
 * The neutral color used during the preparation of the glow effect.
 * This is black by default as the blend operation is a blend operation.
 */
HighlightLayer.NeutralColor = new Color4(0, 0, 0, 0);
/**
 * Stencil value used for glowing meshes.
 */
HighlightLayer.GlowingMeshStencilReference = 0x02;
/**
 * Stencil value used for the other meshes in the scene.
 */
HighlightLayer.NormalMeshStencilReference = 0x01;
__decorate([
    serialize()
], HighlightLayer.prototype, "innerGlow", void 0);
__decorate([
    serialize()
], HighlightLayer.prototype, "outerGlow", void 0);
__decorate([
    serialize()
], HighlightLayer.prototype, "blurHorizontalSize", null);
__decorate([
    serialize()
], HighlightLayer.prototype, "blurVerticalSize", null);
__decorate([
    serialize("options")
], HighlightLayer.prototype, "_options", void 0);
RegisterClass("BABYLON.HighlightLayer", HighlightLayer);
//# sourceMappingURL=highlightLayer.js.map