import { __decorate } from "../tslib.es6.js";
/* eslint-disable @typescript-eslint/naming-convention */
import { MaterialPluginBase } from "./materialPluginBase.js";
import { MaterialDefines } from "./materialDefines.js";
import { RegisterClass } from "../Misc/typeStore.js";
import { Color3 } from "../Maths/math.js";
import { Logger } from "../Misc/logger.js";
import { expandToProperty, serialize, serializeAsColor3 } from "../Misc/decorators.js";
const vertexDefinitions = `#if defined(DBG_ENABLED)
attribute float dbg_initialPass;
varying vec3 dbg_vBarycentric;
flat varying vec3 dbg_vVertexWorldPos;
flat varying float dbg_vPass;
#endif`;
const vertexDefinitionsWebGPU = `#if defined(DBG_ENABLED)
attribute dbg_initialPass: f32;
varying dbg_vBarycentric: vec3f;
varying dbg_vVertexWorldPos: vec3f;
varying dbg_vPass: f32;
#endif`;
const vertexMainEnd = `#if defined(DBG_ENABLED)
float dbg_vertexIndex = mod(float(gl_VertexID), 3.);
if (dbg_vertexIndex == 0.0) { 
    dbg_vBarycentric = vec3(1.,0.,0.); 
}
else if (dbg_vertexIndex == 1.0) { 
    dbg_vBarycentric = vec3(0.,1.,0.); 
}
else { 
    dbg_vBarycentric = vec3(0.,0.,1.); 
}

dbg_vVertexWorldPos = vPositionW;
dbg_vPass = dbg_initialPass;
#endif`;
const vertexMainEndWebGPU = `#if defined(DBG_ENABLED)
var dbg_vertexIndex = f32(input.vertexIndex) % 3.;
if (dbg_vertexIndex == 0.0) { 
    vertexOutputs.dbg_vBarycentric = vec3f(1.,0.,0.); 
}
else if (dbg_vertexIndex == 1.0) { 
    vertexOutputs.dbg_vBarycentric = vec3f(0.,1.,0.); 
}
else { 
    vertexOutputs.dbg_vBarycentric = vec3f(0.,0.,1.); 
}

vertexOutputs.dbg_vVertexWorldPos = vertexOutputs.vPositionW;
vertexOutputs.dbg_vPass = input.dbg_initialPass;
#endif`;
const fragmentUniforms = `#if defined(DBG_ENABLED)
uniform vec3 dbg_shadedDiffuseColor;
uniform vec4 dbg_shadedSpecularColorPower;
uniform vec3 dbg_thicknessRadiusScale;

#if DBG_MODE == 2 || DBG_MODE == 3
    uniform vec3 dbg_vertexColor;
#endif

#if DBG_MODE == 1
    uniform vec3 dbg_wireframeTrianglesColor;
#elif DBG_MODE == 3
    uniform vec3 dbg_wireframeVerticesColor;
#elif DBG_MODE == 4 || DBG_MODE == 5
    uniform vec3 dbg_uvPrimaryColor;
    uniform vec3 dbg_uvSecondaryColor;
#elif DBG_MODE == 7
    uniform vec3 dbg_materialColor;
#endif
#endif`;
const fragmentUniformsWebGPU = `#if defined(DBG_ENABLED)
uniform dbg_shadedDiffuseColor: vec3f;
uniform dbg_shadedSpecularColorPower: vec4f;
uniform dbg_thicknessRadiusScale: vec3f;

#if DBG_MODE == 2 || DBG_MODE == 3
    uniform dbg_vertexColor: vec3f;
#endif

#if DBG_MODE == 1
    uniform dbg_wireframeTrianglesColor: vec3f;
#elif DBG_MODE == 3
    uniform  dbg_wireframeVerticesColor: vec3f;
#elif DBG_MODE == 4 || DBG_MODE == 5
    uniform dbg_uvPrimaryColor: vec3f;
    uniform dbg_uvSecondaryColor: vec3f;
#elif DBG_MODE == 7
    uniform dbg_materialColor: vec3f;
#endif
#endif`;
const fragmentDefinitions = `#if defined(DBG_ENABLED)
varying vec3 dbg_vBarycentric;
flat varying vec3 dbg_vVertexWorldPos;
flat varying float dbg_vPass;

#if !defined(DBG_MULTIPLY)
    vec3 dbg_applyShading(vec3 color) {
        vec3 N = vNormalW.xyz;
        vec3 L = normalize(vEyePosition.xyz - vPositionW.xyz);
        vec3 H = normalize(L + L);
        float LdotN = clamp(dot(L,N), 0., 1.);
        float HdotN = clamp(dot(H,N), 0., 1.);
        float specTerm = pow(HdotN, dbg_shadedSpecularColorPower.w);
        color *= (LdotN / PI);
        color += dbg_shadedSpecularColorPower.rgb * (specTerm / PI);
        return color;
    }
#endif

#if DBG_MODE == 1 || DBG_MODE == 3
    float dbg_edgeFactor() {
        vec3 d = fwidth(dbg_vBarycentric);
        vec3 a3 = smoothstep(vec3(0.), d * dbg_thicknessRadiusScale.x, dbg_vBarycentric);
        return min(min(a3.x, a3.y), a3.z);
    }
#endif

#if DBG_MODE == 2 || DBG_MODE == 3
    float dbg_cornerFactor() {
        vec3 worldPos = vPositionW;
        float dist = length(worldPos - dbg_vVertexWorldPos);
        float camDist = length(worldPos - vEyePosition.xyz);
        float d = sqrt(camDist) * .001;
        return smoothstep((dbg_thicknessRadiusScale.y * d), ((dbg_thicknessRadiusScale.y * 1.01) * d), dist);
    }
#endif

#if (DBG_MODE == 4 && defined(UV1)) || (DBG_MODE == 5 && defined(UV2))
    float dbg_checkerboardFactor(vec2 uv) {
        vec2 f = fract(uv * dbg_thicknessRadiusScale.z);
        f -= .5;
        return (f.x * f.y) > 0. ? 1. : 0.;
    }
#endif
#endif`;
const fragmentDefinitionsWebGPU = `#if defined(DBG_ENABLED)
varying dbg_vBarycentric: vec3f;
varying dbg_vVertexWorldPos: vec3f;
varying dbg_vPass: f32;

#if !defined(DBG_MULTIPLY)
    fn dbg_applyShading(color: vec3f) -> vec3f {
        var N = fragmentInputs.vNormalW.xyz;
        var L = normalize(scene.vEyePosition.xyz - fragmentInputs.vPositionW.xyz);
        var H = normalize(L + L);
        var LdotN = clamp(dot(L,N), 0., 1.);
        var HdotN = clamp(dot(H,N), 0., 1.);
        var specTerm = pow(HdotN, uniforms.dbg_shadedSpecularColorPower.w);
        var result = color * (LdotN / PI);
        result += uniforms.dbg_shadedSpecularColorPower.rgb * (specTerm / PI);
        return result;
    }
#endif

#if DBG_MODE == 1 || DBG_MODE == 3
    fn dbg_edgeFactor() -> f32 {
        var d = fwidth(fragmentInputs.dbg_vBarycentric);
        var a3 = smoothstep(vec3f(0.), d * uniforms.dbg_thicknessRadiusScale.x, fragmentInputs.dbg_vBarycentric);
        return min(min(a3.x, a3.y), a3.z);
    }
#endif

#if DBG_MODE == 2 || DBG_MODE == 3
    fn dbg_cornerFactor() -> f32 {
        var worldPos = fragmentInputs.vPositionW;
        float dist = length(worldPos - fragmentInputs.dbg_vVertexWorldPos);
        float camDist = length(worldPos - scene.vEyePosition.xyz);
        float d = sqrt(camDist) * .001;
        return smoothstep((uniforms.dbg_thicknessRadiusScale.y * d), ((uniforms.dbg_thicknessRadiusScale.y * 1.01) * d), dist);
    }
#endif

#if (DBG_MODE == 4 && defined(UV1)) || (DBG_MODE == 5 && defined(UV2))
    fn dbg_checkerboardFactor(uv: vec2f) -> f32 {
        var f = fract(uv * uniforms.dbg_thicknessRadiusScale.z);
        f -= .5;
        return (f.x * f.y) > 0. ? 1. : 0.;
    }
#endif
#endif`;
const fragmentMainEnd = `#if defined(DBG_ENABLED)
vec3 dbg_color = vec3(1.);
#if DBG_MODE == 1
    dbg_color = mix(dbg_wireframeTrianglesColor, vec3(1.), dbg_edgeFactor());
#elif DBG_MODE == 2 || DBG_MODE == 3
    float dbg_cornerFactor = dbg_cornerFactor();
    if (dbg_vPass == 0. && dbg_cornerFactor == 1.) discard;
    dbg_color = mix(dbg_vertexColor, vec3(1.), dbg_cornerFactor);
    #if DBG_MODE == 3
        dbg_color *= mix(dbg_wireframeVerticesColor, vec3(1.), dbg_edgeFactor());
    #endif
#elif DBG_MODE == 4 && defined(MAINUV1)
    dbg_color = mix(dbg_uvPrimaryColor, dbg_uvSecondaryColor, dbg_checkerboardFactor(vMainUV1));
#elif DBG_MODE == 5 && defined(MAINUV2)
    dbg_color = mix(dbg_uvPrimaryColor, dbg_uvSecondaryColor, dbg_checkerboardFactor(vMainUV2));
#elif DBG_MODE == 6 && defined(VERTEXCOLOR)
    dbg_color = vColor.rgb;
#elif DBG_MODE == 7
    dbg_color = dbg_materialColor;
#endif

#if defined(DBG_MULTIPLY)
    gl_FragColor *= vec4(dbg_color, 1.);
#else
    #if DBG_MODE != 6
        gl_FragColor = vec4(dbg_applyShading(dbg_shadedDiffuseColor) * dbg_color, 1.);
    #else
        gl_FragColor = vec4(dbg_color, 1.);
    #endif
#endif
#endif`;
const fragmentMainEndWebGPU = `#if defined(DBG_ENABLED)
var dbg_color = vec3f(1.);
#if DBG_MODE == 1
    dbg_color = mix(uniforms.dbg_wireframeTrianglesColor, vec3f(1.), dbg_edgeFactor());
#elif DBG_MODE == 2 || DBG_MODE == 3
    var dbg_cornerFactor = dbg_cornerFactor();
    if (fragmentInputs.dbg_vPass == 0. && dbg_cornerFactor == 1.) discard;
    dbg_color = mix(uniforms.dbg_vertexColor, vec3(1.), dbg_cornerFactor);
    #if DBG_MODE == 3
        dbg_color *= mix(uniforms.dbg_wireframeVerticesColor, vec3f(1.), dbg_edgeFactor());
    #endif
#elif DBG_MODE == 4 && defined(MAINUV1)
    dbg_color = mix(uniforms.dbg_uvPrimaryColor, uniforms.dbg_uvSecondaryColor, dbg_checkerboardFactor(fragmentInputs.vMainUV1));
#elif DBG_MODE == 5 && defined(MAINUV2)
    dbg_color = mix(uniforms.dbg_uvPrimaryColor, uniforms.dbg_uvSecondaryColor, dbg_checkerboardFactor(fragmentInputs.vMainUV2));
#elif DBG_MODE == 6 && defined(VERTEXCOLOR)
    dbg_color = fragmentInputs.vColor.rgb;
#elif DBG_MODE == 7
    dbg_color = uniforms.dbg_materialColor;
#endif

#if defined(DBG_MULTIPLY)
    fragmentOutputs.color *= vec4f(dbg_color, 1.);
#else
    #if DBG_MODE != 6
        fragmentOutputs.color = vec4f(dbg_applyShading(dbg_shadedDiffuseColor) * dbg_color, 1.);
    #else
        fragmentOutputs.color = vec4f(dbg_color, 1.);
    #endif
#endif
#endif`;
const defaultMaterialColors = [
    new Color3(0.98, 0.26, 0.38),
    new Color3(0.47, 0.75, 0.3),
    new Color3(0, 0.26, 0.77),
    new Color3(0.97, 0.6, 0.76),
    new Color3(0.19, 0.63, 0.78),
    new Color3(0.98, 0.8, 0.6),
    new Color3(0.65, 0.43, 0.15),
    new Color3(0.15, 0.47, 0.22),
    new Color3(0.67, 0.71, 0.86),
    new Color3(0.09, 0.46, 0.56),
    new Color3(0.8, 0.98, 0.02),
    new Color3(0.39, 0.29, 0.13),
    new Color3(0.53, 0.63, 0.06),
    new Color3(0.95, 0.96, 0.41),
    new Color3(1, 0.72, 0.94),
    new Color3(0.63, 0.08, 0.31),
    new Color3(0.66, 0.96, 0.95),
    new Color3(0.22, 0.14, 0.19),
    new Color3(0.14, 0.65, 0.59),
    new Color3(0.93, 1, 0.68),
    new Color3(0.93, 0.14, 0.44),
    new Color3(0.47, 0.86, 0.67),
    new Color3(0.85, 0.07, 0.78),
    new Color3(0.53, 0.64, 0.98),
    new Color3(0.43, 0.37, 0.56),
    new Color3(0.71, 0.65, 0.25),
    new Color3(0.66, 0.19, 0.01),
    new Color3(0.94, 0.53, 0.12),
    new Color3(0.41, 0.44, 0.44),
    new Color3(0.24, 0.71, 0.96),
    new Color3(0.57, 0.28, 0.56),
    new Color3(0.44, 0.98, 0.42),
];
/**
 * Supported visualizations of MeshDebugPluginMaterial
 */
