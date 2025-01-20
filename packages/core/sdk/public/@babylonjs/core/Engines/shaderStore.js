/**
 * Defines the shader related stores and directory
 */
export class ShaderStore {
    /**
     * Gets the shaders repository path for a given shader language
     * @param shaderLanguage the shader language
     * @returns the path to the shaders repository
     */
    static GetShadersRepository(shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? ShaderStore.ShadersRepository : ShaderStore.ShadersRepositoryWGSL;
    }
    /**
     * Gets the shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the shaders store
     */
    static GetShadersStore(shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? ShaderStore.ShadersStore : ShaderStore.ShadersStoreWGSL;
    }
    /**
     * Gets the include shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the include shaders store
     */
    static GetIncludesShadersStore(shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? ShaderStore.IncludesShadersStore : ShaderStore.IncludesShadersStoreWGSL;
    }
}
/**
 * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
 */
ShaderStore.ShadersRepository = "src/Shaders/";
/**
 * Store of each shader (The can be looked up using effect.key)
 */
ShaderStore.ShadersStore = {};
/**
 * Store of each included file for a shader (The can be looked up using effect.key)
 */
ShaderStore.IncludesShadersStore = {};
/**
 * Gets or sets the relative url used to load shaders (WGSL) if using the engine in non-minified mode
 */
ShaderStore.ShadersRepositoryWGSL = "src/ShadersWGSL/";
/**
 * Store of each shader  (WGSL)
 */
ShaderStore.ShadersStoreWGSL = {};
/**
 * Store of each included file for a shader (WGSL)
 */
ShaderStore.IncludesShadersStoreWGSL = {};
//# sourceMappingURL=shaderStore.js.map