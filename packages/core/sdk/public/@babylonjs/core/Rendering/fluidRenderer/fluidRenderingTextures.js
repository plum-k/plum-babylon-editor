
import { Texture } from "../../Materials/Textures/texture.js";
import { Vector2 } from "../../Maths/math.vector.js";
import { PostProcess } from "../../PostProcesses/postProcess.js";
import { Observable } from "../../Misc/observable.js";
/** @internal */
export class FluidRenderingTextures {
    get blurNumIterations() {
        return this._blurNumIterations;
    }
    set blurNumIterations(numIterations) {
        if (this._blurNumIterations === numIterations) {
            return;
        }
        this._blurNumIterations = numIterations;
        if (this._blurPostProcesses !== null) {
            const blurX = this._blurPostProcesses[0];
            const blurY = this._blurPostProcesses[1];
            this._blurPostProcesses = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                this._blurPostProcesses[i] = i & 1 ? blurY : blurX;
            }
        }
    }
    get renderTarget() {
        return this._rt;
    }
    get renderTargetBlur() {
        return this._rtBlur;
    }
    get texture() {
        return this._texture;
    }
    get textureBlur() {
        return this._textureBlurred;
    }
    /**
     * Gets the shader language used in the texture
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    constructor(name, scene, width, height, blurTextureSizeX, blurTextureSizeY, textureType = 1, textureFormat = 6, blurTextureType = 1, blurTextureFormat = 6, useStandardBlur = false, camera = null, generateDepthBuffer = true, samples = 1, shaderLanguage) {
        this.enableBlur = true;
        this.blurSizeDivisor = 1;
        this.blurFilterSize = 7;
        this._blurNumIterations = 3;
        this.blurMaxFilterSize = 100;
        this.blurDepthScale = 10;
        this.particleSize = 0.02;
        this.onDisposeObservable = new Observable();
        /** Shader language used by the texture */
        this._shaderLanguage = 0 /* ShaderLanguage.GLSL */;
        this._name = name;
        this._scene = scene;
        this._camera = camera;
        this._engine = scene.getEngine();
        this._width = width;
        this._height = height;
        this._blurTextureSizeX = blurTextureSizeX;
        this._blurTextureSizeY = blurTextureSizeY;
        this._textureType = textureType;
        this._textureFormat = textureFormat;
        this._blurTextureType = blurTextureType;
        this._blurTextureFormat = blurTextureFormat;
        this._useStandardBlur = useStandardBlur;
        this._generateDepthBuffer = generateDepthBuffer;
        this._samples = samples;
        this._postProcessRunningIndex = 0;
        this.enableBlur = blurTextureSizeX !== 0 && blurTextureSizeY !== 0;
        this._rt = null;
        this._texture = null;
        this._rtBlur = null;
        this._textureBlurred = null;
        this._blurPostProcesses = null;
        this._shaderLanguage = shaderLanguage ?? (this._engine.isWebGPU ? 1 /* ShaderLanguage.WGSL */ : 0 /* ShaderLanguage.GLSL */);
    }
    initialize() {
        this.dispose();
        this._createRenderTarget();
        if (this.enableBlur && this._texture) {
            const [rtBlur, textureBlurred, blurPostProcesses] = this._createBlurPostProcesses(this._texture, this._blurTextureType, this._blurTextureFormat, this.blurSizeDivisor, this._name, this._useStandardBlur);
            this._rtBlur = rtBlur;
            this._textureBlurred = textureBlurred;
            this._blurPostProcesses = blurPostProcesses;
        }
    }
    applyBlurPostProcesses() {
        if (this.enableBlur && this._blurPostProcesses) {
            this._postProcessRunningIndex = 0;
            this._scene.postProcessManager.directRender(this._blurPostProcesses, this._rtBlur, true);
            this._engine.unBindFramebuffer(this._rtBlur);
        }
    }
    _createRenderTarget() {
        this._rt = this._engine.createRenderTargetTexture({ width: this._width, height: this._height }, {
            generateMipMaps: false,
            type: this._textureType,
            format: this._textureFormat,
            samplingMode: 1,
            generateDepthBuffer: this._generateDepthBuffer,
            generateStencilBuffer: false,
            samples: this._samples,
            label: `FluidRenderingRTT-${this._name}`,
        });
        const renderTexture = this._rt.texture;
        renderTexture.incrementReferences();
        this._texture = new Texture(null, this._scene);
        this._texture.name = "rtt" + this._name;
        this._texture._texture = renderTexture;
        this._texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._texture.anisotropicFilteringLevel = 1;
    }
    _createBlurPostProcesses(textureBlurSource, textureType, textureFormat, blurSizeDivisor, debugName, useStandardBlur = false) {
        const engine = this._scene.getEngine();
        const targetSize = new Vector2(Math.floor(this._blurTextureSizeX / blurSizeDivisor), Math.floor(this._blurTextureSizeY / blurSizeDivisor));
        const useBilinearFiltering = (textureType === 1 && engine.getCaps().textureFloatLinearFiltering) ||
            (textureType === 2 && engine.getCaps().textureHalfFloatLinearFiltering);
        const rtBlur = this._engine.createRenderTargetTexture({ width: targetSize.x, height: targetSize.y }, {
            generateMipMaps: false,
            type: textureType,
            format: textureFormat,
            samplingMode: useBilinearFiltering ? 2 : 1,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
            samples: this._samples,
            label: `FluidRenderingRTTBlur-${debugName}`,
        });
        const renderTexture = rtBlur.texture;
        renderTexture.incrementReferences();
        const texture = new Texture(null, this._scene);
        texture.name = "rttBlurred" + debugName;
        texture._texture = renderTexture;
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        texture.anisotropicFilteringLevel = 1;
        if (useStandardBlur) {
            const kernelBlurXPostprocess = new PostProcess("BilateralBlurX", "fluidRenderingStandardBlur", ["filterSize", "blurDir"], null, 1, null, 1, engine, true, null, textureType, undefined, undefined, undefined, textureFormat, this._shaderLanguage, async () => {
                if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../../ShadersWGSL/fluidRenderingStandardBlur.fragment.js");
                }
                else {
                    await import("../../Shaders/fluidRenderingStandardBlur.fragment.js");
                }
            });
            kernelBlurXPostprocess.samples = this._samples;
            kernelBlurXPostprocess.externalTextureSamplerBinding = true;
            kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                if (this._postProcessRunningIndex === 0) {
                    effect.setTexture("textureSampler", textureBlurSource);
                }
                else {
                    effect._bindTexture("textureSampler", kernelBlurXPostprocess.inputTexture.texture);
                }
                effect.setInt("filterSize", this.blurFilterSize);
                effect.setFloat2("blurDir", 1 / this._blurTextureSizeX, 0);
                this._postProcessRunningIndex++;
            });
            kernelBlurXPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurXPostprocess._textures.forEach((rt) => {
                    rt.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurXPostprocess);
            const kernelBlurYPostprocess = new PostProcess("BilateralBlurY", "fluidRenderingStandardBlur", ["filterSize", "blurDir"], null, 1, null, 1, engine, true, null, textureType, undefined, undefined, undefined, textureFormat, this._shaderLanguage, async () => {
                if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../../ShadersWGSL/fluidRenderingStandardBlur.fragment.js");
                }
                else {
                    await import("../../Shaders/fluidRenderingStandardBlur.fragment.js");
                }
            });
            kernelBlurYPostprocess.samples = this._samples;
            kernelBlurYPostprocess.onApplyObservable.add((effect) => {
                effect.setInt("filterSize", this.blurFilterSize);
                effect.setFloat2("blurDir", 0, 1 / this._blurTextureSizeY);
                this._postProcessRunningIndex++;
            });
            kernelBlurYPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurYPostprocess._textures.forEach((rt) => {
                    rt.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurYPostprocess);
            kernelBlurXPostprocess.autoClear = false;
            kernelBlurYPostprocess.autoClear = false;
            const blurList = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                blurList[i] = i & 1 ? kernelBlurYPostprocess : kernelBlurXPostprocess;
            }
            return [rtBlur, texture, blurList];
        }
        else {
            const uniforms = ["maxFilterSize", "blurDir", "projectedParticleConstant", "depthThreshold"];
            const kernelBlurXPostprocess = new PostProcess("BilateralBlurX", "fluidRenderingBilateralBlur", uniforms, null, 1, null, 1, engine, true, null, textureType, undefined, undefined, undefined, textureFormat, this._shaderLanguage, async () => {
                if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../../ShadersWGSL/fluidRenderingBilateralBlur.fragment.js");
                }
                else {
                    await import("../../Shaders/fluidRenderingBilateralBlur.fragment.js");
                }
            });
            kernelBlurXPostprocess.samples = this._samples;
            kernelBlurXPostprocess.externalTextureSamplerBinding = true;
            kernelBlurXPostprocess.onApplyObservable.add((effect) => {
                if (this._postProcessRunningIndex === 0) {
                    effect.setTexture("textureSampler", textureBlurSource);
                }
                else {
                    effect._bindTexture("textureSampler", kernelBlurXPostprocess.inputTexture.texture);
                }
                effect.setInt("maxFilterSize", this.blurMaxFilterSize);
                effect.setFloat2("blurDir", 1 / this._blurTextureSizeX, 0);
                effect.setFloat("projectedParticleConstant", this._getProjectedParticleConstant());
                effect.setFloat("depthThreshold", this._getDepthThreshold());
                this._postProcessRunningIndex++;
            });
            kernelBlurXPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurXPostprocess._textures.forEach((rt) => {
                    rt.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurXPostprocess);
            const kernelBlurYPostprocess = new PostProcess("BilateralBlurY", "fluidRenderingBilateralBlur", uniforms, null, 1, null, 1, engine, true, null, textureType, undefined, undefined, undefined, textureFormat, this._shaderLanguage, async () => {
                if (this.shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                    await import("../../ShadersWGSL/fluidRenderingBilateralBlur.fragment.js");
                }
                else {
                    await import("../../Shaders/fluidRenderingBilateralBlur.fragment.js");
                }
            });
            kernelBlurYPostprocess.samples = this._samples;
            kernelBlurYPostprocess.onApplyObservable.add((effect) => {
                effect.setInt("maxFilterSize", this.blurMaxFilterSize);
                effect.setFloat2("blurDir", 0, 1 / this._blurTextureSizeY);
                effect.setFloat("projectedParticleConstant", this._getProjectedParticleConstant());
                effect.setFloat("depthThreshold", this._getDepthThreshold());
                this._postProcessRunningIndex++;
            });
            kernelBlurYPostprocess.onSizeChangedObservable.add(() => {
                kernelBlurYPostprocess._textures.forEach((rt) => {
                    rt.texture.wrapU = Texture.CLAMP_ADDRESSMODE;
                    rt.texture.wrapV = Texture.CLAMP_ADDRESSMODE;
                });
            });
            this._fixReusablePostProcess(kernelBlurYPostprocess);
            kernelBlurXPostprocess.autoClear = false;
            kernelBlurYPostprocess.autoClear = false;
            const blurList = [];
            for (let i = 0; i < this._blurNumIterations * 2; ++i) {
                blurList[i] = i & 1 ? kernelBlurYPostprocess : kernelBlurXPostprocess;
            }
            return [rtBlur, texture, blurList];
        }
    }
    _fixReusablePostProcess(pp) {
        if (!pp.isReusable()) {
            return;
        }
        pp.onActivateObservable.add(() => {
            // undo what calling activate() does which will make sure we will retrieve the right texture when getting the input for the post process
            pp._currentRenderTextureInd = (pp._currentRenderTextureInd + 1) % 2;
        });
        pp.onApplyObservable.add(() => {
            // now we can advance to the next texture
            pp._currentRenderTextureInd = (pp._currentRenderTextureInd + 1) % 2;
        });
    }
    _getProjectedParticleConstant() {
        return (this.blurFilterSize * this.particleSize * 0.05 * (this._height / 2)) / Math.tan((this._camera?.fov ?? (45 * Math.PI) / 180) / 2);
    }
    _getDepthThreshold() {
        return (this.particleSize / 2) * this.blurDepthScale;
    }
    dispose() {
        if (this.onDisposeObservable.hasObservers()) {
            this.onDisposeObservable.notifyObservers(this);
        }
        this.onDisposeObservable.clear();
        this._rt?.dispose();
        this._rt = null;
        this._texture?.dispose();
        this._texture = null;
        this._rtBlur?.dispose();
        this._rtBlur = null;
        this._textureBlurred?.dispose();
        this._textureBlurred = null;
        if (this._blurPostProcesses) {
            this._blurPostProcesses[0].dispose();
            this._blurPostProcesses[1].dispose();
        }
        this._blurPostProcesses = null;
    }
}
//# sourceMappingURL=fluidRenderingTextures.js.map