export var MeshDebugMode;
(function (MeshDebugMode) {
    /**
     * Material without any mesh debug visualization
     */
    MeshDebugMode[MeshDebugMode["NONE"] = 0] = "NONE";
    /**
     * A wireframe of the mesh
     * NOTE: For this mode to work correctly, convertToUnIndexedMesh() or MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    MeshDebugMode[MeshDebugMode["TRIANGLES"] = 1] = "TRIANGLES";
    /**
     * Points drawn over vertices of mesh
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    MeshDebugMode[MeshDebugMode["VERTICES"] = 2] = "VERTICES";
    /**
     * A wireframe of the mesh, with points drawn over vertices
     * NOTE: For this mode to work correctly, MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() must first be called on mesh.
     */
    MeshDebugMode[MeshDebugMode["TRIANGLES_VERTICES"] = 3] = "TRIANGLES_VERTICES";
    /**
     * A checkerboard grid of the mesh's UV set 0
     */
    MeshDebugMode[MeshDebugMode["UV0"] = 4] = "UV0";
    /**
     * A checkerboard grid of the mesh's UV set 1
     */
    MeshDebugMode[MeshDebugMode["UV1"] = 5] = "UV1";
    /**
     * The mesh's vertex colors displayed as the primary texture
     */
    MeshDebugMode[MeshDebugMode["VERTEXCOLORS"] = 6] = "VERTEXCOLORS";
    /**
     * An arbitrary, distinguishable color to identify the material
     */
    MeshDebugMode[MeshDebugMode["MATERIALIDS"] = 7] = "MATERIALIDS";
})(MeshDebugMode || (MeshDebugMode = {}));
/** @internal */
class MeshDebugDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        /**
         * Current mesh debug visualization.
         * Defaults to NONE.
         */
        this.DBG_MODE = 0 /* MeshDebugMode.NONE */;
        /**
         * Whether the mesh debug visualization multiplies with colors underneath.
         * Defaults to true.
         */
        this.DBG_MULTIPLY = true;
        /**
         * Whether the mesh debug plugin is enabled in the material.
         * Defaults to true.
         */
        this.DBG_ENABLED = true;
    }
}
/**
 * Plugin that implements various mesh debug visualizations,
 * List of available visualizations can be found in MeshDebugMode enum.
 */
