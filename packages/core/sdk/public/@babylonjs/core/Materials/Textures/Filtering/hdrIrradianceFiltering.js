import { Vector3 } from "../../../Maths/math.js";
import { ILog2 } from "../../../Maths/math.scalar.functions.js";
import { BaseTexture } from "../baseTexture.js";

import { EffectWrapper, EffectRenderer } from "../../../Materials/effectRenderer.js";
import { Logger } from "../../../Misc/logger.js";
import { IblCdfGenerator } from "../../../Rendering/iblCdfGenerator.js";
/**
 * Filters HDR maps to get correct renderings of PBR reflections
 */
export class HDRIrradianceFiltering {
    /**
     * Instantiates HDR filter for irradiance map
     *
     * @param engine Thin engine
     * @param options Options
     */
    constructor(engine, options = {}) {
        /**
         * Quality switch for prefiltering. Should be set to `4096` unless
         * you care about baking speed.
         */
        this.quality = 4096;
        /**
         * Scales pixel intensity for the input HDR map.
         */
        this.hdrScale = 1;
        /**
         * Use the Cumulative Distribution Function (CDF) for filtering
         */
        this.useCdf = false;
        // pass
        this._engine = engine;
        this.hdrScale = options.hdrScale || this.hdrScale;
        this.quality = options.quality || this.quality;
        this.useCdf = options.useCdf || this.useCdf;
    }
    _createRenderTarget(size) {
        let textureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            textureType = 2;
        }
        else if (this._engine.getCaps().textureFloatRender) {
            textureType = 1;
        }
        const rtWrapper = this._engine.createRenderTargetCubeTexture(size, {
            format: 5,
            type: textureType,
            createMipMaps: false,
            generateMipMaps: false,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
            samplingMode: 2,
            label: "HDR_Irradiance_Filtering_Target",
        });
        this._engine.updateTextureWrappingMode(rtWrapper.texture, 0, 0, 0);
        return rtWrapper;
    }
    _prefilterInternal(texture) {
        const width = texture.getSize().width;
        const mipmapsCount = ILog2(width);
        const effect = this._effectWrapper.effect;
        // Choose a power of 2 size for the irradiance map.
        // It can be much smaller than the original texture.
        const irradianceSize = Math.max(32, 1 << ILog2(width >> 3));
        const outputTexture = this._createRenderTarget(irradianceSize);
        this._effectRenderer.saveStates();
        this._effectRenderer.setViewport();
        this._effectRenderer.applyEffectWrapper(this._effectWrapper);
        const directions = [
            [new Vector3(0, 0, -1), new Vector3(0, -1, 0), new Vector3(1, 0, 0)], // PositiveX
            [new Vector3(0, 0, 1), new Vector3(0, -1, 0), new Vector3(-1, 0, 0)], // NegativeX
            [new Vector3(1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0)], // PositiveY
            [new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0)], // NegativeY
            [new Vector3(1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, 1)], // PositiveZ
            [new Vector3(-1, 0, 0), new Vector3(0, -1, 0), new Vector3(0, 0, -1)], // NegativeZ
        ];
        effect.setFloat("hdrScale", this.hdrScale);
        effect.setFloat2("vFilteringInfo", texture.getSize().width, mipmapsCount);
        effect.setTexture("inputTexture", texture);
        if (this._cdfGenerator) {
            effect.setTexture("icdfTexture", this._cdfGenerator.getIcdfTexture());
        }
        for (let face = 0; face < 6; face++) {
            effect.setVector3("up", directions[face][0]);
            effect.setVector3("right", directions[face][1]);
            effect.setVector3("front", directions[face][2]);
            this._engine.bindFramebuffer(outputTexture, face, undefined, undefined, true);
            this._effectRenderer.applyEffectWrapper(this._effectWrapper);
            this._effectRenderer.draw();
        }
        // Cleanup
        this._effectRenderer.restoreStates();
        this._engine.restoreDefaultFramebuffer();
        effect.setTexture("inputTexture", null);
        effect.setTexture("icdfTexture", null);
        const irradianceTexture = new BaseTexture(texture.getScene(), outputTexture.texture);
        irradianceTexture.name = texture.name + "_irradiance";
        irradianceTexture.displayName = texture.name + "_irradiance";
        irradianceTexture.gammaSpace = false;
        return irradianceTexture;
    }
    _createEffect(texture, onCompiled) {
        const defines = [];
        if (texture.gammaSpace) {
            defines.push("#define GAMMA_INPUT");
        }
        defines.push("#define NUM_SAMPLES " + this.quality + "u"); // unsigned int
        const isWebGPU = this._engine.isWebGPU;
        const samplers = ["inputTexture"];
        if (this._cdfGenerator) {
            samplers.push("icdfTexture");
            defines.push("#define IBL_CDF_FILTERING");
        }
        const effectWrapper = new EffectWrapper({
            engine: this._engine,
            name: "HDRIrradianceFiltering",
            vertexShader: "hdrIrradianceFiltering",
            fragmentShader: "hdrIrradianceFiltering",
            samplerNames: samplers,
            uniformNames: ["vSampleDirections", "vWeights", "up", "right", "front", "vFilteringInfo", "hdrScale"],
            useShaderStore: true,
            defines,
            onCompiled: onCompiled,
            shaderLanguage: isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../../ShadersWGSL/hdrIrradianceFiltering.vertex.js"), import("../../../ShadersWGSL/hdrIrradianceFiltering.fragment.js")]);
                }
                else {
                    await Promise.all([import("../../../Shaders/hdrIrradianceFiltering.vertex.js"), import("../../../Shaders/hdrIrradianceFiltering.fragment.js")]);
                }
            },
        });
        return effectWrapper;
    }
    /**
     * Get a value indicating if the filter is ready to be used
     * @param texture Texture to filter
     * @returns true if the filter is ready
     */
    isReady(texture) {
        return texture.isReady() && this._effectWrapper.effect.isReady();
    }
    /**
     * Prefilters a cube texture to contain IBL irradiance.
     * Prefiltering will be invoked at the end of next rendering pass.
     * This has to be done once the map is loaded, and has not been prefiltered by a third party software.
     * See http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf for more information
     * @param texture Texture to filter
     * @param onFinished Callback when filtering is done
     * @returns Promise called when prefiltering is done
     */
    prefilter(texture, onFinished = null) {
        if (!this._engine._features.allowTexturePrefiltering) {
            Logger.Warn("HDR prefiltering is not available in WebGL 1., you can use real time filtering instead.");
            return Promise.reject("HDR prefiltering is not available in WebGL 1., you can use real time filtering instead.");
        }
        let cdfGeneratedPromise = Promise.resolve(null);
        if (this.useCdf) {
            this._cdfGenerator = new IblCdfGenerator(this._engine);
            this._cdfGenerator.iblSource = texture;
            cdfGeneratedPromise = new Promise((resolve) => {
                this._cdfGenerator.onGeneratedObservable.addOnce(() => {
                    resolve(null);
                });
            });
        }
        return cdfGeneratedPromise.then(() => {
            return new Promise((resolve) => {
                this._effectRenderer = new EffectRenderer(this._engine);
                this._effectWrapper = this._createEffect(texture);
                this._effectWrapper.effect.executeWhenCompiled(() => {
                    const irradianceTexture = this._prefilterInternal(texture);
                    this._effectRenderer.dispose();
                    this._effectWrapper.dispose();
                    this._cdfGenerator?.dispose();
                    resolve(irradianceTexture);
                    if (onFinished) {
                        onFinished();
                    }
                });
            });
        });
    }
}
//# sourceMappingURL=hdrIrradianceFiltering.js.map