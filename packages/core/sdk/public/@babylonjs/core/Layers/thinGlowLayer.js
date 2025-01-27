import { Vector2 } from "../Maths/math.vector.js";
import { VertexBuffer } from "../Buffers/buffer.js";
import { Material } from "../Materials/material.js";
import { ThinEffectLayer } from "./thinEffectLayer.js";

import { Color4 } from "../Maths/math.color.js";
import { ThinBlurPostProcess } from "../PostProcesses/thinBlurPostProcess.js";
/**
 * @internal
 */
export class ThinGlowLayer extends ThinEffectLayer {
    /**
     * Gets the ldrMerge option.
     */
    get ldrMerge() {
        return this._options.ldrMerge;
    }
    /**
     * Sets the kernel size of the blur.
     */
    set blurKernelSize(value) {
        if (value === this._options.blurKernelSize) {
            return;
        }
        this._options.blurKernelSize = value;
        const effectiveKernel = this._getEffectiveBlurKernelSize();
        this._horizontalBlurPostprocess1.kernel = effectiveKernel;
        this._verticalBlurPostprocess1.kernel = effectiveKernel;
        this._horizontalBlurPostprocess2.kernel = effectiveKernel;
        this._verticalBlurPostprocess2.kernel = effectiveKernel;
    }
    /**
     * Gets the kernel size of the blur.
     */
    get blurKernelSize() {
        return this._options.blurKernelSize;
    }
    /**
     * Sets the glow intensity.
     */
    set intensity(value) {
        this._intensity = value;
    }
    /**
     * Gets the glow intensity.
     */
    get intensity() {
        return this._intensity;
    }
    /**
     * Instantiates a new glow Layer and references it to the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IGlowLayerOptions for more information)
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     */
    constructor(name, scene, options, dontCheckIfReady = false) {
        super(name, scene, false, dontCheckIfReady);
        this._intensity = 1.0;
        /** @internal */
        this._includedOnlyMeshes = [];
        /** @internal */
        this._excludedMeshes = [];
        this._meshesUsingTheirOwnMaterials = [];
        /** @internal */
        this._renderPassId = 0;
        this.neutralColor = new Color4(0, 0, 0, 1);
        // Adapt options
        this._options = {
            mainTextureRatio: 0.5,
            mainTextureFixedSize: 0,
            mainTextureType: 0,
            blurKernelSize: 32,
            camera: null,
            renderingGroupId: -1,
            ldrMerge: false,
            alphaBlendingMode: 1,
            ...options,
        };
        // Initialize the layer
        this._init(this._options);
        if (dontCheckIfReady) {
            // When dontCheckIfReady is true, we are in the new ThinXXX layer mode, so we must call _createTextureAndPostProcesses ourselves (it is called by EffectLayer otherwise)
            this._createTextureAndPostProcesses();
        }
    }
    /**
     * Gets the class name of the thin glow layer
     * @returns the string with the class name of the glow layer
     */
    getClassName() {
        return "GlowLayer";
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
        return ThinGlowLayer.EffectName;
    }
    _createMergeEffect() {
        let defines = "#define EMISSIVE \n";
        if (this._options.ldrMerge) {
            defines += "#define LDR \n";
        }
        // Effect
        return this._engine.createEffect("glowMapMerge", [VertexBuffer.PositionKind], ["offset"], ["textureSampler", "textureSampler2"], defines, undefined, undefined, undefined, undefined, this.shaderLanguage, this._shadersLoaded
            ? undefined
            : async () => {
                await this._importShadersAsync();
                this._shadersLoaded = true;
            });
    }
    _createTextureAndPostProcesses() {
        const effectiveKernel = this._getEffectiveBlurKernelSize();
        this._horizontalBlurPostprocess1 = new ThinBlurPostProcess("GlowLayerHBP1", this._scene.getEngine(), new Vector2(1.0, 0), effectiveKernel);
        this._verticalBlurPostprocess1 = new ThinBlurPostProcess("GlowLayerVBP1", this._scene.getEngine(), new Vector2(0, 1.0), effectiveKernel);
        this._horizontalBlurPostprocess2 = new ThinBlurPostProcess("GlowLayerHBP2", this._scene.getEngine(), new Vector2(1.0, 0), effectiveKernel);
        this._verticalBlurPostprocess2 = new ThinBlurPostProcess("GlowLayerVBP2", this._scene.getEngine(), new Vector2(0, 1.0), effectiveKernel);
        this._postProcesses = [this._horizontalBlurPostprocess1, this._verticalBlurPostprocess1, this._horizontalBlurPostprocess2, this._verticalBlurPostprocess2];
    }
    _getEffectiveBlurKernelSize() {
        return this._options.blurKernelSize / 2;
    }
    isReady(subMesh, useInstances) {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();
        if (!material || !mesh) {
            return false;
        }
        const emissiveTexture = material.emissiveTexture;
        return super._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }
    _canRenderMesh(_mesh, _material) {
        return true;
    }
    _internalCompose(effect) {
        // Texture
        this.bindTexturesForCompose(effect);
        effect.setFloat("offset", this._intensity);
        // Cache
        const engine = this._engine;
        const previousStencilBuffer = engine.getStencilBuffer();
        // Draw order
        engine.setStencilBuffer(false);
        engine.drawElementsType(Material.TriangleFillMode, 0, 6);
        // Draw order
        engine.setStencilBuffer(previousStencilBuffer);
    }
    _setEmissiveTextureAndColor(mesh, subMesh, material) {
        let textureLevel = 1.0;
        if (this.customEmissiveTextureSelector) {
            this._emissiveTextureAndColor.texture = this.customEmissiveTextureSelector(mesh, subMesh, material);
        }
        else {
            if (material) {
                this._emissiveTextureAndColor.texture = material.emissiveTexture;
                if (this._emissiveTextureAndColor.texture) {
                    textureLevel = this._emissiveTextureAndColor.texture.level;
                }
            }
            else {
                this._emissiveTextureAndColor.texture = null;
            }
        }
        if (this.customEmissiveColorSelector) {
            this.customEmissiveColorSelector(mesh, subMesh, material, this._emissiveTextureAndColor.color);
        }
        else {
            if (material.emissiveColor) {
                const emissiveIntensity = material.emissiveIntensity ?? 1;
                textureLevel *= emissiveIntensity;
                this._emissiveTextureAndColor.color.set(material.emissiveColor.r * textureLevel, material.emissiveColor.g * textureLevel, material.emissiveColor.b * textureLevel, material.alpha);
            }
            else {
                this._emissiveTextureAndColor.color.set(this.neutralColor.r, this.neutralColor.g, this.neutralColor.b, this.neutralColor.a);
            }
        }
    }
    _shouldRenderMesh(mesh) {
        return this.hasMesh(mesh);
    }
    _addCustomEffectDefines(defines) {
        defines.push("#define GLOW");
    }
    /**
     * Add a mesh in the exclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to exclude from the glow layer
     */
    addExcludedMesh(mesh) {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }
    /**
     * Remove a mesh from the exclusion list to let it impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    removeExcludedMesh(mesh) {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }
    /**
     * Add a mesh in the inclusion list to impact or being impacted by the glow layer.
     * @param mesh The mesh to include in the glow layer
     */
    addIncludedOnlyMesh(mesh) {
        if (this._includedOnlyMeshes.indexOf(mesh.uniqueId) === -1) {
            this._includedOnlyMeshes.push(mesh.uniqueId);
        }
    }
    /**
     * Remove a mesh from the Inclusion list to prevent it to impact or being impacted by the glow layer.
     * @param mesh The mesh to remove
     */
    removeIncludedOnlyMesh(mesh) {
        const index = this._includedOnlyMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._includedOnlyMeshes.splice(index, 1);
        }
    }
    hasMesh(mesh) {
        if (!super.hasMesh(mesh)) {
            return false;
        }
        // Included Mesh
        if (this._includedOnlyMeshes.length) {
            return this._includedOnlyMeshes.indexOf(mesh.uniqueId) !== -1;
        }
        // Excluded Mesh
        if (this._excludedMeshes.length) {
            return this._excludedMeshes.indexOf(mesh.uniqueId) === -1;
        }
        return true;
    }
    _useMeshMaterial(mesh) {
        // Specific case of material supporting glow directly
        if (mesh.material?._supportGlowLayer) {
            return true;
        }
        if (this._meshesUsingTheirOwnMaterials.length == 0) {
            return false;
        }
        return this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId) > -1;
    }
    /**
     * Add a mesh to be rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to use its material
     */
    referenceMeshToUseItsOwnMaterial(mesh) {
        mesh.resetDrawCache(this._renderPassId);
        this._meshesUsingTheirOwnMaterials.push(mesh.uniqueId);
        mesh.onDisposeObservable.add(() => {
            this._disposeMesh(mesh);
        });
    }
    /**
     * Remove a mesh from being rendered through its own material and not with emissive only.
     * @param mesh The mesh for which we need to not use its material
     * @param renderPassId The render pass id used when rendering the mesh
     */
    unReferenceMeshFromUsingItsOwnMaterial(mesh, renderPassId) {
        let index = this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId);
        while (index >= 0) {
            this._meshesUsingTheirOwnMaterials.splice(index, 1);
            index = this._meshesUsingTheirOwnMaterials.indexOf(mesh.uniqueId);
        }
        mesh.resetDrawCache(renderPassId);
    }
    /** @internal */
    _disposeMesh(mesh) {
        this.removeIncludedOnlyMesh(mesh);
        this.removeExcludedMesh(mesh);
    }
}
/**
 * Effect Name of the layer.
 */
ThinGlowLayer.EffectName = "GlowLayer";
/**
 * The default blur kernel size used for the glow.
 */
ThinGlowLayer.DefaultBlurKernelSize = 32;
//# sourceMappingURL=thinGlowLayer.js.map