import { FrameGraphTask } from "../../frameGraphTask.js";
import { ShadowGenerator } from "../../../Lights/Shadows/shadowGenerator.js";
/**
 * Task used to generate shadows from a list of objects.
 */
export class FrameGraphShadowGeneratorTask extends FrameGraphTask {
    /**
     * The light to generate shadows from.
     */
    get light() {
        return this._light;
    }
    set light(value) {
        if (value === this._light) {
            return;
        }
        this._light = value;
        this._setupShadowGenerator();
    }
    /**
     * Gets or sets the camera used to generate the shadow generator.
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        this._setupShadowGenerator();
    }
    /**
     * The size of the shadow map.
     */
    get mapSize() {
        return this._mapSize;
    }
    set mapSize(value) {
        if (value === this._mapSize) {
            return;
        }
        this._mapSize = value;
        this._setupShadowGenerator();
    }
    /**
     * If true, the shadow map will use a 32 bits float texture type (else, 16 bits float is used if supported).
     */
    get useFloat32TextureType() {
        return this._useFloat32TextureType;
    }
    set useFloat32TextureType(value) {
        if (value === this._useFloat32TextureType) {
            return;
        }
        this._useFloat32TextureType = value;
        this._setupShadowGenerator();
    }
    /**
     * If true, the shadow map will use a red texture format (else, a RGBA format is used).
     */
    get useRedTextureFormat() {
        return this._useRedTextureFormat;
    }
    set useRedTextureFormat(value) {
        if (value === this._useRedTextureFormat) {
            return;
        }
        this._useRedTextureFormat = value;
        this._setupShadowGenerator();
    }
    /**
     * The bias to apply to the shadow map.
     */
    get bias() {
        return this._bias;
    }
    set bias(value) {
        if (value === this._bias) {
            return;
        }
        this._bias = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.bias = value;
        }
    }
    /**
     * The normal bias to apply to the shadow map.
     */
    get normalBias() {
        return this._normalBias;
    }
    set normalBias(value) {
        if (value === this._normalBias) {
            return;
        }
        this._normalBias = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.normalBias = value;
        }
    }
    /**
     * The darkness of the shadows.
     */
    get darkness() {
        return this._darkness;
    }
    set darkness(value) {
        if (value === this._darkness) {
            return;
        }
        this._darkness = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.darkness = value;
        }
    }
    /**
     * Gets or sets the ability to have transparent shadow
     */
    get transparencyShadow() {
        return this._transparencyShadow;
    }
    set transparencyShadow(value) {
        if (value === this._transparencyShadow) {
            return;
        }
        this._transparencyShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.transparencyShadow = value;
        }
    }
    /**
     * Enables or disables shadows with varying strength based on the transparency
     */
    get enableSoftTransparentShadow() {
        return this._enableSoftTransparentShadow;
    }
    set enableSoftTransparentShadow(value) {
        if (value === this._enableSoftTransparentShadow) {
            return;
        }
        this._enableSoftTransparentShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.enableSoftTransparentShadow = value;
        }
    }
    /**
     * If this is true, use the opacity texture's alpha channel for transparent shadows instead of the diffuse one
     */
    get useOpacityTextureForTransparentShadow() {
        return this._useOpacityTextureForTransparentShadow;
    }
    set useOpacityTextureForTransparentShadow(value) {
        if (value === this._useOpacityTextureForTransparentShadow) {
            return;
        }
        this._useOpacityTextureForTransparentShadow = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.useOpacityTextureForTransparentShadow = value;
        }
    }
    /**
     * The filter to apply to the shadow map.
     */
    get filter() {
        return this._filter;
    }
    set filter(value) {
        if (value === this._filter) {
            return;
        }
        this._filter = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.filter = value;
        }
    }
    /**
     * The filtering quality to apply to the filter.
     */
    get filteringQuality() {
        return this._filteringQuality;
    }
    set filteringQuality(value) {
        if (value === this._filteringQuality) {
            return;
        }
        this._filteringQuality = value;
        if (this._shadowGenerator) {
            this._shadowGenerator.filteringQuality = value;
        }
    }
    _createShadowGenerator() {
        this._shadowGenerator = new ShadowGenerator(this._mapSize, this._light, this._useFloat32TextureType, undefined, this._useRedTextureFormat);
    }
    _setupShadowGenerator() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
        if (this._light !== undefined) {
            this._createShadowGenerator();
            const shadowGenerator = this._shadowGenerator;
            if (shadowGenerator === undefined) {
                return;
            }
            shadowGenerator.bias = this._bias;
            shadowGenerator.normalBias = this._normalBias;
            shadowGenerator.darkness = this._darkness;
            shadowGenerator.transparencyShadow = this._transparencyShadow;
            shadowGenerator.enableSoftTransparentShadow = this._enableSoftTransparentShadow;
            shadowGenerator.useOpacityTextureForTransparentShadow = this._useOpacityTextureForTransparentShadow;
            shadowGenerator.filter = this._filter;
            shadowGenerator.filteringQuality = this._filteringQuality;
            const shadowMap = shadowGenerator.getShadowMap();
            shadowMap._disableEngineStages = true;
            shadowMap.cameraForLOD = this._camera;
            this.shadowGenerator = shadowGenerator;
        }
    }
    isReady() {
        return !!this._shadowGenerator && !!this._shadowGenerator.getShadowMap()?.isReadyForRendering();
    }
    /**
     * Creates a new shadow generator task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene to create the shadow generator for.
     */
    constructor(name, frameGraph, scene) {
        super(name, frameGraph);
        this._mapSize = 1024;
        this._useFloat32TextureType = false;
        this._useRedTextureFormat = true;
        this._bias = 0.01;
        this._normalBias = 0;
        this._darkness = 0;
        this._transparencyShadow = false;
        this._enableSoftTransparentShadow = false;
        this._useOpacityTextureForTransparentShadow = false;
        this._filter = ShadowGenerator.FILTER_PCF;
        this._filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this._engine = scene.getEngine();
        this._scene = scene;
        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }
    record() {
        if (this.light === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphShadowGeneratorTask ${this.name}: light, objectList and camera are required`);
        }
        // Make sure the renderList / particleSystemList are set when FrameGraphShadowGeneratorTask.isReady() is called!
        const shadowMap = this._shadowGenerator.getShadowMap();
        shadowMap.renderList = this.objectList.meshes;
        shadowMap.particleSystemList = this.objectList.particleSystems;
        const shadowTextureHandle = this._frameGraph.textureManager.importTexture(`${this.name} shadowmap`, this._shadowGenerator.getShadowMap().getInternalTexture());
        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, shadowTextureHandle);
        const pass = this._frameGraph.addPass(this.name);
        pass.setExecuteFunc((_context) => {
            if (!this.light.isEnabled() || !this.light.shadowEnabled) {
                return;
            }
            const shadowMap = this._shadowGenerator.getShadowMap();
            shadowMap.renderList = this.objectList.meshes;
            shadowMap.particleSystemList = this.objectList.particleSystems;
            const currentRenderTarget = this._engine._currentRenderTarget;
            this._scene.incrementRenderId();
            this._scene.resetCachedMaterial();
            shadowMap.render();
            if (this._engine._currentRenderTarget !== currentRenderTarget) {
                if (!currentRenderTarget) {
                    this._engine.restoreDefaultFramebuffer();
                }
                else {
                    this._engine.bindFramebuffer(currentRenderTarget);
                }
            }
        });
        const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);
        passDisabled.setExecuteFunc((_context) => { });
    }
    dispose() {
        this._shadowGenerator?.dispose();
        this._shadowGenerator = undefined;
    }
}
//# sourceMappingURL=shadowGeneratorTask.js.map