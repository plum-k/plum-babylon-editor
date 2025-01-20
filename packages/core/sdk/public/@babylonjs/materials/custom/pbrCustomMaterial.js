import { Effect } from "@babylonjs/core/Materials/effect.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import { ShaderCodeInliner } from "@babylonjs/core/Engines/Processors/shaderCodeInliner.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import "@babylonjs/core/Shaders/pbr.vertex.js";
import "@babylonjs/core/Shaders/pbr.fragment.js";
/**
 * Albedo parts of the shader
 */
export class ShaderAlbedoParts {
    constructor() { }
}
/**
 * @deprecated use ShaderAlbedoParts instead.
 */
export const ShaderAlebdoParts = ShaderAlbedoParts;
export class PBRCustomMaterial extends PBRMaterial {
    /**
     * Runs after the material is bound to a mesh
     * @param mesh mesh bound
     * @param effect bound effect used to render
     */
    AttachAfterBind(mesh, effect) {
        if (this._newUniformInstances) {
            for (const el in this._newUniformInstances) {
                const ea = el.toString().split("-");
                if (ea[0] == "vec2") {
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == "vec3") {
                    if (this._newUniformInstances[el] instanceof Color3) {
                        effect.setColor3(ea[1], this._newUniformInstances[el]);
                    }
                    else {
                        effect.setVector3(ea[1], this._newUniformInstances[el]);
                    }
                }
                else if (ea[0] == "vec4") {
                    if (this._newUniformInstances[el] instanceof Color4) {
                        effect.setDirectColor4(ea[1], this._newUniformInstances[el]);
                    }
                    else {
                        effect.setVector4(ea[1], this._newUniformInstances[el]);
                    }
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == "mat4") {
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == "float") {
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
                }
            }
        }
        if (this._newSamplerInstances) {
            for (const el in this._newSamplerInstances) {
                const ea = el.toString().split("-");
                if (ea[0] == "sampler2D" && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }
    }
    /**
     * @internal
     */
    ReviewUniform(name, arr) {
        if (name == "uniform" && this._newUniforms) {
            for (let ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf("sampler") == -1) {
                    arr.push(this._newUniforms[ind].replace(/\[\d*\]/g, ""));
                }
            }
        }
        if (name == "sampler" && this._newUniforms) {
            for (let ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf("sampler") != -1) {
                    arr.push(this._newUniforms[ind].replace(/\[\d*\]/g, ""));
                }
            }
        }
        return arr;
    }
    /**
     * Builds the material
     * @param shaderName name of the shader
     * @param uniforms list of uniforms
     * @param uniformBuffers list of uniform buffers
     * @param samplers list of samplers
     * @param defines list of defines
     * @param attributes list of attributes
     * @param options options to compile the shader
     * @returns the shader name
     */
    Builder(shaderName, uniforms, uniformBuffers, samplers, defines, attributes, options) {
        if (options) {
            const currentProcessing = options.processFinalCode;
            options.processFinalCode = (type, code) => {
                if (type === "vertex") {
                    return currentProcessing ? currentProcessing(type, code) : code;
                }
                const sci = new ShaderCodeInliner(code);
                sci.inlineToken = "#define pbr_inline";
                sci.processCode();
                return currentProcessing ? currentProcessing(type, sci.code) : sci.code;
            };
        }
        if (attributes && this._customAttributes && this._customAttributes.length > 0) {
            attributes.push(...this._customAttributes);
        }
        this.ReviewUniform("uniform", uniforms);
        this.ReviewUniform("sampler", samplers);
        const name = this._createdShaderName;
        if (Effect.ShadersStore[name + "VertexShader"] && Effect.ShadersStore[name + "PixelShader"]) {
            return name;
        }
        Effect.ShadersStore[name + "VertexShader"] = this._injectCustomCode(this.VertexShader, "vertex");
        Effect.ShadersStore[name + "PixelShader"] = this._injectCustomCode(this.FragmentShader, "fragment");
        return name;
    }
    _injectCustomCode(code, shaderType) {
        const customCode = this._getCustomCode(shaderType);
        for (const point in customCode) {
            const injectedCode = customCode[point];
            if (injectedCode && injectedCode.length > 0) {
                const fullPointName = "#define " + point;
                code = code.replace(fullPointName, "\n" + injectedCode + "\n" + fullPointName);
            }
        }
        return code;
    }
    _getCustomCode(shaderType) {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_BEGIN: this.CustomParts.Vertex_Begin,
                CUSTOM_VERTEX_DEFINITIONS: (this._customUniform?.join("\n") || "") + (this.CustomParts.Vertex_Definitions || ""),
                CUSTOM_VERTEX_MAIN_BEGIN: this.CustomParts.Vertex_MainBegin,
                CUSTOM_VERTEX_UPDATE_POSITION: this.CustomParts.Vertex_Before_PositionUpdated,
                CUSTOM_VERTEX_UPDATE_NORMAL: this.CustomParts.Vertex_Before_NormalUpdated,
                CUSTOM_VERTEX_MAIN_END: this.CustomParts.Vertex_MainEnd,
                CUSTOM_VERTEX_UPDATE_WORLDPOS: this.CustomParts.Vertex_After_WorldPosComputed,
            };
        }
        return {
            CUSTOM_FRAGMENT_BEGIN: this.CustomParts.Fragment_Begin,
            CUSTOM_FRAGMENT_MAIN_BEGIN: this.CustomParts.Fragment_MainBegin,
            CUSTOM_FRAGMENT_DEFINITIONS: (this._customUniform?.join("\n") || "") + (this.CustomParts.Fragment_Definitions || ""),
            CUSTOM_FRAGMENT_UPDATE_ALBEDO: this.CustomParts.Fragment_Custom_Albedo,
            CUSTOM_FRAGMENT_UPDATE_ALPHA: this.CustomParts.Fragment_Custom_Alpha,
            CUSTOM_FRAGMENT_BEFORE_LIGHTS: this.CustomParts.Fragment_Before_Lights,
            CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS: this.CustomParts.Fragment_Custom_MetallicRoughness,
            CUSTOM_FRAGMENT_UPDATE_MICROSURFACE: this.CustomParts.Fragment_Custom_MicroSurface,
            CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: this.CustomParts.Fragment_Before_FinalColorComposition,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: this.CustomParts.Fragment_Before_FragColor,
            CUSTOM_FRAGMENT_MAIN_END: this.CustomParts.Fragment_MainEnd,
            CUSTOM_FRAGMENT_BEFORE_FOG: this.CustomParts.Fragment_Before_Fog,
        };
    }
    constructor(name, scene) {
        super(name, scene, true);
        this.CustomParts = new ShaderAlbedoParts();
        this.customShaderNameResolve = this.Builder;
        this.FragmentShader = Effect.ShadersStore["pbrPixelShader"];
        this.VertexShader = Effect.ShadersStore["pbrVertexShader"];
        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockAlbedoOpacity>/g, Effect.IncludesShadersStore["pbrBlockAlbedoOpacity"]);
        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockReflectivity>/g, Effect.IncludesShadersStore["pbrBlockReflectivity"]);
        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockFinalColorComposition>/g, Effect.IncludesShadersStore["pbrBlockFinalColorComposition"]);
        PBRCustomMaterial.ShaderIndexer++;
        this._createdShaderName = "custompbr_" + PBRCustomMaterial.ShaderIndexer;
    }
    _afterBind(mesh, effect = null, subMesh) {
        if (!effect) {
            return;
        }
        this.AttachAfterBind(mesh, effect);
        try {
            super._afterBind(mesh, effect, subMesh);
        }
        catch (e) { }
    }
    /**
     * Adds a new uniform to the shader
     * @param name the name of the uniform to add
     * @param kind the type of the uniform to add
     * @param param the value of the uniform to add
     * @returns the current material
     */
    AddUniform(name, kind, param) {
        if (!this._customUniform) {
            this._customUniform = new Array();
            this._newUniforms = new Array();
            this._newSamplerInstances = {};
            this._newUniformInstances = {};
        }
        if (param) {
            if (kind.indexOf("sampler") != -1) {
                this._newSamplerInstances[kind + "-" + name] = param;
            }
            else {
                this._newUniformInstances[kind + "-" + name] = param;
            }
        }
        this._customUniform.push("uniform " + kind + " " + name + ";");
        this._newUniforms.push(name);
        return this;
    }
    /**
     * Adds a custom attribute
     * @param name the name of the attribute
     * @returns the current material
     */
    AddAttribute(name) {
        if (!this._customAttributes) {
            this._customAttributes = [];
        }
        this._customAttributes.push(name);
        return this;
    }
    /**
     * Sets the code on Fragment_Begin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Begin(shaderPart) {
        this.CustomParts.Fragment_Begin = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Definitions portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Definitions(shaderPart) {
        this.CustomParts.Fragment_Definitions = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_MainBegin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_MainBegin(shaderPart) {
        this.CustomParts.Fragment_MainBegin = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Custom_Albedo portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Custom_Albedo(shaderPart) {
        this.CustomParts.Fragment_Custom_Albedo = shaderPart.replace("result", "surfaceAlbedo");
        return this;
    }
    /**
     * Sets the code on Fragment_Custom_Alpha portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Custom_Alpha(shaderPart) {
        this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
        return this;
    }
    /**
     * Sets the code on Fragment_Before_Lights portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Before_Lights(shaderPart) {
        this.CustomParts.Fragment_Before_Lights = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Custom_MetallicRoughness portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Custom_MetallicRoughness(shaderPart) {
        this.CustomParts.Fragment_Custom_MetallicRoughness = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Custom_MicroSurface portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Custom_MicroSurface(shaderPart) {
        this.CustomParts.Fragment_Custom_MicroSurface = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Before_Fog portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Before_Fog(shaderPart) {
        this.CustomParts.Fragment_Before_Fog = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Before_FinalColorComposition portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Before_FinalColorComposition(shaderPart) {
        this.CustomParts.Fragment_Before_FinalColorComposition = shaderPart;
        return this;
    }
    /**
     * Sets the code on Fragment_Before_FragColor portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_Before_FragColor(shaderPart) {
        this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
        return this;
    }
    /**
     * Sets the code on Fragment_MainEnd portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Fragment_MainEnd(shaderPart) {
        this.CustomParts.Fragment_MainEnd = shaderPart;
        return this;
    }
    /**
     * Sets the code on Vertex_Begin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_Begin(shaderPart) {
        this.CustomParts.Vertex_Begin = shaderPart;
        return this;
    }
    /**
     * Sets the code on Vertex_Definitions portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_Definitions(shaderPart) {
        this.CustomParts.Vertex_Definitions = shaderPart;
        return this;
    }
    /**
     * Sets the code on Vertex_MainBegin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_MainBegin(shaderPart) {
        this.CustomParts.Vertex_MainBegin = shaderPart;
        return this;
    }
    /**
     * Sets the code on Vertex_Before_PositionUpdated portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_Before_PositionUpdated(shaderPart) {
        this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
        return this;
    }
    /**
     * Sets the code on Vertex_Before_NormalUpdated portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_Before_NormalUpdated(shaderPart) {
        this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
        return this;
    }
    /**
     * Sets the code on Vertex_After_WorldPosComputed portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_After_WorldPosComputed(shaderPart) {
        this.CustomParts.Vertex_After_WorldPosComputed = shaderPart;
        return this;
    }
    /**
     * Sets the code on Vertex_MainEnd portion
     * @param shaderPart the code string
     * @returns the current material
     */
    Vertex_MainEnd(shaderPart) {
        this.CustomParts.Vertex_MainEnd = shaderPart;
        return this;
    }
}
/**
 * Index for each created shader
 */
PBRCustomMaterial.ShaderIndexer = 1;
RegisterClass("BABYLON.PBRCustomMaterial", PBRCustomMaterial);
//# sourceMappingURL=pbrCustomMaterial.js.map