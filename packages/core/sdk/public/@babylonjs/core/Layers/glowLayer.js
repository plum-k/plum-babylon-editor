import { __decorate } from "../tslib.es6.js";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { serialize } from "../Misc/decorators.js";
import { Scene } from "../scene.js";
import { Texture } from "../Materials/Textures/texture.js";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.js";
import { BlurPostProcess } from "../PostProcesses/blurPostProcess.js";
import { EffectLayer } from "./effectLayer.js";

import { RegisterClass } from "../Misc/typeStore.js";
import "../Layers/effectLayerSceneComponent.js";
import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { GetExponentOfTwo } from "../Misc/tools.functions.js";
import { ThinGlowLayer } from "./thinGlowLayer.js";
Scene.prototype.getGlowLayerByName = function (name) {
    for (let index = 0; index < this.effectLayers?.length; index++) {
        if (this.effectLayers[index].name === name && this.effectLayers[index].getEffectName() === GlowLayer.EffectName) {
            return this.effectLayers[index];
        }
    }
    return null;
};
/**
 * The glow layer Helps adding a glow effect around the emissive parts of a mesh.
 *
 * Once instantiated in a scene, by default, all the emissive meshes will glow.
 *
 * Documentation: https://doc.babylonjs.com/features/featuresDeepDive/mesh/glowLayer
 */
