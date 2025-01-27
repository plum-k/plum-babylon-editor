import { Vector2 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Material } from "../Materials/material.js";
import { ThinPassPostProcess } from "../PostProcesses/thinPassPostProcess.js";
import { ThinEffectLayer, ThinGlowBlurPostProcess } from "./thinEffectLayer.js";

import { Color4 } from "../Maths/math.color.js";
import { ThinBlurPostProcess } from "../PostProcesses/thinBlurPostProcess.js";
/**
 * @internal
 */
export class ThinHighlightLayer extends ThinEffectLayer {
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
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     */
    constructor(name, scene, options, dontCheckIfReady = false) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false);
        /**
         * Specifies whether or not the inner glow is ACTIVE in the layer.
         */
        this.innerGlow = true;
        /**
         * Specifies whether or not the outer glow is ACTIVE in the layer.
         */
        this.outerGlow = true;
        this._instanceGlowingMeshStencilReference = ThinHighlightLayer.GlowingMeshStencilReference++;
        /** @internal */
        this._meshes = {};
        /** @internal */
        this._excludedMeshes = {};
        /** @internal */
        this._mainObjectRendererRenderPassId = -1;
        this.neutralColor = ThinHighlightLayer.NeutralColor;
        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            blurTextureSizeRatio: 0.5,
            mainTextureFixedSize: 0,
            blurHorizontalSize: 1.0,
            blurVerticalSize: 1.0,
            alphaBlendingMode: 2,
            camera: null,
            renderingGroupId: -1,
            forceGLSL: false,
            mainTextureType: 0,
            isStroke: false,
            ...options,
        };
        // Initialize the layer
        this._init(this._options);
        // Do not render as long as no meshes have been added
        this._shouldRender = false;
        if (dontCheckIfReady) {
            // When dontCheckIfReady is true, we are in the new ThinXXX layer mode, so we must call _createTextureAndPostProcesses ourselves (it is called by EffectLayer otherwise)
            this._createTextureAndPostProcesses();
        }
    }
    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    getClassName() {
        return "HighlightLayer";
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
    getEffectName() {
        return ThinHighlightLayer.EffectName;
    }
    _numInternalDraws() {
        return 2; // we need two rendering, one for the inner glow and the other for the outer glow
    }
    _createMergeEffect() {
        return this._engine.createEffect("glowMapMerge", [VertexBuffer.PositionKind], ["offset"], ["textureSampler"], this._options.isStroke ? "#define STROKE \n" : undefined, undefined, undefined, undefined, undefined, this._shaderLanguage, this._shadersLoaded
            ? undefined
            : async () => {
                await this._importShadersAsync();
                this._shadersLoaded = true;
            });
    }
    _createTextureAndPostProcesses() {
        if (this._options.alphaBlendingMode === 2) {
            this._downSamplePostprocess = new ThinPassPostProcess("HighlightLayerPPP", this._scene.getEngine());
            this._horizontalBlurPostprocess = new ThinGlowBlurPostProcess("HighlightLayerHBP", this._scene.getEngine(), new Vector2(1.0, 0), this._options.blurHorizontalSize);
            this._verticalBlurPostprocess = new ThinGlowBlurPostProcess("HighlightLayerVBP", this._scene.getEngine(), new Vector2(0, 1.0), this._options.blurVerticalSize);
            this._postProcesses = [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }
        else {
            this._horizontalBlurPostprocess = new ThinBlurPostProcess("HighlightLayerHBP", this._scene.getEngine(), new Vector2(1.0, 0), this._options.blurHorizontalSize / 2);
            this._verticalBlurPostprocess = new ThinBlurPostProcess("HighlightLayerVBP", this._scene.getEngine(), new Vector2(0, 1.0), this._options.blurVerticalSize / 2);
            this._postProcesses = [this._horizontalBlurPostprocess, this._verticalBlurPostprocess];
        }
    }
    needStencil() {
        return true;
    }
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
        return super._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }
    _canRenderMesh(_mesh, _material) {
        // all meshes can be rendered in the highlight layer, even transparent ones
        return true;
    }
    _internalCompose(effect, renderIndex) {
        // Texture
        this.bindTexturesForCompose(effect);
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
    _setEmissiveTextureAndColor(mesh, _subMesh, material) {
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
    shouldRender() {
        return this._meshes && super.shouldRender() ? true : false;
    }
    _shouldRenderMesh(mesh) {
        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
            return false;
        }
        return super.hasMesh(mesh);
    }
    _addCustomEffectDefines(defines) {
        defines.push("#define HIGHLIGHT");
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
                if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                    return;
                }
                obj.stencilState = mesh.getEngine().getStencilBuffer();
                mesh.getEngine().setStencilBuffer(false);
            });
            obj.afterRender = mesh.onAfterRenderObservable.add((mesh) => {
                if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                    return;
                }
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
    hasMesh(mesh) {
        if (!this._meshes || !super.hasMesh(mesh)) {
            return false;
        }
        return !!this._meshes[mesh.uniqueId];
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
                    if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                        return;
                    }
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
                    if (this._mainObjectRendererRenderPassId !== -1 && this._mainObjectRendererRenderPassId !== this._engine.currentRenderPassId) {
                        return;
                    }
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
    _defaultStencilReference(mesh) {
        mesh.getScene().getEngine().setStencilFunctionReference(ThinHighlightLayer.NormalMeshStencilReference);
    }
    _disposeMesh(mesh) {
        this.removeMesh(mesh);
        this.removeExcludedMesh(mesh);
    }
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
}
/**
 * Effect Name of the highlight layer.
 */
ThinHighlightLayer.EffectName = "HighlightLayer";
/**
 * The neutral color used during the preparation of the glow effect.
 * This is black by default as the blend operation is a blend operation.
 */
ThinHighlightLayer.NeutralColor = new Color4(0, 0, 0, 0);
/**
 * Stencil value used for glowing meshes.
 */
ThinHighlightLayer.GlowingMeshStencilReference = 0x02;
/**
 * Stencil value used for the other meshes in the scene.
 */
ThinHighlightLayer.NormalMeshStencilReference = 0x01;
//# sourceMappingURL=thinHighlightLayer.js.map