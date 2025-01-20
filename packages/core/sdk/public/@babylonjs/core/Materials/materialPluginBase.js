import { __decorate } from "../tslib.es6.js";
import { serialize } from "../Misc/decorators.js";
import { MaterialPluginManager } from "./materialPluginManager.js";

import { SerializationHelper } from "../Misc/decorators.serialization.js";
import { RegisterClass } from "../Misc/typeStore.js";
/**
 * Base class for material plugins.
 * @since 5.0
 */
export class MaterialPluginBase {
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @param shaderLanguage The shader language to use.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible(shaderLanguage) {
        switch (shaderLanguage) {
            case 0 /* ShaderLanguage.GLSL */:
                return true;
            default:
                return false;
        }
    }
    _enable(enable) {
        if (enable) {
            this._pluginManager._activatePlugin(this);
        }
    }
    /**
     * Creates a new material plugin
     * @param material parent material of the plugin
     * @param name name of the plugin
     * @param priority priority of the plugin
     * @param defines list of defines used by the plugin. The value of the property is the default value for this property
     * @param addToPluginList true to add the plugin to the list of plugins managed by the material plugin manager of the material (default: true)
     * @param enable true to enable the plugin (it is handy if the plugin does not handle properties to switch its current activation)
     * @param resolveIncludes Indicates that any #include directive in the plugin code must be replaced by the corresponding code (default: false)
     */
    constructor(material, name, priority, defines, addToPluginList = true, enable = false, resolveIncludes = false) {
        /**
         * Defines the priority of the plugin. Lower numbers run first.
         */
        this.priority = 500;
        /**
         * Indicates that any #include directive in the plugin code must be replaced by the corresponding code.
         */
        this.resolveIncludes = false;
        /**
         * Indicates that this plugin should be notified for the extra events (HasRenderTargetTextures / FillRenderTargetTextures / HardBindForSubMesh)
         */
        this.registerForExtraEvents = false;
        /**
         * Specifies if the material plugin should be serialized, `true` to skip serialization
         */
        this.doNotSerialize = false;
        this._material = material;
        this.name = name;
        this.priority = priority;
        this.resolveIncludes = resolveIncludes;
        if (!material.pluginManager) {
            material.pluginManager = new MaterialPluginManager(material);
            material.onDisposeObservable.add(() => {
                material.pluginManager = undefined;
            });
        }
        this._pluginDefineNames = defines;
        this._pluginManager = material.pluginManager;
        if (addToPluginList) {
            this._pluginManager._addPlugin(this);
        }
        if (enable) {
            this._enable(true);
        }
        this.markAllDefinesAsDirty = material._dirtyCallbacks[63];
    }
    /**
     * Gets the current class name useful for serialization or dynamic coding.
     * @returns The class name.
     */
    getClassName() {
        return "MaterialPluginBase";
    }
    /**
     * Specifies that the submesh is ready to be used.
     * @param _defines the list of "defines" to update.
     * @param _scene defines the scene the material belongs to.
     * @param _engine the engine this scene belongs to.
     * @param _subMesh the submesh to check for readiness
     * @returns - boolean indicating that the submesh is ready or not.
     */
    isReadyForSubMesh(_defines, _scene, _engine, _subMesh) {
        return true;
    }
    /**
     * Binds the material data (this function is called even if mustRebind() returns false)
     * @param _uniformBuffer defines the Uniform buffer to fill in.
     * @param _scene defines the scene the material belongs to.
     * @param _engine defines the engine the material belongs to.
     * @param _subMesh the submesh to bind data for
     */
    hardBindForSubMesh(_uniformBuffer, _scene, _engine, _subMesh) { }
    /**
     * Binds the material data.
     * @param _uniformBuffer defines the Uniform buffer to fill in.
     * @param _scene defines the scene the material belongs to.
     * @param _engine the engine this scene belongs to.
     * @param _subMesh the submesh to bind data for
     */
    bindForSubMesh(_uniformBuffer, _scene, _engine, _subMesh) { }
    /**
     * Disposes the resources of the material.
     * @param _forceDisposeTextures - Forces the disposal of all textures.
     */
    dispose(_forceDisposeTextures) { }
    /**
     * Returns a list of custom shader code fragments to customize the shader.
     * @param _shaderType "vertex" or "fragment"
     * @param _shaderLanguage The shader language to use.
     * @returns null if no code to be added, or a list of pointName =\> code.
     * Note that `pointName` can also be a regular expression if it starts with a `!`.
     * In that case, the string found by the regular expression (if any) will be
     * replaced by the code provided.
     */
    getCustomCode(_shaderType, _shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return null;
    }
    /**
     * Collects all defines.
     * @param defines The object to append to.
     */
    collectDefines(defines) {
        if (!this._pluginDefineNames) {
            return;
        }
        for (const key of Object.keys(this._pluginDefineNames)) {
            if (key[0] === "_") {
                continue;
            }
            const type = typeof this._pluginDefineNames[key];
            defines[key] = {
                type: type === "number" ? "number" : type === "string" ? "string" : type === "boolean" ? "boolean" : "object",
                default: this._pluginDefineNames[key],
            };
        }
    }
    /**
     * Sets the defines for the next rendering. Called before PrepareDefinesForAttributes is called.
     * @param _defines the list of "defines" to update.
     * @param _scene defines the scene to the material belongs to.
     * @param _mesh the mesh being rendered
     */
    prepareDefinesBeforeAttributes(_defines, _scene, _mesh) { }
    /**
     * Sets the defines for the next rendering
     * @param _defines the list of "defines" to update.
     * @param _scene defines the scene to the material belongs to.
     * @param _mesh the mesh being rendered
     */
    prepareDefines(_defines, _scene, _mesh) { }
    /**
     * Checks to see if a texture is used in the material.
     * @param _texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    hasTexture(_texture) {
        return false;
    }
    /**
     * Gets a boolean indicating that current material needs to register RTT
     * @returns true if this uses a render target otherwise false.
     */
    hasRenderTargetTextures() {
        return false;
    }
    /**
     * Fills the list of render target textures.
     * @param _renderTargets the list of render targets to update
     */
    fillRenderTargetTextures(_renderTargets) { }
    /**
     * Returns an array of the actively used textures.
     * @param _activeTextures Array of BaseTextures
     */
    getActiveTextures(_activeTextures) { }
    /**
     * Returns the animatable textures.
     * @param _animatables Array of animatable textures.
     */
    getAnimatables(_animatables) { }
    /**
     * Add fallbacks to the effect fallbacks list.
     * @param defines defines the Base texture to use.
     * @param fallbacks defines the current fallback list.
     * @param currentRank defines the current fallback rank.
     * @returns the new fallback rank.
     */
    addFallbacks(defines, fallbacks, currentRank) {
        return currentRank;
    }
    /**
     * Gets the samplers used by the plugin.
     * @param _samplers list that the sampler names should be added to.
     */
    getSamplers(_samplers) { }
    /**
     * Gets the attributes used by the plugin.
     * @param _attributes list that the attribute names should be added to.
     * @param _scene the scene that the material belongs to.
     * @param _mesh the mesh being rendered.
     */
    getAttributes(_attributes, _scene, _mesh) { }
    /**
     * Gets the uniform buffers names added by the plugin.
     * @param _ubos list that the ubo names should be added to.
     */
    getUniformBuffersNames(_ubos) { }
    /**
     * Gets the description of the uniforms to add to the ubo (if engine supports ubos) or to inject directly in the vertex/fragment shaders (if engine does not support ubos)
     * @param _shaderLanguage The shader language to use.
     * @returns the description of the uniforms
     */
    getUniforms(_shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return {};
    }
    /**
     * Makes a duplicate of the current configuration into another one.
     * @param plugin define the config where to copy the info
     */
    copyTo(plugin) {
        SerializationHelper.Clone(() => plugin, this);
    }
    /**
     * Serializes this plugin configuration.
     * @returns - An object with the serialized config.
     */
    serialize() {
        return SerializationHelper.Serialize(this);
    }
    /**
     * Parses a plugin configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    parse(source, scene, rootUrl) {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
__decorate([
    serialize()
], MaterialPluginBase.prototype, "name", void 0);
__decorate([
    serialize()
], MaterialPluginBase.prototype, "priority", void 0);
__decorate([
    serialize()
], MaterialPluginBase.prototype, "resolveIncludes", void 0);
__decorate([
    serialize()
], MaterialPluginBase.prototype, "registerForExtraEvents", void 0);
// Register Class Name
RegisterClass("BABYLON.MaterialPluginBase", MaterialPluginBase);
//# sourceMappingURL=materialPluginBase.js.map