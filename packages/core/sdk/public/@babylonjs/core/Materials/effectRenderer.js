import { VertexBuffer } from "../Buffers/buffer.js";
import { Viewport } from "../Maths/math.viewport.js";

import { Observable } from "../Misc/observable.js";
import { Effect } from "./effect.js";
import { DrawWrapper } from "./drawWrapper.js";
// Prevents ES6 issue if not imported.
import "../Shaders/postprocess.vertex.js";
// Fullscreen quad buffers by default.
const defaultOptions = {
    positions: [1, 1, -1, 1, -1, -1, 1, -1],
    indices: [0, 1, 2, 0, 2, 3],
};
/**
 * Helper class to render one or more effects.
 * You can access the previous rendering in your shader by declaring a sampler named textureSampler
 */
export class EffectRenderer {
    /**
     * Creates an effect renderer
     * @param engine the engine to use for rendering
     * @param options defines the options of the effect renderer
     */
    constructor(engine, options = defaultOptions) {
        this._fullscreenViewport = new Viewport(0, 0, 1, 1);
        const positions = options.positions ?? defaultOptions.positions;
        const indices = options.indices ?? defaultOptions.indices;
        this.engine = engine;
        this._vertexBuffers = {
            [VertexBuffer.PositionKind]: new VertexBuffer(engine, positions, VertexBuffer.PositionKind, false, false, 2),
        };
        this._indexBuffer = engine.createIndexBuffer(indices);
        this._onContextRestoredObserver = engine.onContextRestoredObservable.add(() => {
            this._indexBuffer = engine.createIndexBuffer(indices);
            for (const key in this._vertexBuffers) {
                const vertexBuffer = this._vertexBuffers[key];
                vertexBuffer._rebuild();
            }
        });
    }
    /**
     * Sets the current viewport in normalized coordinates 0-1
     * @param viewport Defines the viewport to set (defaults to 0 0 1 1)
     */
    setViewport(viewport = this._fullscreenViewport) {
        this.engine.setViewport(viewport);
    }
    /**
     * Binds the embedded attributes buffer to the effect.
     * @param effect Defines the effect to bind the attributes for
     */
    bindBuffers(effect) {
        this.engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
    }
    /**
     * Sets the current effect wrapper to use during draw.
     * The effect needs to be ready before calling this api.
     * This also sets the default full screen position attribute.
     * @param effectWrapper Defines the effect to draw with
     */
    applyEffectWrapper(effectWrapper) {
        this.engine.setState(true);
        this.engine.depthCullingState.depthTest = false;
        this.engine.stencilState.stencilTest = false;
        this.engine.enableEffect(effectWrapper.drawWrapper);
        this.bindBuffers(effectWrapper.effect);
        effectWrapper.onApplyObservable.notifyObservers({});
    }
    /**
     * Saves engine states
     */
    saveStates() {
        this._savedStateDepthTest = this.engine.depthCullingState.depthTest;
        this._savedStateStencilTest = this.engine.stencilState.stencilTest;
    }
    /**
     * Restores engine states
     */
    restoreStates() {
        this.engine.depthCullingState.depthTest = this._savedStateDepthTest;
        this.engine.stencilState.stencilTest = this._savedStateStencilTest;
    }
    /**
     * Draws a full screen quad.
     */
    draw() {
        this.engine.drawElementsType(0, 0, 6);
    }
    _isRenderTargetTexture(texture) {
        return texture.renderTarget !== undefined;
    }
    /**
     * renders one or more effects to a specified texture
     * @param effectWrapper the effect to renderer
     * @param outputTexture texture to draw to, if null it will render to the currently bound frame buffer
     */
    render(effectWrapper, outputTexture = null) {
        // Ensure effect is ready
        if (!effectWrapper.effect.isReady()) {
            return;
        }
        this.saveStates();
        // Reset state
        this.setViewport();
        const out = outputTexture === null ? null : this._isRenderTargetTexture(outputTexture) ? outputTexture.renderTarget : outputTexture;
        if (out) {
            this.engine.bindFramebuffer(out);
        }
        this.applyEffectWrapper(effectWrapper);
        this.draw();
        if (out) {
            this.engine.unBindFramebuffer(out);
        }
        this.restoreStates();
    }
    /**
     * Disposes of the effect renderer
     */
    dispose() {
        const vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            delete this._vertexBuffers[VertexBuffer.PositionKind];
        }
        if (this._indexBuffer) {
            this.engine._releaseBuffer(this._indexBuffer);
        }
        if (this._onContextRestoredObserver) {
            this.engine.onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
    }
}
/**
 * Wraps an effect to be used for rendering
 */
