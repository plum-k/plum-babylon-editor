import { __decorate } from "@babylonjs/core/tslib.es6.js";
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Scene } from "@babylonjs/core/scene.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import "./normal.fragment.js";
import "./normal.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class NormalMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.DIFFUSE = false;
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.ALPHATEST = false;
        this.DEPTHPREPASS = false;
        this.POINTSIZE = false;
        this.FOG = false;
        this.LIGHT0 = false;
        this.LIGHT1 = false;
        this.LIGHT2 = false;
        this.LIGHT3 = false;
        this.SPOTLIGHT0 = false;
        this.SPOTLIGHT1 = false;
        this.SPOTLIGHT2 = false;
        this.SPOTLIGHT3 = false;
        this.HEMILIGHT0 = false;
        this.HEMILIGHT1 = false;
        this.HEMILIGHT2 = false;
        this.HEMILIGHT3 = false;
        this.DIRLIGHT0 = false;
        this.DIRLIGHT1 = false;
        this.DIRLIGHT2 = false;
        this.DIRLIGHT3 = false;
        this.POINTLIGHT0 = false;
        this.POINTLIGHT1 = false;
        this.POINTLIGHT2 = false;
        this.POINTLIGHT3 = false;
        this.SHADOW0 = false;
        this.SHADOW1 = false;
        this.SHADOW2 = false;
        this.SHADOW3 = false;
        this.SHADOWS = false;
        this.SHADOWESM0 = false;
        this.SHADOWESM1 = false;
        this.SHADOWESM2 = false;
        this.SHADOWESM3 = false;
        this.SHADOWPOISSON0 = false;
        this.SHADOWPOISSON1 = false;
        this.SHADOWPOISSON2 = false;
        this.SHADOWPOISSON3 = false;
        this.SHADOWPCF0 = false;
        this.SHADOWPCF1 = false;
        this.SHADOWPCF2 = false;
        this.SHADOWPCF3 = false;
        this.SHADOWPCSS0 = false;
        this.SHADOWPCSS1 = false;
        this.SHADOWPCSS2 = false;
        this.SHADOWPCSS3 = false;
        this.NORMAL = false;
        this.UV1 = false;
        this.UV2 = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.THIN_INSTANCES = false;
        this.LIGHTING = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class NormalMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.diffuseColor = new Color3(1, 1, 1);
        this._disableLighting = false;
        this._maxSimultaneousLights = 4;
    }
    needAlphaBlending() {
        return this.alpha < 1.0;
    }
    needAlphaBlendingForMesh(mesh) {
        return this.needAlphaBlending() || mesh.visibility < 1.0;
    }
    needAlphaTesting() {
        return false;
    }
    getAlphaTestTexture() {
        return null;
    }
    // Methods
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new NormalMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
            }
        }
        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        // Lights
        defines._needNormals = true;
        PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false, null, subMesh.getRenderingMesh().hasThinInstances);
        defines.LIGHTING = !this._disableLighting;
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, true);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            HandleFallbacksForShadows(defines, fallbacks);
            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }
            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            const shaderName = "normal";
            const join = defines.toString();
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vDiffuseColor",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vDiffuseInfos",
                "mBones",
                "diffuseMatrix",
                "logarithmicDepthConstant",
            ];
            const samplers = ["diffuseSampler"];
            const uniformBuffers = [];
            addClipPlaneUniforms(uniforms);
            PrepareUniformsAndSamplersList({
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4,
            });
            subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: 4 },
            }, engine), defines, this._materialContext);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;
        return true;
    }
    bindForSubMesh(world, mesh, subMesh) {
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (!defines) {
            return;
        }
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;
        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        // Bones
        BindBonesParameters(mesh, this._activeEffect);
        if (this._mustRebind(scene, effect, subMesh)) {
            // Textures
            if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);
                this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
            }
            // Clip plane
            bindClipPlane(effect, this, scene);
            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
            scene.bindEyePosition(effect);
        }
        this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
        // Lights
        if (scene.lightsEnabled && !this.disableLighting) {
            BindLights(scene, mesh, this._activeEffect, defines);
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    getAnimatables() {
        const results = [];
        if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
            results.push(this.diffuseTexture);
        }
        return results;
    }
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }
        return activeTextures;
    }
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this.diffuseTexture === texture) {
            return true;
        }
        return false;
    }
    dispose(forceDisposeEffect) {
        if (this.diffuseTexture) {
            this.diffuseTexture.dispose();
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new NormalMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.NormalMaterial";
        return serializationObject;
    }
    getClassName() {
        return "NormalMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new NormalMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsTexture("diffuseTexture")
], NormalMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], NormalMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    serializeAsColor3()
], NormalMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serialize("disableLighting")
], NormalMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], NormalMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], NormalMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], NormalMaterial.prototype, "maxSimultaneousLights", void 0);
RegisterClass("BABYLON.NormalMaterial", NormalMaterial);
//# sourceMappingURL=normalMaterial.js.map