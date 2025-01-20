/**
 * Implementation based on https://medium.com/@shrekshao_71662/dual-depth-peeling-implementation-in-webgl-11baa061ba4b
 */

import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget.js";
import { Color4 } from "../Maths/math.color.js";
import { SmartArray } from "../Misc/smartArray.js";
import { ThinTexture } from "../Materials/Textures/thinTexture.js";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { Logger } from "../Misc/logger.js";
import { Material } from "../Materials/material.js";
import "../Engines/Extensions/engine.multiRender.js";
class DepthPeelingEffectConfiguration {
    constructor() {
        /**
         * Is this effect enabled
         */
        this.enabled = true;
        /**
         * Name of the configuration
         */
        this.name = "depthPeeling";
        /**
         * Textures that should be present in the MRT for this effect to work
         */
        this.texturesRequired = [4];
    }
}
/**
 * The depth peeling renderer that performs
 * Order independant transparency (OIT).
 * This should not be instanciated directly, as it is part of a scene component
 */
export class DepthPeelingRenderer {
    /**
     * Number of depth peeling passes. As we are using dual depth peeling, each pass two levels of transparency are processed.
     */
    get passCount() {
        return this._passCount;
    }
    set passCount(count) {
        if (this._passCount === count) {
            return;
        }
        this._passCount = count;
        this._createRenderPassIds();
    }
    /**
     * Instructs the renderer to use render passes. It is an optimization that makes the rendering faster for some engines (like WebGPU) but that consumes more memory, so it is disabled by default.
     */
    get useRenderPasses() {
        return this._useRenderPasses;
    }
    set useRenderPasses(usePasses) {
        if (this._useRenderPasses === usePasses) {
            return;
        }
        this._useRenderPasses = usePasses;
        this._createRenderPassIds();
    }
    /**
     * Add a mesh in the exclusion list to prevent it to be handled by the depth peeling renderer
     * @param mesh The mesh to exclude from the depth peeling renderer
     */
    addExcludedMesh(mesh) {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }
    /**
     * Remove a mesh from the exclusion list of the depth peeling renderer
     * @param mesh The mesh to remove
     */
    removeExcludedMesh(mesh) {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }
    /**
     * Gets the shader language used in this renderer
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instanciates the depth peeling renderer
     * @param scene Scene to attach to
     * @param passCount Number of depth layers to peel
     * @returns The depth peeling renderer
     */
    constructor(scene, passCount = 5) {
        this._thinTextures = [];
        this._currentPingPongState = 0;
        this._layoutCacheFormat = [[true], [true, true], [true, true, true]];
        this._layoutCache = [];
        this._candidateSubMeshes = new SmartArray(10);
        this._excludedSubMeshes = new SmartArray(10);
        this._excludedMeshes = [];
        this._colorCache = [
            new Color4(DepthPeelingRenderer._DEPTH_CLEAR_VALUE, DepthPeelingRenderer._DEPTH_CLEAR_VALUE, 0, 0),
            new Color4(-DepthPeelingRenderer._MIN_DEPTH, DepthPeelingRenderer._MAX_DEPTH, 0, 0),
            new Color4(0, 0, 0, 0),
        ];
        /** Shader language used by the renderer */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._scene = scene;
        this._engine = scene.getEngine();
        this._passCount = passCount;
        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("Depth peeling for order independant transparency could not enable PrePass, aborting.");
            return;
        }
        for (let i = 0; i < this._layoutCacheFormat.length; ++i) {
            this._layoutCache[i] = this._engine.buildTextureLayout(this._layoutCacheFormat[i]);
        }
        this._renderPassIds = [];
        this.useRenderPasses = false;
        if (this._engine.isWebGPU) {
            this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        this._prePassEffectConfiguration = new DepthPeelingEffectConfiguration();
        this._createTextures();
        this._createEffects();
    }
    _createRenderPassIds() {
        this._releaseRenderPassIds();
        if (this._useRenderPasses) {
            for (let i = 0; i < this._passCount + 1; ++i) {
                if (!this._renderPassIds[i]) {
                    this._renderPassIds[i] = this._engine.createRenderPassId(`DepthPeelingRenderer - pass #${i}`);
                }
            }
        }
    }
    _releaseRenderPassIds() {
        for (let i = 0; i < this._renderPassIds.length; ++i) {
            this._engine.releaseRenderPassId(this._renderPassIds[i]);
        }
        this._renderPassIds = [];
    }
    _createTextures() {
        const size = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
        };
        // 2 for ping pong
        this._depthMrts = [
            new MultiRenderTarget("depthPeelingDepth0MRT", size, 3, this._scene, undefined, [
                "depthPeelingDepth0MRT_depth",
                "depthPeelingDepth0MRT_frontColor",
                "depthPeelingDepth0MRT_backColor",
            ]),
            new MultiRenderTarget("depthPeelingDepth1MRT", size, 3, this._scene, undefined, [
                "depthPeelingDepth1MRT_depth",
                "depthPeelingDepth1MRT_frontColor",
                "depthPeelingDepth1MRT_backColor",
            ]),
        ];
        this._colorMrts = [
            new MultiRenderTarget("depthPeelingColor0MRT", size, 2, this._scene, { generateDepthBuffer: false }, [
                "depthPeelingColor0MRT_frontColor",
                "depthPeelingColor0MRT_backColor",
            ]),
            new MultiRenderTarget("depthPeelingColor1MRT", size, 2, this._scene, { generateDepthBuffer: false }, [
                "depthPeelingColor1MRT_frontColor",
                "depthPeelingColor1MRT_backColor",
            ]),
        ];
        this._blendBackMrt = new MultiRenderTarget("depthPeelingBackMRT", size, 1, this._scene, { generateDepthBuffer: false }, ["depthPeelingBackMRT_blendBack"]);
        this._outputRT = new RenderTargetTexture("depthPeelingOutputRTT", size, this._scene, false);
        // 0 is a depth texture
        // 1 is a color texture
        const optionsArray = [
            {
                format: 7, // For MSAA we need RGBA
                samplingMode: 1,
                type: this._engine.getCaps().textureFloatLinearFiltering ? 1 : 2,
                label: "DepthPeelingRenderer-DepthTexture",
            },
            {
                format: 5,
                samplingMode: 1,
                type: 2, // For MSAA we need FLOAT
                label: "DepthPeelingRenderer-ColorTexture",
            },
        ];
        for (let i = 0; i < 2; i++) {
            const depthTexture = this._engine._createInternalTexture(size, optionsArray[0], false);
            const frontColorTexture = this._engine._createInternalTexture(size, optionsArray[1], false);
            const backColorTexture = this._engine._createInternalTexture(size, optionsArray[1], false);
            this._depthMrts[i].setInternalTexture(depthTexture, 0);
            this._depthMrts[i].setInternalTexture(frontColorTexture, 1);
            this._depthMrts[i].setInternalTexture(backColorTexture, 2);
            this._colorMrts[i].setInternalTexture(frontColorTexture, 0);
            this._colorMrts[i].setInternalTexture(backColorTexture, 1);
            this._thinTextures.push(new ThinTexture(depthTexture), new ThinTexture(frontColorTexture), new ThinTexture(backColorTexture));
        }
    }
    // TODO : explore again MSAA with depth peeling when
    // we are able to fetch individual samples in a multisampled renderbuffer
    // public set samples(value: number) {
    //     for (let i = 0; i < 2; i++) {
    //         this._depthMrts[i].samples = value;
    //         this._colorMrts[i].samples = value;
    //     }
    //     this._scene.prePassRenderer!.samples = value;
    // }
    _disposeTextures() {
        for (let i = 0; i < this._thinTextures.length; i++) {
            if (i === 6) {
                // Do not dispose the shared texture with the prepass
                continue;
            }
            this._thinTextures[i].dispose();
        }
        for (let i = 0; i < 2; i++) {
            this._depthMrts[i].dispose(true);
            this._colorMrts[i].dispose(true);
            this._blendBackMrt.dispose(true);
        }
        this._outputRT.dispose();
        this._thinTextures = [];
        this._colorMrts = [];
        this._depthMrts = [];
    }
    _updateTextures() {
        if (this._depthMrts[0].getSize().width !== this._engine.getRenderWidth() || this._depthMrts[0].getSize().height !== this._engine.getRenderHeight()) {
            this._disposeTextures();
            this._createTextures();
        }
        return this._updateTextureReferences();
    }
    _updateTextureReferences() {
        const prePassRenderer = this._scene.prePassRenderer;
        if (!prePassRenderer) {
            return false;
        }
        // Retrieve opaque color texture
        const textureIndex = prePassRenderer.getIndex(4);
        const prePassTexture = prePassRenderer.defaultRT.textures?.length ? prePassRenderer.defaultRT.textures[textureIndex].getInternalTexture() : null;
        if (!prePassTexture) {
            return false;
        }
        if (this._blendBackTexture !== prePassTexture) {
            this._blendBackTexture = prePassTexture;
            this._blendBackMrt.setInternalTexture(this._blendBackTexture, 0);
            if (this._thinTextures[6]) {
                this._thinTextures[6].dispose();
            }
            this._thinTextures[6] = new ThinTexture(this._blendBackTexture);
            prePassRenderer.defaultRT.renderTarget.shareDepth(this._depthMrts[0].renderTarget);
        }
        return true;
    }
    _createEffects() {
        this._blendBackEffectWrapper = new EffectWrapper({
            fragmentShader: "oitBackBlend",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uBackColor"],
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../ShadersWGSL/oitBackBlend.fragment.js");
                }
                else {
                    await import("../Shaders/oitBackBlend.fragment.js");
                }
            },
        });
        this._blendBackEffectWrapperPingPong = new EffectWrapper({
            fragmentShader: "oitBackBlend",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uBackColor"],
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../ShadersWGSL/oitBackBlend.fragment.js");
                }
                else {
                    await import("../Shaders/oitBackBlend.fragment.js");
                }
            },
        });
        this._finalEffectWrapper = new EffectWrapper({
            fragmentShader: "oitFinal",
            useShaderStore: true,
            engine: this._engine,
            samplerNames: ["uFrontColor", "uBackColor"],
            uniformNames: [],
            shaderLanguage: this._shaderLanguage,
            extraInitializationsAsync: async () => {
                if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../ShadersWGSL/oitFinal.fragment.js");
                }
                else {
                    await import("../Shaders/oitFinal.fragment.js");
                }
            },
        });
        this._effectRenderer = new EffectRenderer(this._engine);
    }
    /**
     * Links to the prepass renderer
     * @param prePassRenderer The scene PrePassRenderer
     */
    setPrePassRenderer(prePassRenderer) {
        prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
    }
    /**
     * Binds depth peeling textures on an effect
     * @param effect The effect to bind textures on
     */
    bind(effect) {
        effect.setTexture("oitDepthSampler", this._thinTextures[this._currentPingPongState * 3]);
        effect.setTexture("oitFrontColorSampler", this._thinTextures[this._currentPingPongState * 3 + 1]);
    }
    _renderSubMeshes(transparentSubMeshes) {
        let mapMaterialContext;
        if (this._useRenderPasses) {
            mapMaterialContext = {};
        }
        for (let j = 0; j < transparentSubMeshes.length; j++) {
            const material = transparentSubMeshes.data[j].getMaterial();
            let previousShaderHotSwapping = true;
            let previousBFC = false;
            const subMesh = transparentSubMeshes.data[j];
            let drawWrapper;
            let firstDraw = false;
            if (this._useRenderPasses) {
                drawWrapper = subMesh._getDrawWrapper();
                firstDraw = !drawWrapper;
            }
            if (material) {
                previousShaderHotSwapping = material.allowShaderHotSwapping;
                previousBFC = material.backFaceCulling;
                material.allowShaderHotSwapping = false;
                material.backFaceCulling = false;
            }
            subMesh.render(false);
            if (firstDraw) {
                // first time we draw this submesh: we replace the material context
                drawWrapper = subMesh._getDrawWrapper(); // we are sure it is now non empty as we just rendered the submesh
                if (drawWrapper.materialContext) {
                    let newMaterialContext = mapMaterialContext[drawWrapper.materialContext.uniqueId];
                    if (!newMaterialContext) {
                        newMaterialContext = mapMaterialContext[drawWrapper.materialContext.uniqueId] = this._engine.createMaterialContext();
                    }
                    subMesh._getDrawWrapper().materialContext = newMaterialContext;
                }
            }
            if (material) {
                material.allowShaderHotSwapping = previousShaderHotSwapping;
                material.backFaceCulling = previousBFC;
            }
        }
    }
    _finalCompose(writeId) {
        const output = this._scene.prePassRenderer?.setCustomOutput(this._outputRT);
        if (output) {
            this._engine.bindFramebuffer(this._outputRT.renderTarget);
        }
        else {
            this._engine.restoreDefaultFramebuffer();
        }
        this._engine.setAlphaMode(0);
        this._engine.applyStates();
        this._engine.enableEffect(this._finalEffectWrapper.drawWrapper);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._finalEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[6]);
        this._effectRenderer.render(this._finalEffectWrapper);
    }
    /**
     * Checks if the depth peeling renderer is ready to render transparent meshes
     * @returns true if the depth peeling renderer is ready to render the transparent meshes
     */
    isReady() {
        return (this._blendBackEffectWrapper.effect.isReady() &&
            this._blendBackEffectWrapperPingPong.effect.isReady() &&
            this._finalEffectWrapper.effect.isReady() &&
            this._updateTextures());
    }
    /**
     * Renders transparent submeshes with depth peeling
     * @param transparentSubMeshes List of transparent meshes to render
     * @returns The array of submeshes that could not be handled by this renderer
     */
    render(transparentSubMeshes) {
        this._candidateSubMeshes.length = 0;
        this._excludedSubMeshes.length = 0;
        if (!this.isReady()) {
            return this._excludedSubMeshes;
        }
        if (this._scene.activeCamera) {
            this._engine.setViewport(this._scene.activeCamera.viewport);
        }
        for (let i = 0; i < transparentSubMeshes.length; i++) {
            const subMesh = transparentSubMeshes.data[i];
            const material = subMesh.getMaterial();
            const fillMode = material && subMesh.getRenderingMesh()._getRenderingFillMode(material.fillMode);
            if (material &&
                (fillMode === Material.TriangleFanDrawMode || fillMode === Material.TriangleFillMode || fillMode === Material.TriangleStripDrawMode) &&
                this._excludedMeshes.indexOf(subMesh.getMesh().uniqueId) === -1) {
                this._candidateSubMeshes.push(subMesh);
            }
            else {
                this._excludedSubMeshes.push(subMesh);
            }
        }
        if (!this._candidateSubMeshes.length) {
            this._engine.bindFramebuffer(this._colorMrts[1].renderTarget);
            this._engine.bindAttachments(this._layoutCache[1]);
            this._engine.clear(this._colorCache[2], true, false, false);
            this._engine.unBindFramebuffer(this._colorMrts[1].renderTarget);
            this._finalCompose(1);
            return this._excludedSubMeshes;
        }
        const currentRenderPassId = this._engine.currentRenderPassId;
        this._scene.prePassRenderer._enabled = false;
        if (this._useRenderPasses) {
            this._engine.currentRenderPassId = this._renderPassIds[0];
        }
        // Clears
        this._engine.bindFramebuffer(this._depthMrts[0].renderTarget);
        this._engine.bindAttachments(this._layoutCache[0]);
        this._engine.clear(this._colorCache[0], true, false, false);
        this._engine.unBindFramebuffer(this._depthMrts[0].renderTarget);
        this._engine.bindFramebuffer(this._depthMrts[1].renderTarget);
        this._engine.bindAttachments(this._layoutCache[0]);
        this._engine.clear(this._colorCache[1], true, false, false);
        this._engine.unBindFramebuffer(this._depthMrts[1].renderTarget);
        this._engine.bindFramebuffer(this._colorMrts[0].renderTarget);
        this._engine.bindAttachments(this._layoutCache[1]);
        this._engine.clear(this._colorCache[2], true, false, false);
        this._engine.unBindFramebuffer(this._colorMrts[0].renderTarget);
        this._engine.bindFramebuffer(this._colorMrts[1].renderTarget);
        this._engine.bindAttachments(this._layoutCache[1]);
        this._engine.clear(this._colorCache[2], true, false, false);
        this._engine.unBindFramebuffer(this._colorMrts[1].renderTarget);
        // Draw depth for first pass
        this._engine.bindFramebuffer(this._depthMrts[0].renderTarget);
        this._engine.bindAttachments(this._layoutCache[0]);
        this._engine.setAlphaMode(11); // in WebGPU, when using MIN or MAX equation, the src / dst color factors should not use SRC_ALPHA and the src / dst alpha factors must be 1 else WebGPU will throw a validation error
        this._engine.setAlphaEquation(3);
        this._engine.depthCullingState.depthMask = false;
        this._engine.depthCullingState.depthTest = true;
        this._engine.applyStates();
        this._currentPingPongState = 1;
        // Render
        this._renderSubMeshes(this._candidateSubMeshes);
        this._engine.unBindFramebuffer(this._depthMrts[0].renderTarget);
        this._scene.resetCachedMaterial();
        // depth peeling ping-pong
        let readId = 0;
        let writeId = 0;
        for (let i = 0; i < this._passCount; i++) {
            readId = i % 2;
            writeId = 1 - readId;
            this._currentPingPongState = readId;
            if (this._useRenderPasses) {
                this._engine.currentRenderPassId = this._renderPassIds[i + 1];
            }
            if (this._scene.activeCamera) {
                this._engine.setViewport(this._scene.activeCamera.viewport);
            }
            // Clears
            this._engine.bindFramebuffer(this._depthMrts[writeId].renderTarget);
            this._engine.bindAttachments(this._layoutCache[0]);
            this._engine.clear(this._colorCache[0], true, false, false);
            this._engine.unBindFramebuffer(this._depthMrts[writeId].renderTarget);
            this._engine.bindFramebuffer(this._colorMrts[writeId].renderTarget);
            this._engine.bindAttachments(this._layoutCache[1]);
            this._engine.clear(this._colorCache[2], true, false, false);
            this._engine.unBindFramebuffer(this._colorMrts[writeId].renderTarget);
            this._engine.bindFramebuffer(this._depthMrts[writeId].renderTarget);
            this._engine.bindAttachments(this._layoutCache[2]);
            this._engine.setAlphaMode(11); // the value does not matter (as MAX operation does not use them) but the src and dst color factors should not use SRC_ALPHA else WebGPU will throw a validation error
            this._engine.setAlphaEquation(3);
            this._engine.depthCullingState.depthTest = false;
            this._engine.applyStates();
            // Render
            this._renderSubMeshes(this._candidateSubMeshes);
            this._engine.unBindFramebuffer(this._depthMrts[writeId].renderTarget);
            this._scene.resetCachedMaterial();
            // Back color
            this._engine.bindFramebuffer(this._blendBackMrt.renderTarget);
            this._engine.bindAttachments(this._layoutCache[0]);
            this._engine.setAlphaEquation(0);
            this._engine.setAlphaMode(17);
            this._engine.applyStates();
            const blendBackEffectWrapper = writeId === 0 || !this._useRenderPasses ? this._blendBackEffectWrapper : this._blendBackEffectWrapperPingPong;
            this._engine.enableEffect(blendBackEffectWrapper.drawWrapper);
            blendBackEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[writeId * 3 + 2]);
            this._effectRenderer.render(blendBackEffectWrapper);
            this._engine.unBindFramebuffer(this._blendBackMrt.renderTarget);
        }
        this._engine.currentRenderPassId = currentRenderPassId;
        // Final composition on default FB
        this._finalCompose(writeId);
        this._scene.prePassRenderer._enabled = true;
        this._engine.depthCullingState.depthMask = true;
        this._engine.depthCullingState.depthTest = true;
        return this._excludedSubMeshes;
    }
    /**
     * Disposes the depth peeling renderer and associated ressources
     */
    dispose() {
        this._disposeTextures();
        this._blendBackEffectWrapper.dispose();
        this._finalEffectWrapper.dispose();
        this._effectRenderer.dispose();
        this._releaseRenderPassIds();
    }
}
DepthPeelingRenderer._DEPTH_CLEAR_VALUE = -99999.0;
DepthPeelingRenderer._MIN_DEPTH = 0;
DepthPeelingRenderer._MAX_DEPTH = 1;
//# sourceMappingURL=depthPeelingRenderer.js.map