import { __decorate } from "../../tslib.es6.js";
import { MaterialDefines } from "../../Materials/materialDefines.js";
import { MaterialPluginBase } from "../../Materials/materialPluginBase.js";

import { PBRBaseMaterial } from "../../Materials/PBR/pbrBaseMaterial.js";
import { expandToProperty, serialize } from "../../Misc/decorators.js";
import { RegisterClass } from "../../Misc/typeStore.js";
/**
 * @internal
 */
class MaterialIBLShadowsRenderDefines extends MaterialDefines {
    constructor() {
        super(...arguments);
        this.RENDER_WITH_IBL_SHADOWS = false;
    }
}
/**
 * Plugin used to render the contribution from IBL shadows.
 */
export class IBLShadowsPluginMaterial extends MaterialPluginBase {
    _markAllSubMeshesAsTexturesDirty() {
        this._enable(this._isEnabled);
        this._internalMarkAllSubMeshesAsTexturesDirty();
    }
    /**
     * Gets a boolean indicating that the plugin is compatible with a give shader language.
     * @returns true if the plugin is compatible with the shader language
     */
    isCompatible() {
        return true;
    }
    constructor(material) {
        super(material, IBLShadowsPluginMaterial.Name, 310, new MaterialIBLShadowsRenderDefines());
        /**
         * The opacity of the shadows.
         */
        this.shadowOpacity = 1.0;
        this._isEnabled = false;
        /**
         * Defines if the plugin is enabled in the material.
         */
        this.isEnabled = false;
        this._internalMarkAllSubMeshesAsTexturesDirty = material._dirtyCallbacks[1];
    }
    prepareDefines(defines) {
        defines.RENDER_WITH_IBL_SHADOWS = this._isEnabled;
    }
    getClassName() {
        return "IBLShadowsPluginMaterial";
    }
    getUniforms() {
        return {
            ubo: [
                { name: "renderTargetSize", size: 2, type: "vec2" },
                { name: "shadowOpacity", size: 1, type: "float" },
            ],
            fragment: `#ifdef RENDER_WITH_IBL_SHADOWS
                    uniform vec2 renderTargetSize;
                    uniform float shadowOpacity;
                #endif`,
        };
    }
    getSamplers(samplers) {
        samplers.push("iblShadowsTexture");
    }
    bindForSubMesh(uniformBuffer) {
        if (this._isEnabled) {
            uniformBuffer.bindTexture("iblShadowsTexture", this.iblShadowsTexture);
            uniformBuffer.updateFloat2("renderTargetSize", this._material.getScene().getEngine().getRenderWidth(), this._material.getScene().getEngine().getRenderHeight());
            uniformBuffer.updateFloat("shadowOpacity", this.shadowOpacity);
        }
    }
    getCustomCode(shaderType, shaderLanguage) {
        let frag;
        if (shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    var iblShadowsTextureSampler: sampler;
                    var iblShadowsTexture: texture_2d<f32>;

                    fn computeIndirectShadow() -> vec2f {
                        var uv = fragmentInputs.position.xy / uniforms.renderTargetSize;
                        var shadowValue: vec2f = textureSample(iblShadowsTexture, iblShadowsTextureSampler, uv).rg;
                        return mix(shadowValue, vec2f(1.0), 1.0 - uniforms.shadowOpacity);
                    }
                #endif
            `,
            };
            if (this._material instanceof PBRBaseMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifdef REFLECTION
                        var shadowValue: vec2f = computeIndirectShadow();
                        finalIrradiance *= vec3f(shadowValue.x);
                        finalRadianceScaled *= vec3f(mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness));
                    #endif
                #endif
            `;
            }
            else {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    var shadowValue: vec2f = computeIndirectShadow();
                    color *= toGammaSpace(vec4f(shadowValue.x, shadowValue.x, shadowValue.x, 1.0f));
                #endif
            `;
            }
        }
        else {
            frag = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                CUSTOM_FRAGMENT_DEFINITIONS: `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    uniform sampler2D iblShadowsTexture;

                    vec2 computeIndirectShadow() {
                        vec2 uv = gl_FragCoord.xy / renderTargetSize;
                        vec2 shadowValue = texture2D(iblShadowsTexture, uv).rg;
                        return mix(shadowValue.rg, vec2(1.0), 1.0 - shadowOpacity);
                    }
                #endif
            `,
            };
            if (this._material instanceof PBRBaseMaterial) {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                frag["CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    #ifdef REFLECTION
                        vec2 shadowValue = computeIndirectShadow();
                        finalIrradiance *= shadowValue.x;
                        finalRadianceScaled *= mix(pow(shadowValue.y, 4.0), shadowValue.x, roughness);
                    #endif
                #endif
            `;
            }
            else {
                frag["CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR"] = `
                #ifdef RENDER_WITH_IBL_SHADOWS
                    vec2 shadowValue = computeIndirectShadow();
                    color.rgb *= toGammaSpace(shadowValue.x);
                #endif
            `;
            }
        }
        return shaderType === "vertex" ? null : frag;
    }
}
/**
 * Defines the name of the plugin.
 */
IBLShadowsPluginMaterial.Name = "IBLShadowsPluginMaterial";
__decorate([
    serialize()
], IBLShadowsPluginMaterial.prototype, "iblShadowsTexture", void 0);
__decorate([
    serialize()
], IBLShadowsPluginMaterial.prototype, "shadowOpacity", void 0);
__decorate([
    serialize(),
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], IBLShadowsPluginMaterial.prototype, "isEnabled", void 0);
RegisterClass(`BABYLON.IBLShadowsPluginMaterial`, IBLShadowsPluginMaterial);
//# sourceMappingURL=iblShadowsPluginMaterial.js.map