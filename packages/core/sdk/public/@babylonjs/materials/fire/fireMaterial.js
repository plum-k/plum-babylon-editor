import { __decorate } from "@babylonjs/core/tslib.es6.js";
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Tags } from "@babylonjs/core/Misc/tags.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Scene } from "@babylonjs/core/scene.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import "./fire.fragment.js";
import "./fire.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLogDepth, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class FireMaterialDefines extends MaterialDefines {
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
        this.UV1 = false;
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.BonesPerMesh = 0;
        this.NUM_BONE_INFLUENCERS = 0;
        this.INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class FireMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.diffuseColor = new Color3(1, 1, 1);
        this.speed = 1.0;
        this._scaledDiffuse = new Color3();
        this._lastTime = 0;
    }
    needAlphaBlending() {
        return false;
    }
    needAlphaTesting() {
        return true;
    }
    getAlphaTestTexture() {
        return null;
    }
    // Methods
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new FireMaterialDefines();
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
        defines.ALPHATEST = this._opacityTexture ? true : false;
        // Misc.
        if (defines._areMiscDirty) {
            defines.POINTSIZE = this.pointsCloud || scene.forcePointsCloud;
            defines.FOG = scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled;
            defines.LOGARITHMICDEPTH = this._useLogarithmicDepth;
        }
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, false, true);
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            // Legacy browser patch
            const shaderName = "fire";
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vDiffuseInfos",
                "mBones",
                "diffuseMatrix",
                "logarithmicDepthConstant",
                // Fire
                "time",
                "speed",
            ];
            addClipPlaneUniforms(uniforms);
            const join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: [],
                samplers: [
                    "diffuseSampler",
                    // Fire
                    "distortionSampler",
                    "opacitySampler",
                ],
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: null,
                maxSimultaneousLights: 4,
                transformFeedbackVaryings: null,
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
            if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                this._activeEffect.setTexture("distortionSampler", this._distortionTexture);
                this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
            }
            // Clip plane
            bindClipPlane(this._activeEffect, this, scene);
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
        this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        // Time
        this._lastTime += scene.getEngine().getDeltaTime();
        this._activeEffect.setFloat("time", this._lastTime);
        // Speed
        this._activeEffect.setFloat("speed", this.speed);
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    getAnimatables() {
        const results = [];
        if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
            results.push(this._diffuseTexture);
        }
        if (this._distortionTexture && this._distortionTexture.animations && this._distortionTexture.animations.length > 0) {
            results.push(this._distortionTexture);
        }
        if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
            results.push(this._opacityTexture);
        }
        return results;
    }
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }
        if (this._distortionTexture) {
            activeTextures.push(this._distortionTexture);
        }
        if (this._opacityTexture) {
            activeTextures.push(this._opacityTexture);
        }
        return activeTextures;
    }
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._diffuseTexture === texture) {
            return true;
        }
        if (this._distortionTexture === texture) {
            return true;
        }
        if (this._opacityTexture === texture) {
            return true;
        }
        return false;
    }
    getClassName() {
        return "FireMaterial";
    }
    dispose(forceDisposeEffect) {
        if (this._diffuseTexture) {
            this._diffuseTexture.dispose();
        }
        if (this._distortionTexture) {
            this._distortionTexture.dispose();
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new FireMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.FireMaterial";
        serializationObject.diffuseColor = this.diffuseColor.asArray();
        serializationObject.speed = this.speed;
        if (this._diffuseTexture) {
            serializationObject._diffuseTexture = this._diffuseTexture.serialize();
        }
        if (this._distortionTexture) {
            serializationObject._distortionTexture = this._distortionTexture.serialize();
        }
        if (this._opacityTexture) {
            serializationObject._opacityTexture = this._opacityTexture.serialize();
        }
        return serializationObject;
    }
    static Parse(source, scene, rootUrl) {
        const material = new FireMaterial(source.name, scene);
        material.diffuseColor = Color3.FromArray(source.diffuseColor);
        material.speed = source.speed;
        material.alpha = source.alpha;
        material.id = source.id;
        Tags.AddTagsTo(material, source.tags);
        material.backFaceCulling = source.backFaceCulling;
        material.wireframe = source.wireframe;
        if (source._diffuseTexture) {
            material._diffuseTexture = Texture.Parse(source._diffuseTexture, scene, rootUrl);
        }
        if (source._distortionTexture) {
            material._distortionTexture = Texture.Parse(source._distortionTexture, scene, rootUrl);
        }
        if (source._opacityTexture) {
            material._opacityTexture = Texture.Parse(source._opacityTexture, scene, rootUrl);
        }
        return material;
    }
}
__decorate([
    serializeAsTexture("diffuseTexture")
], FireMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], FireMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    serializeAsTexture("distortionTexture")
], FireMaterial.prototype, "_distortionTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], FireMaterial.prototype, "distortionTexture", void 0);
__decorate([
    serializeAsTexture("opacityTexture")
], FireMaterial.prototype, "_opacityTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], FireMaterial.prototype, "opacityTexture", void 0);
__decorate([
    serializeAsColor3("diffuse")
], FireMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serialize()
], FireMaterial.prototype, "speed", void 0);
RegisterClass("BABYLON.FireMaterial", FireMaterial);
//# sourceMappingURL=fireMaterial.js.map