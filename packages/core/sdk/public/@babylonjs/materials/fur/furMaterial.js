import { __decorate } from "@babylonjs/core/tslib.es6.js";
import { serializeAsVector3, serializeAsTexture, serialize, expandToProperty, serializeAsColor3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Tags } from "@babylonjs/core/Misc/tags.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Scene } from "@babylonjs/core/scene.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import "./fur.fragment.js";
import "./fur.vertex.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
class FurMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.DIFFUSE = false;
        this.HEIGHTMAP = false;
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
        this.NORMAL = false;
        this.UV1 = false;
        this.UV2 = false;
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.NUM_BONE_INFLUENCERS = 0;
        this.BonesPerMesh = 0;
        this.INSTANCES = false;
        this.INSTANCESCOLOR = false;
        this.HIGHLEVEL = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
export class FurMaterial extends PushMaterial {
    constructor(name, scene) {
        super(name, scene);
        this.diffuseColor = new Color3(1, 1, 1);
        this.furLength = 1;
        this.furAngle = 0;
        this.furColor = new Color3(0.44, 0.21, 0.02);
        this.furOffset = 0.0;
        this.furSpacing = 12;
        this.furGravity = new Vector3(0, 0, 0);
        this.furSpeed = 100;
        this.furDensity = 20;
        this.furOcclusion = 0.0;
        this._disableLighting = false;
        this._maxSimultaneousLights = 4;
        this.highLevelFur = true;
        this._furTime = 0;
    }
    get furTime() {
        return this._furTime;
    }
    set furTime(furTime) {
        this._furTime = furTime;
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
    updateFur() {
        for (let i = 1; i < this._meshes.length; i++) {
            const offsetFur = this._meshes[i].material;
            offsetFur.furLength = this.furLength;
            offsetFur.furAngle = this.furAngle;
            offsetFur.furGravity = this.furGravity;
            offsetFur.furSpacing = this.furSpacing;
            offsetFur.furSpeed = this.furSpeed;
            offsetFur.furColor = this.furColor;
            offsetFur.diffuseTexture = this.diffuseTexture;
            offsetFur.furTexture = this.furTexture;
            offsetFur.highLevelFur = this.highLevelFur;
            offsetFur.furTime = this.furTime;
            offsetFur.furDensity = this.furDensity;
        }
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
            subMesh.materialDefines = new FurMaterialDefines();
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
                if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
                if (this.heightTexture && engine.getCaps().maxVertexTextureImageUnits) {
                    if (!this.heightTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.HEIGHTMAP = true;
                    }
                }
            }
        }
        // High level
        if (this.highLevelFur !== defines.HIGHLEVEL) {
            defines.HIGHLEVEL = true;
            defines.markAsUnprocessed();
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
            const shaderName = "fur";
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
                "furLength",
                "furAngle",
                "furColor",
                "furOffset",
                "furGravity",
                "furTime",
                "furSpacing",
                "furDensity",
                "furOcclusion",
            ];
            addClipPlaneUniforms(uniforms);
            const samplers = ["diffuseSampler", "heightTexture", "furTexture"];
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
            }
            if (this._heightTexture) {
                this._activeEffect.setTexture("heightTexture", this._heightTexture);
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
        this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
        if (scene.lightsEnabled && !this.disableLighting) {
            BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        this._activeEffect.setFloat("furLength", this.furLength);
        this._activeEffect.setFloat("furAngle", this.furAngle);
        this._activeEffect.setColor4("furColor", this.furColor, 1.0);
        if (this.highLevelFur) {
            this._activeEffect.setVector3("furGravity", this.furGravity);
            this._activeEffect.setFloat("furOffset", this.furOffset);
            this._activeEffect.setFloat("furSpacing", this.furSpacing);
            this._activeEffect.setFloat("furDensity", this.furDensity);
            this._activeEffect.setFloat("furOcclusion", this.furOcclusion);
            this._furTime += this.getScene().getEngine().getDeltaTime() / this.furSpeed;
            this._activeEffect.setFloat("furTime", this._furTime);
            this._activeEffect.setTexture("furTexture", this.furTexture);
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    getAnimatables() {
        const results = [];
        if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
            results.push(this.diffuseTexture);
        }
        if (this.heightTexture && this.heightTexture.animations && this.heightTexture.animations.length > 0) {
            results.push(this.heightTexture);
        }
        return results;
    }
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }
        if (this._heightTexture) {
            activeTextures.push(this._heightTexture);
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
        if (this._heightTexture === texture) {
            return true;
        }
        return false;
    }
    dispose(forceDisposeEffect) {
        if (this.diffuseTexture) {
            this.diffuseTexture.dispose();
        }
        if (this._meshes) {
            for (let i = 1; i < this._meshes.length; i++) {
                const mat = this._meshes[i].material;
                if (mat) {
                    mat.dispose(forceDisposeEffect);
                }
                this._meshes[i].dispose();
            }
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new FurMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.FurMaterial";
        if (this._meshes) {
            serializationObject.sourceMeshName = this._meshes[0].name;
            serializationObject.quality = this._meshes.length;
        }
        return serializationObject;
    }
    getClassName() {
        return "FurMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        const material = SerializationHelper.Parse(() => new FurMaterial(source.name, scene), source, scene, rootUrl);
        if (source.sourceMeshName && material.highLevelFur) {
            scene.executeWhenReady(() => {
                const sourceMesh = scene.getMeshByName(source.sourceMeshName);
                if (sourceMesh) {
                    const furTexture = FurMaterial.GenerateTexture("Fur Texture", scene);
                    material.furTexture = furTexture;
                    FurMaterial.FurifyMesh(sourceMesh, source.quality);
                }
            });
        }
        return material;
    }
    static GenerateTexture(name, scene) {
        // Generate fur textures
        const texture = new DynamicTexture("FurTexture " + name, 256, scene, true);
        const context = texture.getContext();
        for (let i = 0; i < 20000; ++i) {
            context.fillStyle = "rgba(255, " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 1)";
            context.fillRect(Math.random() * texture.getSize().width, Math.random() * texture.getSize().height, 2, 2);
        }
        texture.update(false);
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;
        return texture;
    }
    // Creates and returns an array of meshes used as shells for the Fur Material
    // that can be disposed later in your code
    // The quality is in interval [0, 100]
    static FurifyMesh(sourceMesh, quality) {
        const meshes = [sourceMesh];
        const mat = sourceMesh.material;
        let i;
        if (!(mat instanceof FurMaterial)) {
            // eslint-disable-next-line no-throw-literal
            throw "The material of the source mesh must be a Fur Material";
        }
        for (i = 1; i < quality; i++) {
            const offsetFur = new FurMaterial(mat.name + i, sourceMesh.getScene());
            sourceMesh.getScene().materials.pop();
            Tags.EnableFor(offsetFur);
            Tags.AddTagsTo(offsetFur, "furShellMaterial");
            offsetFur.furLength = mat.furLength;
            offsetFur.furAngle = mat.furAngle;
            offsetFur.furGravity = mat.furGravity;
            offsetFur.furSpacing = mat.furSpacing;
            offsetFur.furSpeed = mat.furSpeed;
            offsetFur.furColor = mat.furColor;
            offsetFur.diffuseTexture = mat.diffuseTexture;
            offsetFur.furOffset = i / quality;
            offsetFur.furTexture = mat.furTexture;
            offsetFur.highLevelFur = mat.highLevelFur;
            offsetFur.furTime = mat.furTime;
            offsetFur.furDensity = mat.furDensity;
            const offsetMesh = sourceMesh.clone(sourceMesh.name + i);
            offsetMesh.material = offsetFur;
            offsetMesh.skeleton = sourceMesh.skeleton;
            offsetMesh.position = Vector3.Zero();
            meshes.push(offsetMesh);
        }
        for (i = 1; i < meshes.length; i++) {
            meshes[i].parent = sourceMesh;
        }
        sourceMesh.material._meshes = meshes;
        return meshes;
    }
}
__decorate([
    serializeAsTexture("diffuseTexture")
], FurMaterial.prototype, "_diffuseTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], FurMaterial.prototype, "diffuseTexture", void 0);
__decorate([
    serializeAsTexture("heightTexture")
], FurMaterial.prototype, "_heightTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], FurMaterial.prototype, "heightTexture", void 0);
__decorate([
    serializeAsColor3()
], FurMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furLength", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furAngle", void 0);
__decorate([
    serializeAsColor3()
], FurMaterial.prototype, "furColor", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furOffset", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furSpacing", void 0);
__decorate([
    serializeAsVector3()
], FurMaterial.prototype, "furGravity", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furSpeed", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furDensity", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furOcclusion", void 0);
__decorate([
    serialize("disableLighting")
], FurMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], FurMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], FurMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], FurMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "highLevelFur", void 0);
__decorate([
    serialize()
], FurMaterial.prototype, "furTime", null);
RegisterClass("BABYLON.FurMaterial", FurMaterial);
//# sourceMappingURL=furMaterial.js.map