export class GlowLayer extends EffectLayer {
    /**
     * Effect Name of the layer.
     */
    static get EffectName() {
        return ThinGlowLayer.EffectName;
    }
    /**
     * Sets the kernel size of the blur.
     */
    set blurKernelSize(value) {
        this._thinEffectLayer.blurKernelSize = value;
    }
    /**
     * Gets the kernel size of the blur.
     */
    get blurKernelSize() {
        return this._thinEffectLayer.blurKernelSize;
    }
    /**
     * Sets the glow intensity.
     */
    set intensity(value) {
        this._thinEffectLayer.intensity = value;
    }
    /**
     * Gets the glow intensity.
     */
    get intensity() {
        return this._thinEffectLayer.intensity;
    }
    /**
     * Callback used to let the user override the color selection on a per mesh basis
     */
    get customEmissiveColorSelector() {
        return this._thinEffectLayer.customEmissiveColorSelector;
    }
    set customEmissiveColorSelector(value) {
        this._thinEffectLayer.customEmissiveColorSelector = value;
    }
    /**
     * Callback used to let the user override the texture selection on a per mesh basis
     */
    get customEmissiveTextureSelector() {
        return this._thinEffectLayer.customEmissiveTextureSelector;
    }
    set customEmissiveTextureSelector(value) {
        this._thinEffectLayer.customEmissiveTextureSelector = value;
    }
    /**
     * Instantiates a new glow Layer and references it to the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IGlowLayerOptions for more information)
     */
    constructor(name, scene, options) {
        super(name, scene, false, new ThinGlowLayer(name, scene, options));
        // Adapt options
        this._options = {
            mainTextureRatio: GlowLayer.DefaultTextureRatio,
            blurKernelSize: 32,
            mainTextureFixedSize: undefined,
            camera: null,
            mainTextureSamples: 1,
            renderingGroupId: -1,
            ldrMerge: false,
            alphaBlendingMode: 1,
            mainTextureType: 0,
            generateStencilBuffer: false,
            ...options,
        };
        // Initialize the layer
        this._init(this._options);
    }
    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    getEffectName() {
        return GlowLayer.EffectName;
    }
    /**
     * @internal
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     */
    _createMergeEffect() {
        return this._thinEffectLayer._createMergeEffect();
    }
    /**
     * Creates the render target textures and post processes used in the glow layer.
     */
    _createTextureAndPostProcesses() {
        this._thinEffectLayer._renderPassId = this._mainTexture.renderPassId;
        let blurTextureWidth = this._mainTextureDesiredSize.width;
        let blurTextureHeight = this._mainTextureDesiredSize.height;
        blurTextureWidth = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
        blurTextureHeight = this._engine.needPOTTextures ? GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;
        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = 2;
        }
        else {
            textureType = 0;
        }
        this._blurTexture1 = new RenderTargetTexture("GlowLayerBlurRTT", {
            width: blurTextureWidth,
            height: blurTextureHeight,
        }, this._scene, false, true, textureType);
        this._blurTexture1.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture1.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture1.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._blurTexture1.renderParticles = false;
        this._blurTexture1.ignoreCameraViewport = true;
        const blurTextureWidth2 = Math.floor(blurTextureWidth / 2);
        const blurTextureHeight2 = Math.floor(blurTextureHeight / 2);
        this._blurTexture2 = new RenderTargetTexture("GlowLayerBlurRTT2", {
            width: blurTextureWidth2,
            height: blurTextureHeight2,
        }, this._scene, false, true, textureType);
        this._blurTexture2.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture2.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._blurTexture2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._blurTexture2.renderParticles = false;
        this._blurTexture2.ignoreCameraViewport = true;
        this._textures = [this._blurTexture1, this._blurTexture2];
        this._thinEffectLayer.bindTexturesForCompose = (effect) => {
            effect.setTexture("textureSampler", this._blurTexture1);
            effect.setTexture("textureSampler2", this._blurTexture2);
            effect.setFloat("offset", this.intensity);
        };
        this._thinEffectLayer._createTextureAndPostProcesses();
        const thinBlurPostProcesses1 = this._thinEffectLayer._postProcesses[0];
        this._horizontalBlurPostprocess1 = new BlurPostProcess("GlowLayerHBP1", thinBlurPostProcesses1.direction, thinBlurPostProcesses1.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth,
            height: blurTextureHeight,
            textureType,
            effectWrapper: thinBlurPostProcesses1,
        });
        this._horizontalBlurPostprocess1.width = blurTextureWidth;
        this._horizontalBlurPostprocess1.height = blurTextureHeight;
        this._horizontalBlurPostprocess1.externalTextureSamplerBinding = true;
        this._horizontalBlurPostprocess1.onApplyObservable.add((effect) => {
            effect.setTexture("textureSampler", this._mainTexture);
        });
        const thinBlurPostProcesses2 = this._thinEffectLayer._postProcesses[1];
        this._verticalBlurPostprocess1 = new BlurPostProcess("GlowLayerVBP1", thinBlurPostProcesses2.direction, thinBlurPostProcesses2.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth,
            height: blurTextureHeight,
            textureType,
            effectWrapper: thinBlurPostProcesses2,
        });
        const thinBlurPostProcesses3 = this._thinEffectLayer._postProcesses[2];
        this._horizontalBlurPostprocess2 = new BlurPostProcess("GlowLayerHBP2", thinBlurPostProcesses3.direction, thinBlurPostProcesses3.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth2,
            height: blurTextureHeight2,
            textureType,
            effectWrapper: thinBlurPostProcesses3,
        });
        this._horizontalBlurPostprocess2.width = blurTextureWidth2;
        this._horizontalBlurPostprocess2.height = blurTextureHeight2;
        this._horizontalBlurPostprocess2.externalTextureSamplerBinding = true;
        this._horizontalBlurPostprocess2.onApplyObservable.add((effect) => {
            effect.setTexture("textureSampler", this._blurTexture1);
        });
        const thinBlurPostProcesses4 = this._thinEffectLayer._postProcesses[3];
        this._verticalBlurPostprocess2 = new BlurPostProcess("GlowLayerVBP2", thinBlurPostProcesses4.direction, thinBlurPostProcesses4.kernel, {
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            width: blurTextureWidth2,
            height: blurTextureHeight2,
            textureType,
            effectWrapper: thinBlurPostProcesses4,
        });
        this._postProcesses = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1, this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];
        this._postProcesses1 = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1];
        this._postProcesses2 = [this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];
        this._mainTexture.samples = this._options.mainTextureSamples;
        this._mainTexture.onAfterUnbindObservable.add(() => {
            const internalTexture = this._blurTexture1.renderTarget;
            if (internalTexture) {
                this._scene.postProcessManager.directRender(this._postProcesses1, internalTexture, true);
                const internalTexture2 = this._blurTexture2.renderTarget;
                if (internalTexture2) {
                    this._scene.postProcessManager.directRender(this._postProcesses2, internalTexture2, true);
                }
                this._engine.unBindFramebuffer(internalTexture2 ?? internalTexture, true);
            }
        });
        // Prevent autoClear.
        this._postProcesses.map((pp) => {
            pp.autoClear = false;
        });
    }
    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    isReady(subMesh, useInstances) {
        return this._thinEffectLayer.isReady(subMesh, useInstances);
    }
    /**
     * @returns whether or not the layer needs stencil enabled during the mesh rendering.
     */
    needStencil() {
        return false;
    }
    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    _canRenderMesh(mesh, material) {
        return this._thinEffectLayer._canRenderMesh(mesh, material);
    }
    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     */
    _internalRender(effect) {
        this._thinEffectLayer._internalCompose(effect);
    }
    /**
     * Sets the required values for both the emissive texture and and the main color.
     * @param mesh
     * @param subMesh
     * @param material
     */
    _setEmissiveTextureAndColor(mesh, subMesh, material) {
        this._thinEffectLayer._setEmissiveTextureAndColor(mesh, subMesh, material);
    }
    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    _shouldRenderMesh(mesh) {
        return this._thinEffectLayer._shouldRenderMesh(mesh);
    }
    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    _addCustomEffectDefines(defines) {
        this._thinEffectLayer._addCustomEffectDefines(defines);
    }
    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to exclude from the glow layer
     */
    addExcludedMesh(mesh) {
        this._thinEffectLayer.addExcludedMesh(mesh);
    }
    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    removeExcludedMesh(mesh) {
        this._thinEffectLayer.removeExcludedMesh(mesh);
    }
    /**
     * Add a mesh in the inclusion list to impact or being impacted by the glow layer.
     * @param mesh The mesh to include in the glow layer
     */
    addIncludedOnlyMesh(mesh) {
        this._thinEffectLayer.addIncludedOnlyMesh(mesh);
    }
    /**
     * Remove a mesh from the Inclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    removeIncludedOnlyMesh(mesh) {
        this._thinEffectLayer.removeIncludedOnlyMesh(mesh);
    }
    /**
     * Determine if a given mesh will be used in the glow layer
     * @param mesh The mesh to test
     * @returns true if the mesh will be highlighted by the current glow layer
     */
    hasMesh(mesh) {
        return this._thinEffectLayer.hasMesh(mesh);
    }
    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     * @returns true if the material of the mesh should be use to render the effect
     */
    _useMeshMaterial(mesh) {
        return this._thinEffectLayer._useMeshMaterial(mesh);
    }
    /**
     * Add a mesh to be rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to use its material
     */
    referenceMeshToUseItsOwnMaterial(mesh) {
        this._thinEffectLayer.referenceMeshToUseItsOwnMaterial(mesh);
    }
    /**
     * Remove a mesh from being rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to not use its material
     */
    unReferenceMeshFromUsingItsOwnMaterial(mesh) {
        this._thinEffectLayer.unReferenceMeshFromUsingItsOwnMaterial(mesh, this._mainTexture.renderPassId);
    }
    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    _disposeMesh(mesh) {
        this._thinEffectLayer._disposeMesh(mesh);
    }
    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    getClassName() {
        return "GlowLayer";
    }
    /**
     * Serializes this glow layer
     * @returns a serialized glow layer object
     */
    serialize() {
        const serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.GlowLayer";
        let index;
        // Included meshes
        serializationObject.includedMeshes = [];
        const includedOnlyMeshes = this._thinEffectLayer._includedOnlyMeshes;
        if (includedOnlyMeshes.length) {
            for (index = 0; index < includedOnlyMeshes.length; index++) {
                const mesh = this._scene.getMeshByUniqueId(includedOnlyMeshes[index]);
                if (mesh) {
                    serializationObject.includedMeshes.push(mesh.id);
                }
            }
        }
        // Excluded meshes
        serializationObject.excludedMeshes = [];
        const excludedMeshes = this._thinEffectLayer._excludedMeshes;
        if (excludedMeshes.length) {
            for (index = 0; index < excludedMeshes.length; index++) {
                const mesh = this._scene.getMeshByUniqueId(excludedMeshes[index]);
                if (mesh) {
                    serializationObject.excludedMeshes.push(mesh.id);
                }
            }
        }
        return serializationObject;
    }
    /**
     * Creates a Glow Layer from parsed glow layer data
     * @param parsedGlowLayer defines glow layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the glow layer information
     * @returns a parsed Glow Layer
     */
    static Parse(parsedGlowLayer, scene, rootUrl) {
        const gl = SerializationHelper.Parse(() => new GlowLayer(parsedGlowLayer.name, scene, parsedGlowLayer.options), parsedGlowLayer, scene, rootUrl);
        let index;
        // Excluded meshes
        for (index = 0; index < parsedGlowLayer.excludedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedGlowLayer.excludedMeshes[index]);
            if (mesh) {
                gl.addExcludedMesh(mesh);
            }
        }
        // Included meshes
        for (index = 0; index < parsedGlowLayer.includedMeshes.length; index++) {
            const mesh = scene.getMeshById(parsedGlowLayer.includedMeshes[index]);
            if (mesh) {
                gl.addIncludedOnlyMesh(mesh);
            }
        }
        return gl;
    }
}
/**
 * The default blur kernel size used for the glow.
 */
GlowLayer.DefaultBlurKernelSize = 32;
/**
 * The default texture size ratio used for the glow.
 */
GlowLayer.DefaultTextureRatio = 0.5;
__decorate([
    serialize()
], GlowLayer.prototype, "blurKernelSize", null);
__decorate([
    serialize()
], GlowLayer.prototype, "intensity", null);
__decorate([
    serialize("options")
], GlowLayer.prototype, "_options", void 0);
RegisterClass("BABYLON.GlowLayer", GlowLayer);
//# sourceMappingURL=glowLayer.js.map