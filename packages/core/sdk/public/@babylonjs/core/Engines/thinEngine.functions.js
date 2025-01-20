import { WebGLPipelineContext } from "./WebGL/webGLPipelineContext.js";
import { _ConcatenateShader } from "./abstractEngine.functions.js";
/**
 * @internal
 */
const _stateObject = new WeakMap();
/**
 * This will be used in cases where the engine doesn't have a context (like the nullengine)
 */
const singleStateObject = {
    _webGLVersion: 2,
    cachedPipelines: {},
};
/**
 * get or create a state object for the given context
 * Note - Used in WebGL only at the moment.
 * @param context The context to get the state object from
 * @returns the state object
 * @internal
 */
export function getStateObject(context) {
    let state = _stateObject.get(context);
    if (!state) {
        if (!context) {
            return singleStateObject;
        }
        state = {
            // use feature detection. instanceof returns false. This only exists on WebGL2 context
            _webGLVersion: context.TEXTURE_BINDING_3D ? 2 : 1,
            _context: context,
            // when using the function without an engine we need to set it to enable parallel compilation
            parallelShaderCompile: context.getExtension("KHR_parallel_shader_compile") || undefined,
            cachedPipelines: {},
        };
        _stateObject.set(context, state);
    }
    return state;
}
/**
 * Remove the state object that belongs to the specific context
 * @param context the context that is being
 */
export function deleteStateObject(context) {
    _stateObject.delete(context);
}
/**
 * Directly creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @param _createShaderProgramInjection defines an optional injection to use to create the shader program
 * @returns the new webGL program
 */
export function createRawShaderProgram(pipelineContext, vertexCode, fragmentCode, context, transformFeedbackVaryings, _createShaderProgramInjection) {
    const stateObject = getStateObject(context);
    if (!_createShaderProgramInjection) {
        _createShaderProgramInjection = stateObject._createShaderProgramInjection ?? _createShaderProgram;
    }
    const vertexShader = _compileRawShader(vertexCode, "vertex", context, stateObject._contextWasLost);
    const fragmentShader = _compileRawShader(fragmentCode, "fragment", context, stateObject._contextWasLost);
    return _createShaderProgramInjection(pipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings, stateObject.validateShaderPrograms);
}
/**
 * Creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode  defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param defines defines the string containing the defines to use to compile the shaders
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @param _createShaderProgramInjection defines an optional injection to use to create the shader program
 * @returns the new webGL program
 */
export function createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings = null, _createShaderProgramInjection) {
    const stateObject = getStateObject(context);
    if (!_createShaderProgramInjection) {
        _createShaderProgramInjection = stateObject._createShaderProgramInjection ?? _createShaderProgram;
    }
    const shaderVersion = stateObject._webGLVersion > 1 ? "#version 300 es\n#define WEBGL2 \n" : "";
    const vertexShader = _compileShader(vertexCode, "vertex", defines, shaderVersion, context, stateObject._contextWasLost);
    const fragmentShader = _compileShader(fragmentCode, "fragment", defines, shaderVersion, context, stateObject._contextWasLost);
    return _createShaderProgramInjection(pipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings, stateObject.validateShaderPrograms);
}
/**
 * Creates a new pipeline context. Note, make sure to attach an engine instance to the created context
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param _shaderProcessingContext defines the shader processing context used during the processing if available
 * @returns the new pipeline
 */
export function createPipelineContext(context, _shaderProcessingContext) {
    const pipelineContext = new WebGLPipelineContext();
    const stateObject = getStateObject(context);
    if (stateObject.parallelShaderCompile) {
        pipelineContext.isParallelCompiled = true;
    }
    pipelineContext.context = stateObject._context;
    return pipelineContext;
}
/**
 * @internal
 */
export function _createShaderProgram(pipelineContext, vertexShader, fragmentShader, context, _transformFeedbackVaryings = null, validateShaderPrograms) {
    const shaderProgram = context.createProgram();
    pipelineContext.program = shaderProgram;
    if (!shaderProgram) {
        throw new Error("Unable to create program");
    }
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);
    pipelineContext.context = context;
    pipelineContext.vertexShader = vertexShader;
    pipelineContext.fragmentShader = fragmentShader;
    if (!pipelineContext.isParallelCompiled) {
        _finalizePipelineContext(pipelineContext, context, validateShaderPrograms);
    }
    return shaderProgram;
}
/**
 * @internal
 */
