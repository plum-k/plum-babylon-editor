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
import "./terrain.fragment.js";
import "./terrain.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class TerrainMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.DIFFUSE = false;
        this.BUMP = false;
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
        this.SPECULARTERM = false;
        this.NORMAL = false;
        this.UV1 = false;
        this.UV2 = false;
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class TerrainMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.diffuseColor = new Color3(1, 1, 1);
        this.specularColor = new Color3(0, 0, 0);
        this.specularPower = 64;
        this._disableLighting = false;
        this._maxSimultaneousLights = 4;
    }
    needAlphaBlending() {
        return this.alpha < 1.0;
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
            subMesh.materialDefines = new TerrainMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Textures
        if (scene.texturesEnabled) {
            if (!this.mixTexture || !this.mixTexture.isReady()) {
                return false;
            }
            defines._needUVs = true;
            if (MaterialFlags.DiffuseTextureEnabled) {
                if (!this.diffuseTexture1 || !this.diffuseTexture1.isReady()) {
                    return false;
                }
                if (!this.diffuseTexture2 || !this.diffuseTexture2.isReady()) {
                    return false;
                }
                if (!this.diffuseTexture3 || !this.diffuseTexture3.isReady()) {
                    return false;
                }
                defines.DIFFUSE = true;
            }
            if (this.bumpTexture1 && this.bumpTexture2 && this.bumpTexture3 && MaterialFlags.BumpTextureEnabled) {
                if (!this.bumpTexture1.isReady()) {
                    return false;
                }
                if (!this.bumpTexture2.isReady()) {
                    return false;
                }
                if (!this.bumpTexture3.isReady()) {
                    return false;
                }
                defines._needNormals = true;
                defines.BUMP = true;
            }
        }
        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        // Lights
        defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);
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
            HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
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
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            // Legacy browser patch
            const shaderName = "terrain";
            const join = defines.toString();
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vDiffuseColor",
                "vSpecularColor",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vTextureInfos",
                "mBones",
                "textureMatrix",
                "diffuse1Infos",
                "diffuse2Infos",
                "diffuse3Infos",
            ];
            const samplers = [
                "textureSampler",
                "diffuse1Sampler",
                "diffuse2Sampler",
                "diffuse3Sampler",
                "bump1Sampler",
                "bump2Sampler",
                "bump3Sampler",
                "logarithmicDepthConstant",
            ];
            const uniformBuffers = [];
            addClipPlaneUniforms(uniforms);
            PrepareUniformsAndSamplersList({
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: this.maxSimultaneousLights,
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
                indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights },
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
        this._activeEffect.setMatrix("view", scene.getViewMatrix());
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        // Bones
        BindBonesParameters(mesh, this._activeEffect);
        if (this._mustRebind(scene, effect, subMesh)) {
            // Textures
            if (this.mixTexture) {
                this._activeEffect.setTexture("textureSampler", this._mixTexture);
                this._activeEffect.setFloat2("vTextureInfos", this._mixTexture.coordinatesIndex, this._mixTexture.level);
                this._activeEffect.setMatrix("textureMatrix", this._mixTexture.getTextureMatrix());
                if (MaterialFlags.DiffuseTextureEnabled) {
                    if (this._diffuseTexture1) {
                        this._activeEffect.setTexture("diffuse1Sampler", this._diffuseTexture1);
                        this._activeEffect.setFloat2("diffuse1Infos", this._diffuseTexture1.uScale, this._diffuseTexture1.vScale);
                    }
                    if (this._diffuseTexture2) {
                        this._activeEffect.setTexture("diffuse2Sampler", this._diffuseTexture2);
                        this._activeEffect.setFloat2("diffuse2Infos", this._diffuseTexture2.uScale, this._diffuseTexture2.vScale);
                    }
                    if (this._diffuseTexture3) {
                        this._activeEffect.setTexture("diffuse3Sampler", this._diffuseTexture3);
                        this._activeEffect.setFloat2("diffuse3Infos", this._diffuseTexture3.uScale, this._diffuseTexture3.vScale);
                    }
                }
                if (MaterialFlags.BumpTextureEnabled && scene.getEngine().getCaps().standardDerivatives) {
                    if (this._bumpTexture1) {
                        this._activeEffect.setTexture("bump1Sampler", this._bumpTexture1);
                    }
                    if (this._bumpTexture2) {
                        this._activeEffect.setTexture("bump2Sampler", this._bumpTexture2);
                    }
                    if (this._bumpTexture3) {
                        this._activeEffect.setTexture("bump3Sampler", this._bumpTexture3);
                    }
                }
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
        if (defines.SPECULARTERM) {
            this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
        }
        if (scene.lightsEnabled && !this.disableLighting) {
            BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
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
        if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
            results.push(this.mixTexture);
        }
        return results;
    }
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._mixTexture) {
            activeTextures.push(this._mixTexture);
        }
        if (this._diffuseTexture1) {
            activeTextures.push(this._diffuseTexture1);
        }
        if (this._diffuseTexture2) {
            activeTextures.push(this._diffuseTexture2);
        }
        if (this._diffuseTexture3) {
            activeTextures.push(this._diffuseTexture3);
        }
        if (this._bumpTexture1) {
            activeTextures.push(this._bumpTexture1);
        }
        if (this._bumpTexture2) {
            activeTextures.push(this._bumpTexture2);
        }
        if (this._bumpTexture3) {
            activeTextures.push(this._bumpTexture3);
        }
        return activeTextures;
    }
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._mixTexture === texture) {
            return true;
        }
        if (this._diffuseTexture1 === texture) {
            return true;
        }
        if (this._diffuseTexture2 === texture) {
            return true;
        }
        if (this._diffuseTexture3 === texture) {
            return true;
        }
        if (this._bumpTexture1 === texture) {
            return true;
        }
        if (this._bumpTexture2 === texture) {
            return true;
        }
        if (this._bumpTexture3 === texture) {
            return true;
        }
        return false;
    }
    dispose(forceDisposeEffect) {
        if (this.mixTexture) {
            this.mixTexture.dispose();
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new TerrainMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.TerrainMaterial";
        return serializationObject;
    }
    getClassName() {
        return "TerrainMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new TerrainMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsTexture("mixTexture")
], TerrainMaterial.prototype, "_mixTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "mixTexture", void 0);
__decorate([
    serializeAsTexture("diffuseTexture1")
], TerrainMaterial.prototype, "_diffuseTexture1", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "diffuseTexture1", void 0);
__decorate([
    serializeAsTexture("diffuseTexture2")
], TerrainMaterial.prototype, "_diffuseTexture2", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "diffuseTexture2", void 0);
__decorate([
    serializeAsTexture("diffuseTexture3")
], TerrainMaterial.prototype, "_diffuseTexture3", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "diffuseTexture3", void 0);
__decorate([
    serializeAsTexture("bumpTexture1")
], TerrainMaterial.prototype, "_bumpTexture1", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "bumpTexture1", void 0);
__decorate([
    serializeAsTexture("bumpTexture2")
], TerrainMaterial.prototype, "_bumpTexture2", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "bumpTexture2", void 0);
__decorate([
    serializeAsTexture("bumpTexture3")
], TerrainMaterial.prototype, "_bumpTexture3", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TerrainMaterial.prototype, "bumpTexture3", void 0);
__decorate([
    serializeAsColor3()
], TerrainMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serializeAsColor3()
], TerrainMaterial.prototype, "specularColor", void 0);
__decorate([
    serialize()
], TerrainMaterial.prototype, "specularPower", void 0);
__decorate([
    serialize("disableLighting")
], TerrainMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], TerrainMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], TerrainMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], TerrainMaterial.prototype, "maxSimultaneousLights", void 0);
RegisterClass("BABYLON.TerrainMaterial", TerrainMaterial);
//# sourceMappingURL=terrainMaterial.js.map