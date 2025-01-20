import { Observable } from "../Misc/observable.js";

import { Logger } from "../Misc/logger.js";
import { ShaderStore as EngineShaderStore } from "../Engines/shaderStore.js";
import { _processShaderCode, getCachedPipeline, createAndPreparePipelineContext, resetCachedPipeline } from "./effect.functions.js";
import { _retryWithInterval } from "../Misc/timingTools.js";
/**
 * Effect containing vertex and fragment shader that can be executed on an object.
 */
export class Effect {
    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    static get ShadersRepository() {
        return EngineShaderStore.ShadersRepository;
    }
    static set ShadersRepository(repo) {
        EngineShaderStore.ShadersRepository = repo;
    }
    /**
     * Gets a boolean indicating that the effect was already disposed
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Observable that will be called when effect is bound.
     */
    get onBindObservable() {
        if (!this._onBindObservable) {
            this._onBindObservable = new Observable();
        }
        return this._onBindObservable;
    }
    /**
     * Gets the shader language type used to write vertex and fragment source code.
     */
    get shaderLanguage() {
        return this._shaderLanguage;
    }
    /**
     * Instantiates an effect.
     * An effect can be used to create/manage/execute vertex and fragment shaders.
     * @param baseName Name of the effect.
     * @param attributesNamesOrOptions List of attribute names that will be passed to the shader or set of all options to create the effect.
     * @param uniformsNamesOrEngine List of uniform variable names that will be passed to the shader or the engine that will be used to render effect.
     * @param samplers List of sampler variables that will be passed to the shader.
     * @param engine Engine to be used to render the effect
     * @param defines Define statements to be added to the shader.
     * @param fallbacks Possible fallbacks for this effect to improve performance when needed.
     * @param onCompiled Callback that will be called when the shader is compiled.
     * @param onError Callback that will be called if an error occurs during shader compilation.
     * @param indexParameters Parameters to be used with Babylons include syntax to iterate over an array (eg. \{lights: 10\})
     * @param key Effect Key identifying uniquely compiled shader variants
     * @param shaderLanguage the language the shader is written in (default: GLSL)
     * @param extraInitializationsAsync additional async code to run before preparing the effect
     */
    constructor(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers = null, engine, defines = null, fallbacks = null, onCompiled = null, onError = null, indexParameters, key = "", shaderLanguage = 0 /* ShaderLanguage.GLSL */, extraInitializationsAsync) {
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
         * Callback that will be called when effect is bound.
         */
        this.onBind = null;
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
        /** @internal */
        this._onBindObservable = null;
        this._isDisposed = false;
        /** @internal */
        this._refCount = 1;
        /** @internal */
        this._bonesComputationForcedToCPU = false;
        /** @internal */
        this._uniformBuffersNames = {};
        /** @internal */
        this._multiTarget = false;
        /** @internal */
        this._samplers = {};
        this._isReady = false;
        this._compilationError = "";
        this._allFallbacksProcessed = false;
        /** @internal */
        this._uniforms = {};
        /**
         * Key for the effect.
         * @internal
         */
        this._key = "";
        this._fallbacks = null;
        this._vertexSourceCodeOverride = "";
        this._fragmentSourceCodeOverride = "";
        this._transformFeedbackVaryings = null;
        /**
         * Compiled shader to webGL program.
         * @internal
         */
        this._pipelineContext = null;
        /** @internal */
        this._vertexSourceCode = "";
        /** @internal */
        this._fragmentSourceCode = "";
        /** @internal */
        this._vertexSourceCodeBeforeMigration = "";
        /** @internal */
        this._fragmentSourceCodeBeforeMigration = "";
        /** @internal */
        this._rawVertexSourceCode = "";
        /** @internal */
        this._rawFragmentSourceCode = "";
        this._processCodeAfterIncludes = undefined;
        this._processFinalCode = null;
        this.name = baseName;
        this._key = key;
        const pipelineName = this._key.replace(/\r/g, "").replace(/\n/g, "|");
        let cachedPipeline = undefined;
        if (attributesNamesOrOptions.attributes) {
            const options = attributesNamesOrOptions;
            this._engine = uniformsNamesOrEngine;
            this._attributesNames = options.attributes;
            this._uniformsNames = options.uniformsNames.concat(options.samplers);
            this._samplerList = options.samplers.slice();
            this.defines = options.defines;
            this.onError = options.onError;
            this.onCompiled = options.onCompiled;
            this._fallbacks = options.fallbacks;
            this._indexParameters = options.indexParameters;
            this._transformFeedbackVaryings = options.transformFeedbackVaryings || null;
            this._multiTarget = !!options.multiTarget;
            this._shaderLanguage = options.shaderLanguage ?? 0 /* ShaderLanguage.GLSL */;
            if (options.uniformBuffersNames) {
                this._uniformBuffersNamesList = options.uniformBuffersNames.slice();
                for (let i = 0; i < options.uniformBuffersNames.length; i++) {
                    this._uniformBuffersNames[options.uniformBuffersNames[i]] = i;
                }
            }
            this._processFinalCode = options.processFinalCode ?? null;
            this._processCodeAfterIncludes = options.processCodeAfterIncludes ?? undefined;
            cachedPipeline = options.existingPipelineContext;
        }
        else {
            this._engine = engine;
            this.defines = defines == null ? "" : defines;
            this._uniformsNames = uniformsNamesOrEngine.concat(samplers);
            this._samplerList = samplers ? samplers.slice() : [];
            this._attributesNames = attributesNamesOrOptions;
            this._uniformBuffersNamesList = [];
            this._shaderLanguage = shaderLanguage;
            this.onError = onError;
            this.onCompiled = onCompiled;
            this._indexParameters = indexParameters;
            this._fallbacks = fallbacks;
        }
        // Use the cache if we can. For now, WebGL2 only.
        if (this._engine.shaderPlatformName === "WEBGL2") {
            cachedPipeline = getCachedPipeline(pipelineName, this._engine._gl) ?? cachedPipeline;
        }
        this._attributeLocationByName = {};
        this.uniqueId = Effect._UniqueIdSeed++;
        if (!cachedPipeline) {
            this._processShaderCodeAsync(null, false, null, extraInitializationsAsync);
        }
        else {
            this._pipelineContext = cachedPipeline;
            this._pipelineContext.setEngine(this._engine);
            this._onRenderingStateCompiled(this._pipelineContext);
            // rebuildRebind for spector
            if (this._pipelineContext.program) {
                this._pipelineContext.program.__SPECTOR_rebuildProgram = this._rebuildProgram.bind(this);
            }
        }
    }
    /** @internal */
    async _processShaderCodeAsync(shaderProcessor = null, keepExistingPipelineContext = false, shaderProcessingContext = null, extraInitializationsAsync) {
        if (extraInitializationsAsync) {
            await extraInitializationsAsync();
        }
        this._processingContext = shaderProcessingContext || this._engine._getShaderProcessingContext(this._shaderLanguage, false);
        const processorOptions = {
            defines: this.defines.split("\n"),
            indexParameters: this._indexParameters,
            isFragment: false,
            shouldUseHighPrecisionShader: this._engine._shouldUseHighPrecisionShader,
            processor: shaderProcessor ?? this._engine._getShaderProcessor(this._shaderLanguage),
            supportsUniformBuffers: this._engine.supportsUniformBuffers,
            shadersRepository: EngineShaderStore.GetShadersRepository(this._shaderLanguage),
            includesShadersStore: EngineShaderStore.GetIncludesShadersStore(this._shaderLanguage),
            version: (this._engine.version * 100).toString(),
            platformName: this._engine.shaderPlatformName,
            processingContext: this._processingContext,
            isNDCHalfZRange: this._engine.isNDCHalfZRange,
            useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
            processCodeAfterIncludes: this._processCodeAfterIncludes,
        };
        _processShaderCode(processorOptions, this.name, this._processFinalCode, (migratedVertexCode, migratedFragmentCode) => {
            this._vertexSourceCode = migratedVertexCode;
            this._fragmentSourceCode = migratedFragmentCode;
            this._prepareEffect(keepExistingPipelineContext);
        }, this._shaderLanguage, this._engine, this);
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
        if (this._engine.isDisposed) {
            // Engine is disposed, we return true to prevent looping over the setTimeout call in _checkIsReady
            return true;
        }
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
     * The set of names of attribute variables for the shader.
     * @returns An array of attribute names.
     */
    getAttributesNames() {
        return this._attributesNames;
    }
    /**
     * Returns the attribute at the given index.
     * @param index The index of the attribute.
     * @returns The location of the attribute.
     */
    getAttributeLocation(index) {
        return this._attributes[index];
    }
    /**
     * Returns the attribute based on the name of the variable.
     * @param name of the attribute to look up.
     * @returns the attribute location.
     */
    getAttributeLocationByName(name) {
        return this._attributeLocationByName[name];
    }
    /**
     * The number of attributes.
     * @returns the number of attributes.
     */
    getAttributesCount() {
        return this._attributes.length;
    }
    /**
     * Gets the index of a uniform variable.
     * @param uniformName of the uniform to look up.
     * @returns the index.
     */
    getUniformIndex(uniformName) {
        return this._uniformsNames.indexOf(uniformName);
    }
    /**
     * Returns the attribute based on the name of the variable.
     * @param uniformName of the uniform to look up.
     * @returns the location of the uniform.
     */
    getUniform(uniformName) {
        return this._uniforms[uniformName];
    }
    /**
     * Returns an array of sampler variable names
     * @returns The array of sampler variable names.
     */
    getSamplers() {
        return this._samplerList;
    }
    /**
     * Returns an array of uniform variable names
     * @returns The array of uniform variable names.
     */
    getUniformNames() {
        return this._uniformsNames;
    }
    /**
     * Returns an array of uniform buffer variable names
     * @returns The array of uniform buffer variable names.
     */
    getUniformBuffersNames() {
        return this._uniformBuffersNamesList;
    }
    /**
     * Returns the index parameters used to create the effect
     * @returns The index parameters object
     */
    getIndexParameters() {
        return this._indexParameters;
    }
    /**
     * The error from the last compilation.
     * @returns the error string.
     */
    getCompilationError() {
        return this._compilationError;
    }
    /**
     * Gets a boolean indicating that all fallbacks were used during compilation
     * @returns true if all fallbacks were used
     */
    allFallbacksProcessed() {
        return this._allFallbacksProcessed;
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
        _retryWithInterval(() => {
            return this._isReadyInternal() || this._isDisposed;
        }, () => {
            // no-op - done in the _isReadyInternal call
        }, (e) => {
            this._processCompilationErrors(e, previousPipelineContext);
        }, 16, 30000, true, ` - Effect: ${typeof this.name === "string" ? this.name : this.key}`);
    }
    /**
     * Gets the vertex shader source code of this effect
     * This is the final source code that will be compiled, after all the processing has been done (pre-processing applied, code injection/replacement, etc)
     */
    get vertexSourceCode() {
        return this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride
            ? this._vertexSourceCodeOverride
            : (this._pipelineContext?._getVertexShaderCode() ?? this._vertexSourceCode);
    }
    /**
     * Gets the fragment shader source code of this effect
     * This is the final source code that will be compiled, after all the processing has been done (pre-processing applied, code injection/replacement, etc)
     */
    get fragmentSourceCode() {
        return this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride
            ? this._fragmentSourceCodeOverride
            : (this._pipelineContext?._getFragmentShaderCode() ?? this._fragmentSourceCode);
    }
    /**
     * Gets the vertex shader source code before migration.
     * This is the source code after the include directives have been replaced by their contents but before the code is migrated, i.e. before ShaderProcess._ProcessShaderConversion is executed.
     * This method is, among other things, responsible for parsing #if/#define directives as well as converting GLES2 syntax to GLES3 (in the case of WebGL).
     */
    get vertexSourceCodeBeforeMigration() {
        return this._vertexSourceCodeBeforeMigration;
    }
    /**
     * Gets the fragment shader source code before migration.
     * This is the source code after the include directives have been replaced by their contents but before the code is migrated, i.e. before ShaderProcess._ProcessShaderConversion is executed.
     * This method is, among other things, responsible for parsing #if/#define directives as well as converting GLES2 syntax to GLES3 (in the case of WebGL).
     */
    get fragmentSourceCodeBeforeMigration() {
        return this._fragmentSourceCodeBeforeMigration;
    }
    /**
     * Gets the vertex shader source code before it has been modified by any processing
     */
    get rawVertexSourceCode() {
        return this._rawVertexSourceCode;
    }
    /**
     * Gets the fragment shader source code before it has been modified by any processing
     */
    get rawFragmentSourceCode() {
        return this._rawFragmentSourceCode;
    }
    getPipelineGenerationOptions() {
        return {
            platformName: this._engine.shaderPlatformName,
            shaderLanguage: this._shaderLanguage,
            shaderNameOrContent: this.name,
            key: this._key,
            defines: this.defines.split("\n"),
            addGlobalDefines: false,
            extendedProcessingOptions: {
                indexParameters: this._indexParameters,
                isNDCHalfZRange: this._engine.isNDCHalfZRange,
                useReverseDepthBuffer: this._engine.useReverseDepthBuffer,
                supportsUniformBuffers: this._engine.supportsUniformBuffers,
            },
            extendedCreatePipelineOptions: {
                transformFeedbackVaryings: this._transformFeedbackVaryings,
                createAsRaw: !!(this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride),
            },
        };
    }
    /**
     * Recompiles the webGL program
     * @param vertexSourceCode The source code for the vertex shader.
     * @param fragmentSourceCode The source code for the fragment shader.
     * @param onCompiled Callback called when completed.
     * @param onError Callback called on error.
     * @internal
     */
    _rebuildProgram(vertexSourceCode, fragmentSourceCode, onCompiled, onError) {
        this._isReady = false;
        this._vertexSourceCodeOverride = vertexSourceCode;
        this._fragmentSourceCodeOverride = fragmentSourceCode;
        this.onError = (effect, error) => {
            if (onError) {
                onError(error);
            }
        };
        this.onCompiled = () => {
            const scenes = this.getEngine().scenes;
            if (scenes) {
                for (let i = 0; i < scenes.length; i++) {
                    scenes[i].markAllMaterialsAsDirty(63);
                }
            }
            this._pipelineContext._handlesSpectorRebuildCallback?.(onCompiled);
        };
        this._fallbacks = null;
        this._prepareEffect();
    }
    _onRenderingStateCompiled(pipelineContext) {
        this._pipelineContext = pipelineContext;
        this._pipelineContext.setEngine(this._engine);
        this._attributes = [];
        this._pipelineContext._fillEffectInformation(this, this._uniformBuffersNames, this._uniformsNames, this._uniforms, this._samplerList, this._samplers, this._attributesNames, this._attributes);
        // Caches attribute locations.
        if (this._attributesNames) {
            for (let i = 0; i < this._attributesNames.length; i++) {
                const name = this._attributesNames[i];
                this._attributeLocationByName[name] = this._attributes[i];
            }
        }
        this._engine.bindSamplers(this);
        this._compilationError = "";
        this._isReady = true;
        if (this.onCompiled) {
            this.onCompiled(this);
        }
        this.onCompileObservable.notifyObservers(this);
        this.onCompileObservable.clear();
        // Unbind mesh reference in fallbacks
        if (this._fallbacks) {
            this._fallbacks.unBindMesh();
        }
        if (Effect.AutomaticallyClearCodeCache) {
            this.clearCodeCache();
        }
    }
    /**
     * Prepares the effect
     * @internal
     */
    _prepareEffect(keepExistingPipelineContext = false) {
        const previousPipelineContext = this._pipelineContext;
        this._isReady = false;
        try {
            const overrides = !!(this._vertexSourceCodeOverride && this._fragmentSourceCodeOverride);
            const defines = overrides ? null : this.defines;
            const vertex = overrides ? this._vertexSourceCodeOverride : this._vertexSourceCode;
            const fragment = overrides ? this._fragmentSourceCodeOverride : this._fragmentSourceCode;
            const engine = this._engine;
            this._pipelineContext = createAndPreparePipelineContext({
                existingPipelineContext: keepExistingPipelineContext ? previousPipelineContext : null,
                vertex,
                fragment,
                context: engine.shaderPlatformName === "WEBGL2" ? engine._gl : undefined,
                rebuildRebind: (vertexSourceCode, fragmentSourceCode, onCompiled, onError) => this._rebuildProgram(vertexSourceCode, fragmentSourceCode, onCompiled, onError),
                defines,
                transformFeedbackVaryings: this._transformFeedbackVaryings,
                name: this._key.replace(/\r/g, "").replace(/\n/g, "|"),
                createAsRaw: overrides,
                parallelShaderCompile: engine._caps.parallelShaderCompile,
                shaderProcessingContext: this._processingContext,
                onRenderingStateCompiled: (pipelineContext) => {
                    if (previousPipelineContext && !keepExistingPipelineContext) {
                        this._engine._deletePipelineContext(previousPipelineContext);
                    }
                    if (pipelineContext) {
                        this._onRenderingStateCompiled(pipelineContext);
                    }
                },
            }, this._engine.createPipelineContext.bind(this._engine), this._engine._preparePipelineContext.bind(this._engine), this._engine._executeWhenRenderingStateIsCompiled.bind(this._engine));
            if (this._pipelineContext.isAsync) {
                this._checkIsReady(previousPipelineContext);
            }
        }
        catch (e) {
            this._processCompilationErrors(e, previousPipelineContext);
        }
    }
    _getShaderCodeAndErrorLine(code, error, isFragment) {
        const regexp = isFragment ? /FRAGMENT SHADER ERROR: 0:(\d+?):/ : /VERTEX SHADER ERROR: 0:(\d+?):/;
        let errorLine = null;
        if (error && code) {
            const res = error.match(regexp);
            if (res && res.length === 2) {
                const lineNumber = parseInt(res[1]);
                const lines = code.split("\n", -1);
                if (lines.length >= lineNumber) {
                    errorLine = `Offending line [${lineNumber}] in ${isFragment ? "fragment" : "vertex"} code: ${lines[lineNumber - 1]}`;
                }
            }
        }
        return [code, errorLine];
    }
    _processCompilationErrors(e, previousPipelineContext = null) {
        this._compilationError = e.message;
        const attributesNames = this._attributesNames;
        const fallbacks = this._fallbacks;
        // Let's go through fallbacks then
        Logger.Error("Unable to compile effect:");
        Logger.Error("Uniforms: " +
            this._uniformsNames.map(function (uniform) {
                return " " + uniform;
            }));
        Logger.Error("Attributes: " +
            attributesNames.map(function (attribute) {
                return " " + attribute;
            }));
        Logger.Error("Defines:\n" + this.defines);
        if (Effect.LogShaderCodeOnCompilationError) {
            let lineErrorVertex = null, lineErrorFragment = null, code = null;
            if (this._pipelineContext?._getVertexShaderCode()) {
                [code, lineErrorVertex] = this._getShaderCodeAndErrorLine(this._pipelineContext._getVertexShaderCode(), this._compilationError, false);
                if (code) {
                    Logger.Error("Vertex code:");
                    Logger.Error(code);
                }
            }
            if (this._pipelineContext?._getFragmentShaderCode()) {
                [code, lineErrorFragment] = this._getShaderCodeAndErrorLine(this._pipelineContext?._getFragmentShaderCode(), this._compilationError, true);
                if (code) {
                    Logger.Error("Fragment code:");
                    Logger.Error(code);
                }
            }
            if (lineErrorVertex) {
                Logger.Error(lineErrorVertex);
            }
            if (lineErrorFragment) {
                Logger.Error(lineErrorFragment);
            }
        }
        Logger.Error("Error: " + this._compilationError);
        const notifyErrors = () => {
            if (this.onError) {
                this.onError(this, this._compilationError);
            }
            this.onErrorObservable.notifyObservers(this);
            this._engine.onEffectErrorObservable.notifyObservers({ effect: this, errors: this._compilationError });
        };
        // In case a previous compilation was successful, we need to restore the previous pipeline context
        if (previousPipelineContext) {
            this._pipelineContext = previousPipelineContext;
            this._isReady = true;
            notifyErrors();
        }
        // Lets try to compile fallbacks as long as we have some.
        if (fallbacks) {
            this._pipelineContext = null;
            if (fallbacks.hasMoreFallbacks) {
                this._allFallbacksProcessed = false;
                Logger.Error("Trying next fallback.");
                this.defines = fallbacks.reduce(this.defines, this);
                this._prepareEffect();
            }
            else {
                // Sorry we did everything we can
                this._allFallbacksProcessed = true;
                notifyErrors();
                this.onErrorObservable.clear();
                // Unbind mesh reference in fallbacks
                if (this._fallbacks) {
                    this._fallbacks.unBindMesh();
                }
            }
        }
        else {
            this._allFallbacksProcessed = true;
            // In case of error, without any prior successful compilation, let s notify observers
            if (!previousPipelineContext) {
                notifyErrors();
            }
        }
    }
    /**
     * Checks if the effect is supported. (Must be called after compilation)
     */
    get isSupported() {
        return this._compilationError === "";
    }
    /**
     * Binds a texture to the engine to be used as output of the shader.
     * @param channel Name of the output variable.
     * @param texture Texture to bind.
     * @internal
     */
    _bindTexture(channel, texture) {
        this._engine._bindTexture(this._samplers[channel], texture, channel);
    }
    /**
     * Sets a texture on the engine to be used in the shader.
     * @param channel Name of the sampler variable.
     * @param texture Texture to set.
     */
    setTexture(channel, texture) {
        this._engine.setTexture(this._samplers[channel], this._uniforms[channel], texture, channel);
    }
    /**
     * Sets an array of textures on the engine to be used in the shader.
     * @param channel Name of the variable.
     * @param textures Textures to set.
     */
    setTextureArray(channel, textures) {
        const exName = channel + "Ex";
        if (this._samplerList.indexOf(exName + "0") === -1) {
            const initialPos = this._samplerList.indexOf(channel);
            for (let index = 1; index < textures.length; index++) {
                const currentExName = exName + (index - 1).toString();
                this._samplerList.splice(initialPos + index, 0, currentExName);
            }
            // Reset every channels
            let channelIndex = 0;
            for (const key of this._samplerList) {
                this._samplers[key] = channelIndex;
                channelIndex += 1;
            }
        }
        this._engine.setTextureArray(this._samplers[channel], this._uniforms[channel], textures, channel);
    }
    /**
     * Binds a buffer to a uniform.
     * @param buffer Buffer to bind.
     * @param name Name of the uniform variable to bind to.
     */
    bindUniformBuffer(buffer, name) {
        const bufferName = this._uniformBuffersNames[name];
        if (bufferName === undefined || (Effect._BaseCache[bufferName] === buffer && this._engine._features.useUBOBindingCache)) {
            return;
        }
        Effect._BaseCache[bufferName] = buffer;
        this._engine.bindUniformBufferBase(buffer, bufferName, name);
    }
    /**
     * Binds block to a uniform.
     * @param blockName Name of the block to bind.
     * @param index Index to bind.
     */
    bindUniformBlock(blockName, index) {
        this._engine.bindUniformBlock(this._pipelineContext, blockName, index);
    }
    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     * @returns this effect.
     */
    setInt(uniformName, value) {
        this._pipelineContext.setInt(uniformName, value);
        return this;
    }
    /**
     * Sets an int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     * @returns this effect.
     */
    setInt2(uniformName, x, y) {
        this._pipelineContext.setInt2(uniformName, x, y);
        return this;
    }
    /**
     * Sets an int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     * @returns this effect.
     */
    setInt3(uniformName, x, y, z) {
        this._pipelineContext.setInt3(uniformName, x, y, z);
        return this;
    }
    /**
     * Sets an int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     * @returns this effect.
     */
    setInt4(uniformName, x, y, z, w) {
        this._pipelineContext.setInt4(uniformName, x, y, z, w);
        return this;
    }
    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setIntArray(uniformName, array) {
        this._pipelineContext.setIntArray(uniformName, array);
        return this;
    }
    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setIntArray2(uniformName, array) {
        this._pipelineContext.setIntArray2(uniformName, array);
        return this;
    }
    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setIntArray3(uniformName, array) {
        this._pipelineContext.setIntArray3(uniformName, array);
        return this;
    }
    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setIntArray4(uniformName, array) {
        this._pipelineContext.setIntArray4(uniformName, array);
        return this;
    }
    /**
     * Sets an unsigned integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     * @returns this effect.
     */
    setUInt(uniformName, value) {
        this._pipelineContext.setUInt(uniformName, value);
        return this;
    }
    /**
     * Sets an unsigned int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint2.
     * @param y Second unsigned int in uint2.
     * @returns this effect.
     */
    setUInt2(uniformName, x, y) {
        this._pipelineContext.setUInt2(uniformName, x, y);
        return this;
    }
    /**
     * Sets an unsigned int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint3.
     * @param y Second unsigned int in uint3.
     * @param z Third unsigned int in uint3.
     * @returns this effect.
     */
    setUInt3(uniformName, x, y, z) {
        this._pipelineContext.setUInt3(uniformName, x, y, z);
        return this;
    }
    /**
     * Sets an unsigned int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First unsigned int in uint4.
     * @param y Second unsigned int in uint4.
     * @param z Third unsigned int in uint4.
     * @param w Fourth unsigned int in uint4.
     * @returns this effect.
     */
    setUInt4(uniformName, x, y, z, w) {
        this._pipelineContext.setUInt4(uniformName, x, y, z, w);
        return this;
    }
    /**
     * Sets an unsigned int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setUIntArray(uniformName, array) {
        this._pipelineContext.setUIntArray(uniformName, array);
        return this;
    }
    /**
     * Sets an unsigned int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setUIntArray2(uniformName, array) {
        this._pipelineContext.setUIntArray2(uniformName, array);
        return this;
    }
    /**
     * Sets an unsigned int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setUIntArray3(uniformName, array) {
        this._pipelineContext.setUIntArray3(uniformName, array);
        return this;
    }
    /**
     * Sets an unsigned int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setUIntArray4(uniformName, array) {
        this._pipelineContext.setUIntArray4(uniformName, array);
        return this;
    }
    /**
     * Sets an float array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setFloatArray(uniformName, array) {
        this._pipelineContext.setArray(uniformName, array);
        return this;
    }
    /**
     * Sets an float array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setFloatArray2(uniformName, array) {
        this._pipelineContext.setArray2(uniformName, array);
        return this;
    }
    /**
     * Sets an float array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setFloatArray3(uniformName, array) {
        this._pipelineContext.setArray3(uniformName, array);
        return this;
    }
    /**
     * Sets an float array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setFloatArray4(uniformName, array) {
        this._pipelineContext.setArray4(uniformName, array);
        return this;
    }
    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setArray(uniformName, array) {
        this._pipelineContext.setArray(uniformName, array);
        return this;
    }
    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setArray2(uniformName, array) {
        this._pipelineContext.setArray2(uniformName, array);
        return this;
    }
    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setArray3(uniformName, array) {
        this._pipelineContext.setArray3(uniformName, array);
        return this;
    }
    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    setArray4(uniformName, array) {
        this._pipelineContext.setArray4(uniformName, array);
        return this;
    }
    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     * @returns this effect.
     */
    setMatrices(uniformName, matrices) {
        this._pipelineContext.setMatrices(uniformName, matrices);
        return this;
    }
    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    setMatrix(uniformName, matrix) {
        this._pipelineContext.setMatrix(uniformName, matrix);
        return this;
    }
    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    setMatrix3x3(uniformName, matrix) {
        // the cast is ok because it is gl.uniformMatrix3fv() which is called at the end, and this function accepts Float32Array and Array<number>
        this._pipelineContext.setMatrix3x3(uniformName, matrix);
        return this;
    }
    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     * @returns this effect.
     */
    setMatrix2x2(uniformName, matrix) {
        // the cast is ok because it is gl.uniformMatrix3fv() which is called at the end, and this function accepts Float32Array and Array<number>
        this._pipelineContext.setMatrix2x2(uniformName, matrix);
        return this;
    }
    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    setFloat(uniformName, value) {
        this._pipelineContext.setFloat(uniformName, value);
        return this;
    }
    /**
     * Sets a boolean on a uniform variable.
     * @param uniformName Name of the variable.
     * @param bool value to be set.
     * @returns this effect.
     */
    setBool(uniformName, bool) {
        this._pipelineContext.setInt(uniformName, bool ? 1 : 0);
        return this;
    }
    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     * @returns this effect.
     */
    setVector2(uniformName, vector2) {
        this._pipelineContext.setVector2(uniformName, vector2);
        return this;
    }
    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     * @returns this effect.
     */
    setFloat2(uniformName, x, y) {
        this._pipelineContext.setFloat2(uniformName, x, y);
        return this;
    }
    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     * @returns this effect.
     */
    setVector3(uniformName, vector3) {
        this._pipelineContext.setVector3(uniformName, vector3);
        return this;
    }
    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     * @returns this effect.
     */
    setFloat3(uniformName, x, y, z) {
        this._pipelineContext.setFloat3(uniformName, x, y, z);
        return this;
    }
    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     * @returns this effect.
     */
    setVector4(uniformName, vector4) {
        this._pipelineContext.setVector4(uniformName, vector4);
        return this;
    }
    /**
     * Sets a Quaternion on a uniform variable.
     * @param uniformName Name of the variable.
     * @param quaternion Value to be set.
     * @returns this effect.
     */
    setQuaternion(uniformName, quaternion) {
        this._pipelineContext.setQuaternion(uniformName, quaternion);
        return this;
    }
    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     * @returns this effect.
     */
    setFloat4(uniformName, x, y, z, w) {
        this._pipelineContext.setFloat4(uniformName, x, y, z, w);
        return this;
    }
    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @returns this effect.
     */
    setColor3(uniformName, color3) {
        this._pipelineContext.setColor3(uniformName, color3);
        return this;
    }
    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     * @returns this effect.
     */
    setColor4(uniformName, color3, alpha) {
        this._pipelineContext.setColor4(uniformName, color3, alpha);
        return this;
    }
    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     * @returns this effect.
     */
    setDirectColor4(uniformName, color4) {
        this._pipelineContext.setDirectColor4(uniformName, color4);
        return this;
    }
    /**
     * Use this wisely: It will remove the cached code from this effect
     * It is probably ok to call it if you are not using ShadowDepthWrapper or if everything is already up and running
     * DO NOT CALL IT if you want to have support for context lost recovery
     */
    clearCodeCache() {
        this._vertexSourceCode = "";
        this._fragmentSourceCode = "";
        this._fragmentSourceCodeBeforeMigration = "";
        this._vertexSourceCodeBeforeMigration = "";
    }
    /**
     * Release all associated resources.
     * @param force specifies if the effect must be released no matter what
     **/
    dispose(force = false) {
        if (force) {
            this._refCount = 0;
        }
        else {
            this._refCount--;
        }
        if (this._refCount > 0 || this._isDisposed) {
            // Others are still using the effect or the effect was already disposed
            return;
        }
        if (this._pipelineContext) {
            resetCachedPipeline(this._pipelineContext);
        }
        this._engine._releaseEffect(this);
        this.clearCodeCache();
        this._isDisposed = true;
    }
    /**
     * This function will add a new shader to the shader store
     * @param name the name of the shader
     * @param pixelShader optional pixel shader content
     * @param vertexShader optional vertex shader content
     * @param shaderLanguage the language the shader is written in (default: GLSL)
     */
    static RegisterShader(name, pixelShader, vertexShader, shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        if (pixelShader) {
            EngineShaderStore.GetShadersStore(shaderLanguage)[`${name}PixelShader`] = pixelShader;
        }
        if (vertexShader) {
            EngineShaderStore.GetShadersStore(shaderLanguage)[`${name}VertexShader`] = vertexShader;
        }
    }
    /**
     * Resets the cache of effects.
     */
    static ResetCache() {
        Effect._BaseCache = {};
    }
}
/**
 * Enable logging of the shader code when a compilation error occurs
 */
Effect.LogShaderCodeOnCompilationError = true;
/**
 * Use this with caution
 * See ClearCodeCache function comments
 */
Effect.AutomaticallyClearCodeCache = false;
Effect._UniqueIdSeed = 0;
Effect._BaseCache = {};
/**
 * Store of each shader (The can be looked up using effect.key)
 */
Effect.ShadersStore = EngineShaderStore.ShadersStore;
/**
 * Store of each included file for a shader (The can be looked up using effect.key)
 */
Effect.IncludesShadersStore = EngineShaderStore.IncludesShadersStore;
//# sourceMappingURL=effect.js.map