export class MeshDebugPluginMaterial extends MaterialPluginBase {
    /** @internal */
    _markAllDefinesAsDirty() {
        this._enable(this._isEnabled);
        this.markAllDefinesAsDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @param shaderLanguage The shader language to use.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible(shaderLanguage) {
        switch (shaderLanguage) {
            case 0 /* ShaderLanguage.GLSL */:
            case 1 /* ShaderLanguage.WGSL */:
                return true;
            default:
                return false;
        }
    }
    /**
     * Creates a new MeshDebugPluginMaterial
     * @param material Material to attach the mesh debug plugin to
     * @param options Options for the mesh debug plugin
     */
    constructor(material, options = {}) {
        const defines = new MeshDebugDefines();
        defines.DBG_MODE = options.mode ?? defines.DBG_MODE;
        defines.DBG_MULTIPLY = options.multiply ?? defines.DBG_MULTIPLY;
        super(material, "MeshDebug", 200, defines, true, true);
        this._mode = defines.DBG_MODE;
        this._multiply = defines.DBG_MULTIPLY;
        this.shadedDiffuseColor = options.shadedDiffuseColor ?? new Color3(1, 1, 1);
        this.shadedSpecularColor = options.shadedSpecularColor ?? new Color3(0.8, 0.8, 0.8);
        this.shadedSpecularPower = options.shadedSpecularPower ?? 10;
        this.wireframeThickness = options.wireframeThickness ?? 0.7;
        this.wireframeTrianglesColor = options.wireframeTrianglesColor ?? new Color3(0, 0, 0);
        this.wireframeVerticesColor = options.wireframeVerticesColor ?? new Color3(0.8, 0.8, 0.8);
        this.vertexColor = options.vertexColor ?? new Color3(0, 0, 0);
        this.vertexRadius = options.vertexRadius ?? 1.2;
        this.uvScale = options.uvScale ?? 20;
        this.uvPrimaryColor = options.uvPrimaryColor ?? new Color3(1, 1, 1);
        this.uvSecondaryColor = options.uvSecondaryColor ?? new Color3(0.5, 0.5, 0.5);
        this._materialColor = MeshDebugPluginMaterial.MaterialColors[MeshDebugPluginMaterial._PluginCount++ % MeshDebugPluginMaterial.MaterialColors.length];
        this.isEnabled = true;
    }
    /**
     * Get the class name
     * @returns Class name
     */
    getClassName() {
        return "MeshDebugPluginMaterial";
    }
    /**
     * Gets whether the mesh debug plugin is enabled in the material.
     */
    get isEnabled() {
        return this._isEnabled;
    }
    /**
     * Sets whether the mesh debug plugin is enabled in the material.
     * @param value enabled
     */
    set isEnabled(value) {
        if (this._isEnabled === value) {
            return;
        }
        if (!this._material.getScene().getEngine().isWebGPU && this._material.getScene().getEngine().version == 1) {
            Logger.Error("MeshDebugPluginMaterial is not supported on WebGL 1.0.");
            this._isEnabled = false;
            return;
        }
        this._isEnabled = value;
        this._markAllDefinesAsDirty();
    }
    /**
     * Prepare the defines
     * @param defines Mesh debug defines
     * @param scene Scene
     * @param mesh Mesh associated with material
     */
    prepareDefines(defines, scene, mesh) {
        if ((this._mode == 2 /* MeshDebugMode.VERTICES */ || this._mode == 1 /* MeshDebugMode.TRIANGLES */ || this._mode == 3 /* MeshDebugMode.TRIANGLES_VERTICES */) &&
            !mesh.isVerticesDataPresent("dbg_initialPass")) {
            Logger.Warn("For best results with TRIANGLES, TRIANGLES_VERTICES, or VERTICES modes, please use MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode() on mesh.", 1);
        }
        defines.DBG_MODE = this._mode;
        defines.DBG_MULTIPLY = this._multiply;
        defines.DBG_ENABLED = this._isEnabled;
    }
    /**
     * Get the shader attributes
     * @param attributes Array of attributes
     */
    getAttributes(attributes) {
        attributes.push("dbg_initialPass");
    }
    /**
     * Get the shader uniforms
     * @param shaderLanguage The shader language to use.
     * @returns Uniforms
     */
    getUniforms(shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        return {
            ubo: [
                { name: "dbg_shadedDiffuseColor", size: 3, type: "vec3" },
                { name: "dbg_shadedSpecularColorPower", size: 4, type: "vec4" }, // shadedSpecularColor, shadedSpecularPower
                { name: "dbg_thicknessRadiusScale", size: 3, type: "vec3" }, // wireframeThickness, vertexRadius, uvScale
                { name: "dbg_wireframeTrianglesColor", size: 3, type: "vec3" },
                { name: "dbg_wireframeVerticesColor", size: 3, type: "vec3" },
                { name: "dbg_vertexColor", size: 3, type: "vec3" },
                { name: "dbg_uvPrimaryColor", size: 3, type: "vec3" },
                { name: "dbg_uvSecondaryColor", size: 3, type: "vec3" },
                { name: "dbg_materialColor", size: 3, type: "vec3" },
            ],
            fragment: shaderLanguage === 0 /* ShaderLanguage.GLSL */ ? fragmentUniforms : fragmentUniformsWebGPU,
        };
    }
    /**
     * Bind the uniform buffer
     * @param uniformBuffer Uniform buffer
     */
    bindForSubMesh(uniformBuffer) {
        if (!this._isEnabled) {
            return;
        }
        uniformBuffer.updateFloat3("dbg_shadedDiffuseColor", this.shadedDiffuseColor.r, this.shadedDiffuseColor.g, this.shadedDiffuseColor.b);
        uniformBuffer.updateFloat4("dbg_shadedSpecularColorPower", this.shadedSpecularColor.r, this.shadedSpecularColor.g, this.shadedSpecularColor.b, this.shadedSpecularPower);
        uniformBuffer.updateFloat3("dbg_thicknessRadiusScale", this.wireframeThickness, this.vertexRadius, this.uvScale);
        uniformBuffer.updateColor3("dbg_wireframeTrianglesColor", this.wireframeTrianglesColor);
        uniformBuffer.updateColor3("dbg_wireframeVerticesColor", this.wireframeVerticesColor);
        uniformBuffer.updateColor3("dbg_vertexColor", this.vertexColor);
        uniformBuffer.updateColor3("dbg_uvPrimaryColor", this.uvPrimaryColor);
        uniformBuffer.updateColor3("dbg_uvSecondaryColor", this.uvSecondaryColor);
        uniformBuffer.updateColor3("dbg_materialColor", this._materialColor);
    }
    /**
     * Get shader code
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage The shader language to use.
     * @returns Shader code
     */
    getCustomCode(shaderType, shaderLanguage = 0 /* ShaderLanguage.GLSL */) {
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            return shaderType === "vertex"
                ? {
                    CUSTOM_VERTEX_DEFINITIONS: vertexDefinitionsWebGPU,
                    CUSTOM_VERTEX_MAIN_END: vertexMainEndWebGPU,
                }
                : {
                    CUSTOM_FRAGMENT_DEFINITIONS: fragmentDefinitionsWebGPU,
                    CUSTOM_FRAGMENT_MAIN_END: fragmentMainEndWebGPU,
                };
        }
        return shaderType === "vertex"
            ? {
                CUSTOM_VERTEX_DEFINITIONS: vertexDefinitions,
                CUSTOM_VERTEX_MAIN_END: vertexMainEnd,
            }
            : {
                CUSTOM_FRAGMENT_DEFINITIONS: fragmentDefinitions,
                CUSTOM_FRAGMENT_MAIN_END: fragmentMainEnd,
            };
    }
    /**
     * Resets static variables of the plugin to their original state
     */
    static Reset() {
        this._PluginCount = 0;
        this.MaterialColors = defaultMaterialColors;
    }
    /**
     * Renders triangles in a mesh 3 times by tripling the indices in the index buffer.
     * Used to prepare a mesh to be rendered in `TRIANGLES`, `VERTICES`, or `TRIANGLES_VERTICES` modes.
     * NOTE: This is a destructive operation. The mesh's index buffer and vertex buffers are modified, and a new vertex buffer is allocated.
     * If you'd like the ability to revert these changes, toggle the optional `returnRollback` flag.
     * @param mesh the mesh to target
     * @param returnRollback whether or not to return a function that reverts mesh to its initial state. Default: false.
     * @returns a rollback function if `returnRollback` is true, otherwise an empty function.
     */
    static PrepareMeshForTrianglesAndVerticesMode(mesh, returnRollback = false) {
        let rollback = () => { };
        if (mesh.getTotalIndices() == 0)
            return rollback;
        if (returnRollback) {
            const kinds = mesh.getVerticesDataKinds();
            const indices = mesh.getIndices();
            const data = {};
            for (const kind of kinds) {
                data[kind] = mesh.getVerticesData(kind);
            }
            rollback = function () {
                mesh.setIndices(indices);
                for (const kind of kinds) {
                    const stride = mesh.getVertexBuffer(kind).getStrideSize();
                    mesh.setVerticesData(kind, data[kind], undefined, stride);
                }
                mesh.removeVerticesData("dbg_initialPass");
            };
        }
        let indices = Array.from(mesh.getIndices());
        const newIndices1 = [];
        for (let i = 0; i < indices.length; i += 3) {
            newIndices1.push(indices[i + 1], indices[i + 2], indices[i + 0]);
        }
        mesh.setIndices(indices.concat(newIndices1));
        mesh.convertToUnIndexedMesh();
        mesh.isUnIndexed = false;
        indices = Array.from(mesh.getIndices());
        const newIndices2 = [];
        for (let i = indices.length / 2; i < indices.length; i += 3) {
            newIndices2.push(indices[i + 1], indices[i + 2], indices[i + 0]);
        }
        mesh.setIndices(indices.concat(newIndices2));
        const num = mesh.getTotalVertices();
        const mid = num / 2;
        const pass = new Array(num).fill(1, 0, mid).fill(0, mid, num);
        mesh.setVerticesData("dbg_initialPass", pass, false, 1);
        return rollback;
    }
}
/**
 * Total number of instances of the plugin.
 * Starts at 0.
 */
