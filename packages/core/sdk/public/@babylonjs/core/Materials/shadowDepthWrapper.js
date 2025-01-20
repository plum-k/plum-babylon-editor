import { Effect } from "./effect.js";
import { RandomGUID } from "../Misc/guid.js";
import { DrawWrapper } from "./drawWrapper.js";
import { EngineStore } from "../Engines/engineStore.js";
class MapMap {
    constructor() {
        this.mm = new Map();
    }
    get(a, b) {
        const m = this.mm.get(a);
        if (m !== undefined) {
            return m.get(b);
        }
        return undefined;
    }
    set(a, b, v) {
        let m = this.mm.get(a);
        if (m === undefined) {
            this.mm.set(a, (m = new Map()));
        }
        m.set(b, v);
    }
}
/**
 * Class that can be used to wrap a base material to generate accurate shadows when using custom vertex/fragment code in the base material
 */
export class ShadowDepthWrapper {
    /** Gets the standalone status of the wrapper */
    get standalone() {
        return this._options?.standalone ?? false;
    }
    /** Gets the base material the wrapper is built upon */
    get baseMaterial() {
        return this._baseMaterial;
    }
    /** Gets the doNotInjectCode status of the wrapper */
    get doNotInjectCode() {
        return this._options?.doNotInjectCode ?? false;
    }
    /**
     * Instantiate a new shadow depth wrapper.
     * It works by injecting some specific code in the vertex/fragment shaders of the base material and is used by a shadow generator to
     * generate the shadow depth map. For more information, please refer to the documentation:
     * https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows
     * @param baseMaterial Material to wrap
     * @param scene Define the scene the material belongs to
     * @param options Options used to create the wrapper
     */
    constructor(baseMaterial, scene, options) {
        this._baseMaterial = baseMaterial;
        this._scene = scene ?? EngineStore.LastCreatedScene;
        this._options = options;
        this._subMeshToEffect = new Map();
        this._subMeshToDepthWrapper = new MapMap();
        this._meshes = new Map();
        // Register for onEffectCreated to store the effect of the base material when it is (re)generated. This effect will be used
        // to create the depth effect later on
        this._onEffectCreatedObserver = this._baseMaterial.onEffectCreatedObservable.add((params) => {
            const mesh = params.subMesh?.getMesh();
            if (mesh && !this._meshes.has(mesh)) {
                // Register for mesh onDispose to clean up our internal maps when a mesh is disposed
                this._meshes.set(mesh, mesh.onDisposeObservable.add((mesh) => {
                    const iterator = this._subMeshToEffect.keys();
                    for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                        const subMesh = key.value;
                        if (subMesh?.getMesh() === mesh) {
                            this._subMeshToEffect.delete(subMesh);
                            this._deleteDepthWrapperEffect(subMesh);
                        }
                    }
                }));
            }
            if (this._subMeshToEffect.get(params.subMesh)?.[0] !== params.effect) {
                this._subMeshToEffect.set(params.subMesh, [params.effect, this._scene.getEngine().currentRenderPassId]);
                this._deleteDepthWrapperEffect(params.subMesh);
            }
        });
    }
    _deleteDepthWrapperEffect(subMesh) {
        const depthWrapperEntries = this._subMeshToDepthWrapper.mm.get(subMesh);
        if (depthWrapperEntries) {
            // find and release the previous depth effect
            depthWrapperEntries.forEach((depthWrapper) => {
                depthWrapper.mainDrawWrapper.effect?.dispose();
            });
            this._subMeshToDepthWrapper.mm.delete(subMesh); // trigger a depth effect recreation
        }
    }
    /**
     * Gets the effect to use to generate the depth map
     * @param subMesh subMesh to get the effect for
     * @param shadowGenerator shadow generator to get the effect for
     * @param passIdForDrawWrapper Id of the pass for which the effect from the draw wrapper must be retrieved from
     * @returns the effect to use to generate the depth map for the subMesh + shadow generator specified
     */
    getEffect(subMesh, shadowGenerator, passIdForDrawWrapper) {
        const entry = this._subMeshToDepthWrapper.mm.get(subMesh)?.get(shadowGenerator);
        if (!entry) {
            return null;
        }
        let drawWrapper = entry.drawWrapper[passIdForDrawWrapper];
        if (!drawWrapper) {
            drawWrapper = entry.drawWrapper[passIdForDrawWrapper] = new DrawWrapper(this._scene.getEngine());
            drawWrapper.setEffect(entry.mainDrawWrapper.effect, entry.mainDrawWrapper.defines);
        }
        return drawWrapper;
    }
    /**
     * Specifies that the submesh is ready to be used for depth rendering
     * @param subMesh submesh to check
     * @param defines the list of defines to take into account when checking the effect
     * @param shadowGenerator combined with subMesh, it defines the effect to check
     * @param useInstances specifies that instances should be used
     * @param passIdForDrawWrapper Id of the pass for which the draw wrapper should be created
     * @returns a boolean indicating that the submesh is ready or not
     */
    isReadyForSubMesh(subMesh, defines, shadowGenerator, useInstances, passIdForDrawWrapper) {
        if (this.standalone) {
            // will ensure the effect is (re)created for the base material
            if (!this._baseMaterial.isReadyForSubMesh(subMesh.getMesh(), subMesh, useInstances)) {
                return false;
            }
        }
        return this._makeEffect(subMesh, defines, shadowGenerator, passIdForDrawWrapper)?.isReady() ?? false;
    }
    /**
     * Disposes the resources
     */
    dispose() {
        this._baseMaterial.onEffectCreatedObservable.remove(this._onEffectCreatedObserver);
        this._onEffectCreatedObserver = null;
        const iterator = this._meshes.entries();
        for (let entry = iterator.next(); entry.done !== true; entry = iterator.next()) {
            const [mesh, observer] = entry.value;
            mesh.onDisposeObservable.remove(observer);
        }
    }
    _makeEffect(subMesh, defines, shadowGenerator, passIdForDrawWrapper) {
        const engine = this._scene.getEngine();
        const origEffectAndRenderPassId = this._subMeshToEffect.get(subMesh);
        if (!origEffectAndRenderPassId) {
            return null;
        }
        const [origEffect, origRenderPassId] = origEffectAndRenderPassId;
        let params = this._subMeshToDepthWrapper.get(subMesh, shadowGenerator);
        if (!params) {
            const mainDrawWrapper = new DrawWrapper(engine);
            mainDrawWrapper.defines = subMesh._getDrawWrapper(origRenderPassId)?.defines ?? null;
            params = {
                drawWrapper: [],
                mainDrawWrapper,
                depthDefines: "",
                token: RandomGUID(),
            };
            params.drawWrapper[passIdForDrawWrapper] = mainDrawWrapper;
            this._subMeshToDepthWrapper.set(subMesh, shadowGenerator, params);
        }
        const join = defines.join("\n");
        if (params.mainDrawWrapper.effect) {
            if (join === params.depthDefines) {
                // we already created the depth effect and it is still up to date for this submesh + shadow generator
                return params.mainDrawWrapper.effect;
            }
        }
        params.depthDefines = join;
        const uniforms = origEffect.getUniformNames().slice();
        // the depth effect is either out of date or has not been created yet
        let vertexCode = origEffect.vertexSourceCodeBeforeMigration, fragmentCode = origEffect.fragmentSourceCodeBeforeMigration;
        if (!this.doNotInjectCode) {
            // Declare the shadow map includes
            const vertexNormalBiasCode = this._options && this._options.remappedVariables
                ? `#include<shadowMapVertexNormalBias>(${this._options.remappedVariables.join(",")})`
                : `#include<shadowMapVertexNormalBias>`, vertexMetricCode = this._options && this._options.remappedVariables
                ? `#include<shadowMapVertexMetric>(${this._options.remappedVariables.join(",")})`
                : `#include<shadowMapVertexMetric>`, fragmentSoftTransparentShadow = this._options && this._options.remappedVariables
                ? `#include<shadowMapFragmentSoftTransparentShadow>(${this._options.remappedVariables.join(",")})`
                : `#include<shadowMapFragmentSoftTransparentShadow>`, fragmentBlockCode = `#include<shadowMapFragment>`, vertexExtraDeclartion = `#include<shadowMapVertexExtraDeclaration>`;
            // vertex code
            if (origEffect.shaderLanguage === 0 /* ShaderLanguage.GLSL */) {
                vertexCode = vertexCode.replace(/void\s+?main/g, `\n${vertexExtraDeclartion}\nvoid main`);
            }
            else {
                vertexCode = vertexCode.replace(/@vertex/g, `\n${vertexExtraDeclartion}\n@vertex`);
            }
            vertexCode = vertexCode.replace(/#define SHADOWDEPTH_NORMALBIAS|#define CUSTOM_VERTEX_UPDATE_WORLDPOS/g, vertexNormalBiasCode);
            if (vertexCode.indexOf("#define SHADOWDEPTH_METRIC") !== -1) {
                vertexCode = vertexCode.replace(/#define SHADOWDEPTH_METRIC/g, vertexMetricCode);
            }
            else {
                vertexCode = vertexCode.replace(/}\s*$/g, vertexMetricCode + "\n}");
            }
            vertexCode = vertexCode.replace(/#define SHADER_NAME.*?\n|out vec4 glFragColor;\n/g, "");
            // fragment code
            const hasLocationForSoftTransparentShadow = fragmentCode.indexOf("#define SHADOWDEPTH_SOFTTRANSPARENTSHADOW") >= 0 || fragmentCode.indexOf("#define CUSTOM_FRAGMENT_BEFORE_FOG") >= 0;
            const hasLocationForFragment = fragmentCode.indexOf("#define SHADOWDEPTH_FRAGMENT") !== -1;
            let fragmentCodeToInjectAtEnd = "";
            if (!hasLocationForSoftTransparentShadow) {
                fragmentCodeToInjectAtEnd = fragmentSoftTransparentShadow + "\n";
            }
            else {
                fragmentCode = fragmentCode.replace(/#define SHADOWDEPTH_SOFTTRANSPARENTSHADOW|#define CUSTOM_FRAGMENT_BEFORE_FOG/g, fragmentSoftTransparentShadow);
            }
            fragmentCode = fragmentCode.replace(/void\s+?main/g, Effect.IncludesShadersStore["shadowMapFragmentExtraDeclaration"] + "\nvoid main");
            if (hasLocationForFragment) {
                fragmentCode = fragmentCode.replace(/#define SHADOWDEPTH_FRAGMENT/g, fragmentBlockCode);
            }
            else {
                fragmentCodeToInjectAtEnd += fragmentBlockCode + "\n";
            }
            if (fragmentCodeToInjectAtEnd) {
                fragmentCode = fragmentCode.replace(/}\s*$/g, fragmentCodeToInjectAtEnd + "}");
            }
            uniforms.push("biasAndScaleSM", "depthValuesSM", "lightDataSM", "softTransparentShadowSM");
        }
        params.mainDrawWrapper.effect = engine.createEffect({
            vertexSource: vertexCode,
            fragmentSource: fragmentCode,
            vertexToken: params.token,
            fragmentToken: params.token,
        }, {
            attributes: origEffect.getAttributesNames(),
            uniformsNames: uniforms,
            uniformBuffersNames: origEffect.getUniformBuffersNames(),
            samplers: origEffect.getSamplers(),
            defines: join + "\n" + origEffect.defines.replace("#define SHADOWS", "").replace(/#define SHADOW\d/g, ""),
            indexParameters: origEffect.getIndexParameters(),
            shaderLanguage: origEffect.shaderLanguage,
        }, engine);
        for (let id = 0; id < params.drawWrapper.length; ++id) {
            if (id !== passIdForDrawWrapper) {
                params.drawWrapper[id]?.setEffect(params.mainDrawWrapper.effect, params.mainDrawWrapper.defines);
            }
        }
        return params.mainDrawWrapper.effect;
    }
}
//# sourceMappingURL=shadowDepthWrapper.js.map