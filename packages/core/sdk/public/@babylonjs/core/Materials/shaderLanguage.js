/**
 * Language of the shader code
 */
export var ShaderLanguage;
(function (ShaderLanguage) {
    /** language is GLSL (used by WebGL) */
    ShaderLanguage[ShaderLanguage["GLSL"] = 0] = "GLSL";
    /** language is WGSL (used by WebGPU) */
    ShaderLanguage[ShaderLanguage["WGSL"] = 1] = "WGSL";
})(ShaderLanguage || (ShaderLanguage = {}));
//# sourceMappingURL=shaderLanguage.js.map