export function _isRenderingStateCompiled(pipelineContext, gl, validateShaderPrograms) {
    const webGLPipelineContext = pipelineContext;
    if (webGLPipelineContext._isDisposed) {
        return false;
    }
    const stateObject = getStateObject(gl);
    if (gl.getProgramParameter(webGLPipelineContext.program, stateObject.parallelShaderCompile.COMPLETION_STATUS_KHR)) {
        _finalizePipelineContext(webGLPipelineContext, gl, validateShaderPrograms);
        return true;
    }
    return false;
}
/**
 * @internal
 */
export function _finalizePipelineContext(pipelineContext, gl, validateShaderPrograms) {
    const context = pipelineContext.context;
    const vertexShader = pipelineContext.vertexShader;
    const fragmentShader = pipelineContext.fragmentShader;
    const program = pipelineContext.program;
    const linked = context.getProgramParameter(program, context.LINK_STATUS);
    if (!linked) {
        // Get more info
        // Vertex
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(vertexShader);
            if (log) {
                pipelineContext.vertexCompilationError = log;
                throw new Error("VERTEX SHADER " + log);
            }
        }
        // Fragment
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(fragmentShader);
            if (log) {
                pipelineContext.fragmentCompilationError = log;
                throw new Error("FRAGMENT SHADER " + log);
            }
        }
        const error = context.getProgramInfoLog(program);
        if (error) {
            pipelineContext.programLinkError = error;
            throw new Error(error);
        }
    }
    if ( /*this.*/validateShaderPrograms) {
        context.validateProgram(program);
        const validated = context.getProgramParameter(program, context.VALIDATE_STATUS);
        if (!validated) {
            const error = context.getProgramInfoLog(program);
            if (error) {
                pipelineContext.programValidationError = error;
                throw new Error(error);
            }
        }
    }
    context.deleteShader(vertexShader);
    context.deleteShader(fragmentShader);
    pipelineContext.vertexShader = undefined;
    pipelineContext.fragmentShader = undefined;
    if (pipelineContext.onCompiled) {
        pipelineContext.onCompiled();
        pipelineContext.onCompiled = undefined;
    }
}
/**
 * @internal
 */
export function _preparePipelineContext(pipelineContext, vertexSourceCode, fragmentSourceCode, createAsRaw, _rawVertexSourceCode, _rawFragmentSourceCode, rebuildRebind, defines, transformFeedbackVaryings, _key = "", onReady, createRawShaderProgramInjection, createShaderProgramInjection) {
    const stateObject = getStateObject(pipelineContext.context);
    if (!createRawShaderProgramInjection) {
        createRawShaderProgramInjection = stateObject.createRawShaderProgramInjection ?? createRawShaderProgram;
    }
    if (!createShaderProgramInjection) {
        createShaderProgramInjection = stateObject.createShaderProgramInjection ?? createShaderProgram;
    }
    const webGLRenderingState = pipelineContext;
    if (createAsRaw) {
        webGLRenderingState.program = createRawShaderProgramInjection(webGLRenderingState, vertexSourceCode, fragmentSourceCode, webGLRenderingState.context, transformFeedbackVaryings);
    }
    else {
        webGLRenderingState.program = createShaderProgramInjection(webGLRenderingState, vertexSourceCode, fragmentSourceCode, defines, webGLRenderingState.context, transformFeedbackVaryings);
    }
    webGLRenderingState.program.__SPECTOR_rebuildProgram = rebuildRebind;
    onReady();
}
function _compileShader(source, type, defines, shaderVersion, gl, _contextWasLost) {
    return _compileRawShader(_ConcatenateShader(source, defines, shaderVersion), type, gl, _contextWasLost);
}
function _compileRawShader(source, type, gl, _contextWasLost) {
    const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    if (!shader) {
        let error = gl.NO_ERROR;
        let tempError = gl.NO_ERROR;
        while ((tempError = gl.getError()) !== gl.NO_ERROR) {
            error = tempError;
        }
        throw new Error(`Something went wrong while creating a gl ${type} shader object. gl error=${error}, gl isContextLost=${gl.isContextLost()}, _contextWasLost=${_contextWasLost}`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}
/**
 * @internal
 */
export function _setProgram(program, gl) {
    gl.useProgram(program);
}
/**
 * @internal
 */
export function _executeWhenRenderingStateIsCompiled(pipelineContext, action) {
    const webGLPipelineContext = pipelineContext;
    if (!webGLPipelineContext.isParallelCompiled) {
        action(pipelineContext);
        return;
    }
    const oldHandler = webGLPipelineContext.onCompiled;
    webGLPipelineContext.onCompiled = () => {
        oldHandler?.();
        action(pipelineContext);
    };
}
//# sourceMappingURL=thinEngine.functions.js.map