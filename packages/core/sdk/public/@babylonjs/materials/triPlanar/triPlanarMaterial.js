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
import "./triplanar.fragment.js";
import "./triplanar.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class TriPlanarMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.DIFFUSEX = false;
        this.DIFFUSEY = false;
        this.DIFFUSEZ = false;
        this.BUMPX = false;
        this.BUMPY = false;
        this.BUMPZ = false;
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
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.NONUNIFORMSCALING = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class TriPlanarMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.tileSize = 1;
        this.diffuseColor = new Color3(1, 1, 1);
        this.specularColor = new Color3(0.2, 0.2, 0.2);
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
            subMesh.materialDefines = new TriPlanarMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Textures
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (MaterialFlags.DiffuseTextureEnabled) {
                    const textures = [this.diffuseTextureX, this.diffuseTextureY, this.diffuseTextureZ];
                    const textureDefines = ["DIFFUSEX", "DIFFUSEY", "DIFFUSEZ"];
                    for (let i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            }
                            else {
                                defines[textureDefines[i]] = true;
                            }
                        }
                    }
                }
                if (MaterialFlags.BumpTextureEnabled) {
                    const textures = [this.normalTextureX, this.normalTextureY, this.normalTextureZ];
                    const textureDefines = ["BUMPX", "BUMPY", "BUMPZ"];
                    for (let i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            }
                            else {
                                defines[textureDefines[i]] = true;
                            }
                        }
                    }
                }
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
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            // Legacy browser patch
            const shaderName = "triplanar";
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
                "mBones",
                "tileSize",
            ];
            const samplers = ["diffuseSamplerX", "diffuseSamplerY", "diffuseSamplerZ", "normalSamplerX", "normalSamplerY", "normalSamplerZ", "logarithmicDepthConstant"];
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
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
        // Bones
        BindBonesParameters(mesh, this._activeEffect);
        this._activeEffect.setFloat("tileSize", this.tileSize);
        if (this._mustRebind(scene, effect, subMesh)) {
            // Textures
            if (this.diffuseTextureX) {
                this._activeEffect.setTexture("diffuseSamplerX", this.diffuseTextureX);
            }
            if (this.diffuseTextureY) {
                this._activeEffect.setTexture("diffuseSamplerY", this.diffuseTextureY);
            }
            if (this.diffuseTextureZ) {
                this._activeEffect.setTexture("diffuseSamplerZ", this.diffuseTextureZ);
            }
            if (this.normalTextureX) {
                this._activeEffect.setTexture("normalSamplerX", this.normalTextureX);
            }
            if (this.normalTextureY) {
                this._activeEffect.setTexture("normalSamplerY", this.normalTextureY);
            }
            if (this.normalTextureZ) {
                this._activeEffect.setTexture("normalSamplerZ", this.normalTextureZ);
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
        if (this._diffuseTextureX) {
            activeTextures.push(this._diffuseTextureX);
        }
        if (this._diffuseTextureY) {
            activeTextures.push(this._diffuseTextureY);
        }
        if (this._diffuseTextureZ) {
            activeTextures.push(this._diffuseTextureZ);
        }
        if (this._normalTextureX) {
            activeTextures.push(this._normalTextureX);
        }
        if (this._normalTextureY) {
            activeTextures.push(this._normalTextureY);
        }
        if (this._normalTextureZ) {
            activeTextures.push(this._normalTextureZ);
        }
        return activeTextures;
    }
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._diffuseTextureX === texture) {
            return true;
        }
        if (this._diffuseTextureY === texture) {
            return true;
        }
        if (this._diffuseTextureZ === texture) {
            return true;
        }
        if (this._normalTextureX === texture) {
            return true;
        }
        if (this._normalTextureY === texture) {
            return true;
        }
        if (this._normalTextureZ === texture) {
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
        return SerializationHelper.Clone(() => new TriPlanarMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.TriPlanarMaterial";
        return serializationObject;
    }
    getClassName() {
        return "TriPlanarMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new TriPlanarMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsTexture()
], TriPlanarMaterial.prototype, "mixTexture", void 0);
__decorate([
    serializeAsTexture("diffuseTextureX")
], TriPlanarMaterial.prototype, "_diffuseTextureX", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "diffuseTextureX", void 0);
__decorate([
    serializeAsTexture("diffuseTexturY")
], TriPlanarMaterial.prototype, "_diffuseTextureY", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "diffuseTextureY", void 0);
__decorate([
    serializeAsTexture("diffuseTextureZ")
], TriPlanarMaterial.prototype, "_diffuseTextureZ", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "diffuseTextureZ", void 0);
__decorate([
    serializeAsTexture("normalTextureX")
], TriPlanarMaterial.prototype, "_normalTextureX", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "normalTextureX", void 0);
__decorate([
    serializeAsTexture("normalTextureY")
], TriPlanarMaterial.prototype, "_normalTextureY", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "normalTextureY", void 0);
__decorate([
    serializeAsTexture("normalTextureZ")
], TriPlanarMaterial.prototype, "_normalTextureZ", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], TriPlanarMaterial.prototype, "normalTextureZ", void 0);
__decorate([
    serialize()
], TriPlanarMaterial.prototype, "tileSize", void 0);
__decorate([
    serializeAsColor3()
], TriPlanarMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serializeAsColor3()
], TriPlanarMaterial.prototype, "specularColor", void 0);
__decorate([
    serialize()
], TriPlanarMaterial.prototype, "specularPower", void 0);
__decorate([
    serialize("disableLighting")
], TriPlanarMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], TriPlanarMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], TriPlanarMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], TriPlanarMaterial.prototype, "maxSimultaneousLights", void 0);
RegisterClass("BABYLON.TriPlanarMaterial", TriPlanarMaterial);
//# sourceMappingURL=triPlanarMaterial.js.map