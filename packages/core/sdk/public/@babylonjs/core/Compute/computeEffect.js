import { Logger } from "../Misc/logger.js";
import { Observable } from "../Misc/observable.js";
import { GetDOMTextContent, IsWindowObjectExist } from "../Misc/domManagement.js";
import { Finalize, Initialize, PreProcess } from "../Engines/Processors/shaderProcessor.js";
import { ShaderStore } from "../Engines/shaderStore.js";
import { _retryWithInterval } from "../Misc/timingTools.js";
/**
 * Effect wrapping a compute shader and let execute (dispatch) the shader
 */
export class ComputeEffect {
    /**
     * Creates a compute effect that can be used to execute a compute shader
     * @param baseName Name of the effect
     * @param options Set of all options to create the effect
     * @param engine The engine the effect is created for
     * @param key Effect Key identifying uniquely compiled shader variants
     */
    constructor(baseName, options, engine, key = "") {
        /**
         * String container all the define statements that should be set on the shader.
         */
        this.defines = "";
        /**
         * Callback that will be called when the shader is compiled.
         */
        this.onCompiled = null;
        /**
         * Callback that will be called if an error occurs during shader compilation.
         */
        this.onError = null;
        /**
         * Unique ID of the effect.
         */
        this.uniqueId = 0;
        /**
         * Observable that will be called when the shader is compiled.
         * It is recommended to use executeWhenCompile() or to make sure that scene.isReady() is called to get this observable raised.
         */
        this.onCompileObservable = new Observable();
        /**
         * Observable that will be called if an error occurs during shader compilation.
         */
        this.onErrorObservable = new Observable();
        /**
         * Observable that will be called when effect is bound.
         */
        this.onBindObservable = new Observable();
        /**
         * @internal
         * Specifies if the effect was previously ready
         */
        this._wasPreviouslyReady = false;
        this._isReady = false;
        this._compilationError = "";
        /** @internal */
        this._key = "";
        this._computeSourceCodeOverride = "";
        /** @internal */
        this._pipelineContext = null;
        /** @internal */
        this._computeSourceCode = "";
        this._rawComputeSourceCode = "";
        this._shaderLanguage = 1 /* ShaderLanguage.WGSL */;
        this.name = baseName;
        this._key = key;
        this._engine = engine;
        this.uniqueId = ComputeEffect._UniqueIdSeed++;
        this.defines = options.defines ?? "";
        this.onError = options.onError;
        this.onCompiled = options.onCompiled;
        this._entryPoint = options.entryPoint ?? "main";
        this._shaderStore = ShaderStore.GetShadersStore(this._shaderLanguage);
        this._shaderRepository = ShaderStore.GetShadersRepository(this._shaderLanguage);
        this._includeShaderStore = ShaderStore.GetIncludesShadersStore(this._shaderLanguage);
        let computeSource;
        const hostDocument = IsWindowObjectExist() ? this._engine.getHostDocument() : null;
        if (typeof baseName === "string") {
            computeSource = baseName;
        }
        else if (baseName.computeSource) {
            computeSource = "source:" + baseName.computeSource;
        }
        else if (baseName.computeElement) {
            computeSource = hostDocument?.getElementById(baseName.computeElement) || baseName.computeElement;
        }
        else {
            computeSource = baseName.compute || baseName;
        }
        const processorOptions = {
            defines: this.defines.split("\n"),
            indexParameters: undefined,
            isFragment: false,
            shouldUseHighPrecisionShader: false,
            processor: null,
            supportsUniformBuffers: this._engine.supportsUniformBuffers,
            shadersRepository: this._shaderRepository,
            includesShadersStore: this._includeShaderStore,
            version: (this._engine.version * 100).toString(),
            platformName: this._engine.shaderPlatformName,
            processingContext: null,
            isNDCHalfZRange: this._engine.isNDCHalfZRange,
            useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
            processCodeAfterIncludes: (shaderType, code, defines) => {
                if (!defines) {
                    return code;
                }
                // We need to convert #define key value to a const
                for (const define of defines) {
                    const keyValue = define.replace("#define", "").replace(";", "").trim();
                    const split = keyValue.split(" ");
                    if (split.length === 2) {
                        const key = split[0];
                        const value = split[1];
                        if (!isNaN(parseInt(value)) || !isNaN(parseFloat(value))) {
                            code = `const ${key} = ${value};\n` + code;
                        }
                    }
                }
                return code;
            },
        };
        this._loadShader(computeSource, "Compute", "", (computeCode) => {
            Initialize(processorOptions);
            PreProcess(computeCode, processorOptions, (migratedComputeCode) => {
                this._rawComputeSourceCode = computeCode;
                if (options.processFinalCode) {
                    migratedComputeCode = options.processFinalCode(migratedComputeCode);
                }
                const finalShaders = Finalize(migratedComputeCode, "", processorOptions);
                this._useFinalCode(finalShaders.vertexCode, baseName);
            }, this._engine);
        });
    }
    _useFinalCode(migratedCommputeCode, baseName) {
        if (baseName) {
            const compute = baseName.computeElement || baseName.compute || baseName.spectorName || baseName;
            this._computeSourceCode = "//#define SHADER_NAME compute:" + compute + "\n" + migratedCommputeCode;
        }
        else {
            this._computeSourceCode = migratedCommputeCode;
        }
        this._prepareEffect();
    }
    /**
     * Unique key for this effect
     */
    get key() {
        return this._key;
    }
    /**
     * If the effect has been compiled and prepared.
     * @returns if the effect is compiled and prepared.
     */
    isReady() {
        try {
            return this._isReadyInternal();
        }
        catch {
            return false;
        }
    }
    _isReadyInternal() {
        if (this._isReady) {
            return true;
        }
        if (this._pipelineContext) {
            return this._pipelineContext.isReady;
        }
        return false;
    }
    /**
     * The engine the effect was initialized with.
     * @returns the engine.
     */
    getEngine() {
        return this._engine;
    }
    /**
     * The pipeline context for this effect
     * @returns the associated pipeline context
     */
    getPipelineContext() {
        return this._pipelineContext;
    }
    /**
     * The error from the last compilation.
     * @returns the error string.
     */
    getCompilationError() {
        return this._compilationError;
    }
    /**
     * Adds a callback to the onCompiled observable and call the callback immediately if already ready.
     * @param func The callback to be used.
     */
    executeWhenCompiled(func) {
        if (this.isReady()) {
            func(this);
            return;
        }
        this.onCompileObservable.add((effect) => {
            func(effect);
        });
        if (!this._pipelineContext || this._pipelineContext.isAsync) {
            this._checkIsReady(null);
        }
    }
    _checkIsReady(previousPipelineContext) {
        _retryWithInterval(() => this._isReadyInternal(), () => {
            // no-op, all work is done in _isReadyInternal
        }, (e) => {
            this._processCompilationErrors(e, previousPipelineContext);
        }, undefined, undefined, false);
    }
    _loadShader(shader, key, optionalKey, callback) {
        if (typeof HTMLElement !== "undefined") {
            // DOM element ?
            if (shader instanceof HTMLElement) {
                const shaderCode = GetDOMTextContent(shader);
                callback(shaderCode);
                return;
            }
        }
        // Direct source ?
        if (shader.substring(0, 7) === "source:") {
            callback(shader.substring(7));
            return;
        }
        // Base64 encoded ?
        if (shader.substring(0, 7) === "base64:") {
            const shaderBinary = window.atob(shader.substring(7));
            callback(shaderBinary);
            return;
        }
        // Is in local store ?
        if (this._shaderStore[shader + key + "Shader"]) {
            callback(this._shaderStore[shader + key + "Shader"]);
            return;
        }
        if (optionalKey && this._shaderStore[shader + optionalKey + "Shader"]) {
            callback(this._shaderStore[shader + optionalKey + "Shader"]);
            return;
        }
        let shaderUrl;
        if (shader[0] === "." || shader[0] === "/" || shader.indexOf("http") > -1) {
            shaderUrl = shader;
        }
        else {
            shaderUrl = this._shaderRepository + shader;
        }
        this._engine._loadFile(shaderUrl + "." + key.toLowerCase() + ".fx", callback);
    }
    /**
     * Gets the compute shader source code of this effect
     */
    get computeSourceCode() {
        return this._computeSourceCodeOverride ? this._computeSourceCodeOverride : (this._pipelineContext?._getComputeShaderCode() ?? this._computeSourceCode);
    }
    /**
     * Gets the compute shader source code before it has been processed by the preprocessor
     */
    get rawComputeSourceCode() {
        return this._rawComputeSourceCode;
    }
    /**
     * Prepares the effect
     * @internal
     */
    _prepareEffect() {
        const defines = this.defines;
        const previousPipelineContext = this._pipelineContext;
        this._isReady = false;
        try {
            const engine = this._engine;
            this._pipelineContext = engine.createComputePipelineContext();
            this._pipelineContext._name = this._key;
            engine._prepareComputePipelineContext(this._pipelineContext, this._computeSourceCodeOverride ? this._computeSourceCodeOverride : this._computeSourceCode, this._rawComputeSourceCode, this._computeSourceCodeOverride ? null : defines, this._entryPoint);
            engine._executeWhenComputeStateIsCompiled(this._pipelineContext, (messages) => {
                if (messages && messages.numErrors > 0) {
                    this._processCompilationErrors(messages, previousPipelineContext);
                    return;
                }
                this._compilationError = "";
                this._isReady = true;
                if (this.onCompiled) {
                    this.onCompiled(this);
                }
                this.onCompileObservable.notifyObservers(this);
                this.onCompileObservable.clear();
                if (previousPipelineContext) {
                    this.getEngine()._deleteComputePipelineContext(previousPipelineContext);
                }
            });
            if (this._pipelineContext.isAsync) {
                this._checkIsReady(previousPipelineContext);
            }
        }
        catch (e) {
            this._processCompilationErrors(e, previousPipelineContext);
        }
    }
    _processCompilationErrors(e, previousPipelineContext = null) {
        this._compilationError = "";
        Logger.Error("Unable to compile compute effect:");
        if (this.defines) {
            Logger.Error("Defines:\n" + this.defines);
        }
        if (ComputeEffect.LogShaderCodeOnCompilationError) {
            const code = this._pipelineContext?._getComputeShaderCode();
            if (code) {
                Logger.Error("Compute code:");
                Logger.Error(code);
            }
        }
        if (typeof e === "string") {
            this._compilationError = e;
            Logger.Error("Error: " + this._compilationError);
        }
        else {
            for (const message of e.messages) {
                let msg = "";
                if (message.line !== undefined) {
                    msg += "Line " + message.line + ", ";
                }
                if (message.offset !== undefined) {
                    msg += "Offset " + message.offset + ", ";
                }
                if (message.length !== undefined) {
                    msg += "Length " + message.length + ", ";
                }
                msg += message.type + ": " + message.text;
                if (this._compilationError) {
                    this._compilationError += "\n";
                }
                this._compilationError += msg;
                Logger.Error(msg);
            }
        }
        if (previousPipelineContext) {
            this._pipelineContext = previousPipelineContext;
            this._isReady = true;
        }
        if (this.onError) {
            this.onError(this, this._compilationError);
        }
        this.onErrorObservable.notifyObservers(this);
    }
    /**
     * Release all associated resources.
     **/
    dispose() {
        if (this._pipelineContext) {
            this._pipelineContext.dispose();
        }
        this._engine._releaseComputeEffect(this);
    }
    /**
     * This function will add a new compute shader to the shader store
     * @param name the name of the shader
     * @param computeShader compute shader content
     */
    static RegisterShader(name, computeShader) {
        ShaderStore.GetShadersStore(1 /* ShaderLanguage.WGSL */)[`${name}ComputeShader`] = computeShader;
    }
}
ComputeEffect._UniqueIdSeed = 0;
/**
 * Enable logging of the shader code when a compilation error occurs
 */
ComputeEffect.LogShaderCodeOnCompilationError = true;
//# sourceMappingURL=computeEffect.js.map