export class EffectWrapper {
    /**
     * Registers a shader code processing with an effect wrapper name.
     * @param effectWrapperName name of the effect wrapper. Use null for the fallback shader code processing. This is the shader code processing that will be used in case no specific shader code processing has been associated to an effect wrapper name
     * @param customShaderCodeProcessing shader code processing to associate to the effect wrapper name
     */
    static RegisterShaderCodeProcessing(effectWrapperName, customShaderCodeProcessing) {
        if (!customShaderCodeProcessing) {
            delete EffectWrapper._CustomShaderCodeProcessing[effectWrapperName ?? ""];
            return;
        }
        EffectWrapper._CustomShaderCodeProcessing[effectWrapperName ?? ""] = customShaderCodeProcessing;
    }
    static _GetShaderCodeProcessing(effectWrapperName) {
        return EffectWrapper._CustomShaderCodeProcessing[effectWrapperName] ?? EffectWrapper._CustomShaderCodeProcessing[""];
    }
    /**
     * Gets or sets the name of the effect wrapper
     */
    get name() {
        return this.options.name;
    }
    set name(value) {
        this.options.name = value;
    }
    /**
     * Get a value indicating if the effect is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    isReady() {
        return this._drawWrapper.effect?.isReady() ?? false;
    }
    /**
     * Get the draw wrapper associated with the effect wrapper
     * @returns the draw wrapper associated with the effect wrapper
     */
    get drawWrapper() {
        return this._drawWrapper;
    }
    /**
     * The underlying effect
     */
    get effect() {
        return this._drawWrapper.effect;
    }
    set effect(effect) {
        this._drawWrapper.effect = effect;
    }
    /**
     * Creates an effect to be rendered
     * @param creationOptions options to create the effect
     */
    constructor(creationOptions) {
        /**
         * Type of alpha mode to use when applying the effect (default: Engine.ALPHA_DISABLE). Used only if useAsPostProcess is true.
         */
        this.alphaMode = 0;
        /**
         * Executed when the effect is created
         * @returns effect that was created for this effect wrapper
         */
        this.onEffectCreatedObservable = new Observable(undefined, true);
        /**
         * Event that is fired (only when the EffectWrapper is used with an EffectRenderer) right before the effect is drawn (should be used to update uniforms)
         */
        this.onApplyObservable = new Observable();
        this._shadersLoaded = false;
        /** @internal */
        this._webGPUReady = false;
        this._importPromises = [];
        this.options = {
            ...creationOptions,
            name: creationOptions.name || "effectWrapper",
            engine: creationOptions.engine,
            uniforms: creationOptions.uniforms || creationOptions.uniformNames || [],
            uniformNames: undefined,
            samplers: creationOptions.samplers || creationOptions.samplerNames || [],
            samplerNames: undefined,
            attributeNames: creationOptions.attributeNames || ["position"],
            uniformBuffers: creationOptions.uniformBuffers || [],
            defines: creationOptions.defines || "",
            useShaderStore: creationOptions.useShaderStore || false,
            vertexUrl: creationOptions.vertexUrl || creationOptions.vertexShader || "postprocess",
            vertexShader: undefined,
            fragmentShader: creationOptions.fragmentShader || "pass",
            indexParameters: creationOptions.indexParameters,
            blockCompilation: creationOptions.blockCompilation || false,
            shaderLanguage: creationOptions.shaderLanguage || 0 /* ShaderLanguage.GLSL */,
            onCompiled: creationOptions.onCompiled || undefined,
            extraInitializations: creationOptions.extraInitializations || undefined,
            extraInitializationsAsync: creationOptions.extraInitializationsAsync || undefined,
            useAsPostProcess: creationOptions.useAsPostProcess ?? false,
        };
        this.options.uniformNames = this.options.uniforms;
        this.options.samplerNames = this.options.samplers;
        this.options.vertexShader = this.options.vertexUrl;
        if (this.options.useAsPostProcess) {
            if (this.options.samplers.indexOf("textureSampler") === -1) {
                this.options.samplers.push("textureSampler");
            }
            if (this.options.uniforms.indexOf("scale") === -1) {
                this.options.uniforms.push("scale");
            }
        }
        if (creationOptions.vertexUrl || creationOptions.vertexShader) {
            this._shaderPath = {
                vertexSource: this.options.vertexShader,
            };
        }
        else {
            if (!this.options.useAsPostProcess) {
                this.options.uniforms.push("scale");
                this.onApplyObservable.add(() => {
                    this.effect.setFloat2("scale", 1, 1);
                });
            }
            this._shaderPath = {
                vertex: this.options.vertexShader,
            };
        }
        this._shaderPath.fragmentSource = this.options.fragmentShader;
        this._shaderPath.spectorName = this.options.name;
        if (this.options.useShaderStore) {
            this._shaderPath.fragment = this._shaderPath.fragmentSource;
            if (!this._shaderPath.vertex) {
                this._shaderPath.vertex = this._shaderPath.vertexSource;
            }
            delete this._shaderPath.fragmentSource;
            delete this._shaderPath.vertexSource;
        }
        this.onApplyObservable.add(() => {
            this.bind();
        });
        if (!this.options.useShaderStore) {
            this._onContextRestoredObserver = this.options.engine.onContextRestoredObservable.add(() => {
                this.effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
                this.effect._prepareEffect();
            });
        }
        this._drawWrapper = new DrawWrapper(this.options.engine);
        this._webGPUReady = this.options.shaderLanguage === 1 /* ShaderLanguage.WGSL */;
        const defines = Array.isArray(this.options.defines) ? this.options.defines.join("\n") : this.options.defines;
        this._postConstructor(this.options.blockCompilation, defines, this.options.extraInitializations);
    }
    _gatherImports(useWebGPU = false, list) {
        if (!this.options.useAsPostProcess) {
            return;
        }
        // this._webGPUReady is used to detect when an effect wrapper is intended to be used with WebGPU
        if (useWebGPU && this._webGPUReady) {
            list.push(Promise.all([import("../ShadersWGSL/postprocess.vertex.js")]));
        }
        else {
            list.push(Promise.all([import("../Shaders/postprocess.vertex.js")]));
        }
    }
    /** @internal */
    _postConstructor(blockCompilation, defines = null, extraInitializations, importPromises) {
        this._importPromises.length = 0;
        if (importPromises) {
            this._importPromises.push(...importPromises);
        }
        const useWebGPU = this.options.engine.isWebGPU && !EffectWrapper.ForceGLSL;
        this._gatherImports(useWebGPU, this._importPromises);
        if (extraInitializations !== undefined) {
            extraInitializations(useWebGPU, this._importPromises);
        }
        if (useWebGPU && this._webGPUReady) {
            this.options.shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        }
        if (!blockCompilation) {
            this.updateEffect(defines);
        }
    }
    /**
     * Updates the effect with the current effect wrapper compile time values and recompiles the shader.
     * @param defines Define statements that should be added at the beginning of the shader. (default: null)
     * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
     * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param onCompiled Called when the shader has been compiled.
     * @param onError Called if there is an error when compiling a shader.
     * @param vertexUrl The url of the vertex shader to be used (default: the one given at construction time)
     * @param fragmentUrl The url of the fragment shader to be used (default: the one given at construction time)
     */
    updateEffect(defines = null, uniforms = null, samplers = null, indexParameters, onCompiled, onError, vertexUrl, fragmentUrl) {
        const customShaderCodeProcessing = EffectWrapper._GetShaderCodeProcessing(this.name);
        if (customShaderCodeProcessing?.defineCustomBindings) {
            const newUniforms = uniforms?.slice() ?? [];
            newUniforms.push(...this.options.uniforms);
            const newSamplers = samplers?.slice() ?? [];
            newSamplers.push(...this.options.samplers);
            defines = customShaderCodeProcessing.defineCustomBindings(this.name, defines, newUniforms, newSamplers);
            uniforms = newUniforms;
            samplers = newSamplers;
        }
        this.options.defines = defines || "";
        const waitImportsLoaded = this._shadersLoaded || this._importPromises.length === 0
            ? undefined
            : async () => {
                await Promise.all(this._importPromises);
                this._shadersLoaded = true;
            };
        let extraInitializationsAsync;
        if (this.options.extraInitializationsAsync) {
            extraInitializationsAsync = async () => {
                waitImportsLoaded?.();
                await this.options.extraInitializationsAsync;
            };
        }
        else {
            extraInitializationsAsync = waitImportsLoaded;
        }
        if (this.options.useShaderStore) {
            this._drawWrapper.effect = this.options.engine.createEffect({ vertex: vertexUrl ?? this._shaderPath.vertex, fragment: fragmentUrl ?? this._shaderPath.fragment }, {
                attributes: this.options.attributeNames,
                uniformsNames: uniforms || this.options.uniforms,
                uniformBuffersNames: this.options.uniformBuffers,
                samplers: samplers || this.options.samplers,
                defines: defines !== null ? defines : "",
                fallbacks: null,
                onCompiled: onCompiled ?? this.options.onCompiled,
                onError: onError ?? null,
                indexParameters: indexParameters || this.options.indexParameters,
                processCodeAfterIncludes: customShaderCodeProcessing?.processCodeAfterIncludes
                    ? (shaderType, code) => customShaderCodeProcessing.processCodeAfterIncludes(this.name, shaderType, code)
                    : null,
                processFinalCode: customShaderCodeProcessing?.processFinalCode
                    ? (shaderType, code) => customShaderCodeProcessing.processFinalCode(this.name, shaderType, code)
                    : null,
                shaderLanguage: this.options.shaderLanguage,
                extraInitializationsAsync,
            }, this.options.engine);
        }
        else {
            this._drawWrapper.effect = new Effect(this._shaderPath, this.options.attributeNames, uniforms || this.options.uniforms, samplers || this.options.samplerNames, this.options.engine, defines, undefined, onCompiled || this.options.onCompiled, undefined, undefined, undefined, this.options.shaderLanguage, extraInitializationsAsync);
        }
        this.onEffectCreatedObservable.notifyObservers(this._drawWrapper.effect);
    }
    /**
     * Binds the data to the effect.
     */
    bind() {
        if (this.options.useAsPostProcess) {
            this.options.engine.setAlphaMode(this.alphaMode);
            this.drawWrapper.effect.setFloat2("scale", 1, 1);
        }
        EffectWrapper._GetShaderCodeProcessing(this.name)?.bindCustomBindings?.(this.name, this._drawWrapper.effect);
    }
    /**
     * Disposes of the effect wrapper
     * @param _ignored kept for backward compatibility
     */
    dispose(_ignored = false) {
        if (this._onContextRestoredObserver) {
            this.effect.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
        this.onEffectCreatedObservable.clear();
        this._drawWrapper.dispose(true);
    }
}
/**
 * Force code to compile to glsl even on WebGPU engines.
 * False by default. This is mostly meant for backward compatibility.
 */
EffectWrapper.ForceGLSL = false;
EffectWrapper._CustomShaderCodeProcessing = {};
//# sourceMappingURL=effectRenderer.js.map