MeshDebugPluginMaterial._PluginCount = 0;
/**
 * Color palette used for MATERIALIDS mode.
 * Defaults to `defaultMaterialColors`
 */
MeshDebugPluginMaterial.MaterialColors = defaultMaterialColors;
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "_materialColor", void 0);
__decorate([
    serialize()
], MeshDebugPluginMaterial.prototype, "_isEnabled", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllDefinesAsDirty")
], MeshDebugPluginMaterial.prototype, "mode", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllDefinesAsDirty")
], MeshDebugPluginMaterial.prototype, "multiply", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "shadedDiffuseColor", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "shadedSpecularColor", void 0);
__decorate([
    serialize()
], MeshDebugPluginMaterial.prototype, "shadedSpecularPower", void 0);
__decorate([
    serialize()
], MeshDebugPluginMaterial.prototype, "wireframeThickness", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "wireframeTrianglesColor", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "wireframeVerticesColor", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "vertexColor", void 0);
__decorate([
    serialize()
], MeshDebugPluginMaterial.prototype, "vertexRadius", void 0);
__decorate([
    serialize()
], MeshDebugPluginMaterial.prototype, "uvScale", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "uvPrimaryColor", void 0);
__decorate([
    serializeAsColor3()
], MeshDebugPluginMaterial.prototype, "uvSecondaryColor", void 0);
RegisterClass("BABYLON.MeshDebugPluginMaterial", MeshDebugPluginMaterial);
//# sourceMappingURL=meshDebugPluginMaterial.js.map