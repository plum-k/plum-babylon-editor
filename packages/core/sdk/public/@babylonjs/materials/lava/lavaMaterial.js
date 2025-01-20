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
import "./lava.fragment.js";
import "./lava.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class LavaMaterialDefines extends MaterialDefines {
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
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.UNLIT = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class LavaMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.speed = 1;
        this.movingSpeed = 1;
        this.lowFrequencySpeed = 1;
        this.fogDensity = 0.15;
        this._lastTime = 0;
        this.diffuseColor = new Color3(1, 1, 1);
        this._disableLighting = false;
        this._unlit = false;
        this._maxSimultaneousLights = 4;
        this._scaledDiffuse = new Color3();
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
            subMesh.materialDefines = new LavaMaterialDefines();
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
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);
            // Legacy browser patch
            const shaderName = "lava";
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
                "time",
                "speed",
                "movingSpeed",
                "fogColor",
                "fogDensity",
                "lowFrequencySpeed",
            ];
            addClipPlaneUniforms(uniforms);
            const samplers = ["diffuseSampler", "noiseTexture"];
            const uniformBuffers = [];
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
        defines.UNLIT = this._unlit;
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
            if (this.noiseTexture) {
                this._activeEffect.setTexture("noiseTexture", this.noiseTexture);
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
        this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
        if (scene.lightsEnabled && !this.disableLighting) {
            BindLights(scene, mesh, this._activeEffect, defines);
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        this._lastTime += scene.getEngine().getDeltaTime();
        this._activeEffect.setFloat("time", (this._lastTime * this.speed) / 1000);
        if (!this.fogColor) {
            this.fogColor = Color3.Black();
        }
        this._activeEffect.setColor3("fogColor", this.fogColor);
        this._activeEffect.setFloat("fogDensity", this.fogDensity);
        this._activeEffect.setFloat("lowFrequencySpeed", this.lowFrequencySpeed);
        this._activeEffect.setFloat("movingSpeed", this.movingSpeed);
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    getAnimatables() {
        const results = [];
        if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
            results.push(this.diffuseTexture);
        }
        if (this.noiseTexture && this.noiseTexture.animations && this.noiseTexture.animations.length > 0) {
            results.push(this.noiseTexture);
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
        if (this.noiseTexture) {
            this.noiseTexture.dispose();
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new LavaMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.LavaMaterial";
        return serializationObject;
    }
    getClassName() {
        return "LavaMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new LavaMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serializeAsTexture("diffuseTexture")
], LavaMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], LavaMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    serializeAsTexture()
], LavaMaterial.prototype, "noiseTexture", void 0);
__decorate([
    serializeAsColor3()
], LavaMaterial.prototype, "fogColor", void 0);
__decorate([
    serialize()
], LavaMaterial.prototype, "speed", void 0);
__decorate([
    serialize()
], LavaMaterial.prototype, "movingSpeed", void 0);
__decorate([
    serialize()
], LavaMaterial.prototype, "lowFrequencySpeed", void 0);
__decorate([
    serialize()
], LavaMaterial.prototype, "fogDensity", void 0);
__decorate([
    serializeAsColor3()
], LavaMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serialize("disableLighting")
], LavaMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], LavaMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("unlit")
], LavaMaterial.prototype, "_unlit", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], LavaMaterial.prototype, "unlit", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], LavaMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], LavaMaterial.prototype, "maxSimultaneousLights", void 0);
RegisterClass("BABYLON.LavaMaterial", LavaMaterial);
//# sourceMappingURL=lavaMaterial.js.map