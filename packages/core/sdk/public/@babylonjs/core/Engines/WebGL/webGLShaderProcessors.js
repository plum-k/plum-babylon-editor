/** @internal */
export class WebGLShaderProcessor {
    constructor() {
        this.shaderLanguage = 0 /* ShaderLanguage.GLSL */;
    }
    postProcessor(code, defines, isFragment, processingContext, parameters) {
        // Remove extensions
        if (parameters.drawBuffersExtensionDisabled) {
            // even if enclosed in #if/#endif, IE11 does parse the #extension declaration, so we need to remove it altogether
            const regex = /#extension.+GL_EXT_draw_buffers.+(enable|require)/g;
            code = code.replace(regex, "");
        }
        return code;
    }
}
//# sourceMappingURL=webGLShaderProcessors.js.map