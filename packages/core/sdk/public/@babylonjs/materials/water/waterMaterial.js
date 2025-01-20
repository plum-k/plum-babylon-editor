import { __decorate } from "@babylonjs/core/tslib.es6.js";
import { serializeAsVector2, serializeAsTexture, serialize, expandToProperty, serializeAsColor3 } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Plane } from "@babylonjs/core/Maths/math.plane.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";
import { SmartArray } from "@babylonjs/core/Misc/smartArray.js";
import { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { MaterialFlags } from "@babylonjs/core/Materials/materialFlags.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Scene } from "@babylonjs/core/scene.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import "./water.fragment.js";
import "./water.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindBonesParameters, BindFogParameters, BindLights, BindLogDepth, HandleFallbacksForShadows, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForLights, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "@babylonjs/core/Materials/materialHelper.functions.js";
import "@babylonjs/core/Rendering/boundingBoxRenderer.js";
class WaterMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.BUMP = false;
        this.REFLECTION = false;
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
        this.SPECULARTERM = false;
        this.LOGARITHMICDEPTH = false;
        this.USE_REVERSE_DEPTHBUFFER = false;
        this.FRESNELSEPARATE = false;
        this.BUMPSUPERIMPOSE = false;
        this.BUMPAFFECTSREFLECTION = false;
        this.USE_WORLD_COORDINATES = false;
        this.IMAGEPROCESSING = false;
        this.VIGNETTE = false;
        this.VIGNETTEBLENDMODEMULTIPLY = false;
        this.VIGNETTEBLENDMODEOPAQUE = false;
        this.TONEMAPPING = 0;
        this.CONTRAST = false;
        this.EXPOSURE = false;
        this.COLORCURVES = false;
        this.COLORGRADING = false;
        this.COLORGRADING3D = false;
        this.SAMPLER3DGREENDEPTH = false;
        this.SAMPLER3DBGRMAP = false;
        this.DITHER = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.rebuild();
    }
}
export class WaterMaterial extends PushMaterial {
    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    get hasRenderTargetTextures() {
        return true;
    }
    /**
     * Constructor
     * @param name
     * @param scene
     * @param renderTargetSize
     */
    constructor(name, scene, renderTargetSize = new Vector2(512, 512)) {
        super(name, scene);
        this.renderTargetSize = renderTargetSize;
        this.diffuseColor = new Color3(1, 1, 1);
        this.specularColor = new Color3(0, 0, 0);
        this.specularPower = 64;
        this._disableLighting = false;
        this._maxSimultaneousLights = 4;
        /**
         * Defines the wind force.
         */
        this.windForce = 6;
        /**
         * Defines the direction of the wind in the plane (X, Z).
         */
        this.windDirection = new Vector2(0, 1);
        /**
         * Defines the height of the waves.
         */
        this.waveHeight = 0.4;
        /**
         * Defines the bump height related to the bump map.
         */
        this.bumpHeight = 0.4;
        /**
         * Defines wether or not: to add a smaller moving bump to less steady waves.
         */
        this._bumpSuperimpose = false;
        /**
         * Defines wether or not color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        this._fresnelSeparate = false;
        /**
         * Defines wether or not bump Wwves modify the reflection.
         */
        this._bumpAffectsReflection = false;
        /**
         * Defines the water color blended with the refraction (near).
         */
        this.waterColor = new Color3(0.1, 0.1, 0.6);
        /**
         * Defines the blend factor related to the water color.
         */
        this.colorBlendFactor = 0.2;
        /**
         * Defines the water color blended with the reflection (far).
         */
        this.waterColor2 = new Color3(0.1, 0.1, 0.6);
        /**
         * Defines the blend factor related to the water color (reflection, far).
         */
        this.colorBlendFactor2 = 0.2;
        /**
         * Defines the maximum length of a wave.
         */
        this.waveLength = 0.1;
        /**
         * Defines the waves speed.
         */
        this.waveSpeed = 1.0;
        /**
         * Defines the number of times waves are repeated. This is typically used to adjust waves count according to the ground's size where the material is applied on.
         */
        this.waveCount = 20;
        /**
         * Sets or gets whether or not automatic clipping should be enabled or not. Setting to true will save performances and
         * will avoid calculating useless pixels in the pixel shader of the water material.
         */
        this.disableClipPlane = false;
        /**
         * Defines whether or not to use world coordinates for wave deformations.
         * The default value is false, meaning that the deformation is applied in object (local) space.
         * You will probably need to set it to true if you are using instances or thin instances for your water objects.
         */
        this._useWorldCoordinatesForWaveDeformation = false;
        this._renderTargets = new SmartArray(16);
        /*
         * Private members
         */
        this._mesh = null;
        this._reflectionTransform = Matrix.Zero();
        this._lastTime = 0;
        this._lastDeltaTime = 0;
        this._createRenderTargets(this.getScene(), renderTargetSize);
        // Create render targets
        this.getRenderTargetTextures = () => {
            this._renderTargets.reset();
            this._renderTargets.push(this._reflectionRTT);
            this._renderTargets.push(this._refractionRTT);
            return this._renderTargets;
        };
        this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }
    // Get / Set
    get refractionTexture() {
        return this._refractionRTT;
    }
    get reflectionTexture() {
        return this._reflectionRTT;
    }
    // Methods
    addToRenderList(node) {
        if (this._refractionRTT && this._refractionRTT.renderList) {
            this._refractionRTT.renderList.push(node);
        }
        if (this._reflectionRTT && this._reflectionRTT.renderList) {
            this._reflectionRTT.renderList.push(node);
        }
    }
    removeFromRenderList(node) {
        if (this._refractionRTT && this._refractionRTT.renderList) {
            const idx = this._refractionRTT.renderList.indexOf(node);
            if (idx !== -1) {
                this._refractionRTT.renderList.splice(idx, 1);
            }
        }
        if (this._reflectionRTT && this._reflectionRTT.renderList) {
            const idx = this._reflectionRTT.renderList.indexOf(node);
            if (idx !== -1) {
                this._reflectionRTT.renderList.splice(idx, 1);
            }
        }
    }
    enableRenderTargets(enable) {
        const refreshRate = enable ? 1 : 0;
        if (this._refractionRTT) {
            this._refractionRTT.refreshRate = refreshRate;
        }
        if (this._reflectionRTT) {
            this._reflectionRTT.refreshRate = refreshRate;
        }
    }
    getRenderList() {
        return this._refractionRTT ? this._refractionRTT.renderList : [];
    }
    get renderTargetsEnabled() {
        return !(this._refractionRTT && this._refractionRTT.refreshRate === 0);
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
    isReadyForSubMesh(mesh, subMesh, useInstances) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new WaterMaterialDefines();
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
                if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    }
                    else {
                        defines._needUVs = true;
                        defines.BUMP = true;
                    }
                }
                if (MaterialFlags.ReflectionTextureEnabled) {
                    defines.REFLECTION = true;
                }
            }
        }
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);
        if (defines._areMiscDirty) {
            defines.FRESNELSEPARATE = this._fresnelSeparate;
            defines.BUMPSUPERIMPOSE = this._bumpSuperimpose;
            defines.BUMPAFFECTSREFLECTION = this._bumpAffectsReflection;
            defines.USE_WORLD_COORDINATES = this._useWorldCoordinatesForWaveDeformation;
        }
        // Lights
        defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
        // Image processing
        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }
            this._imageProcessingConfiguration.prepareDefines(defines);
            defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
            defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
        }
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, true);
        // Configure this
        this._mesh = mesh;
        if (this._waitingRenderList) {
            for (let i = 0; i < this._waitingRenderList.length; i++) {
                this.addToRenderList(scene.getNodeById(this._waitingRenderList[i]));
            }
            this._waitingRenderList = null;
        }
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }
            if (defines.LOGARITHMICDEPTH) {
                fallbacks.addFallback(0, "LOGARITHMICDEPTH");
            }
            HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
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
            const shaderName = "water";
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
                "vNormalInfos",
                "mBones",
                "normalMatrix",
                "logarithmicDepthConstant",
                // Water
                "reflectionViewProjection",
                "windDirection",
                "waveLength",
                "time",
                "windForce",
                "cameraPosition",
                "bumpHeight",
                "waveHeight",
                "waterColor",
                "waterColor2",
                "colorBlendFactor",
                "colorBlendFactor2",
                "waveSpeed",
                "waveCount",
            ];
            const samplers = [
                "normalSampler",
                // Water
                "refractionSampler",
                "reflectionSampler",
            ];
            const uniformBuffers = [];
            if (ImageProcessingConfiguration) {
                ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
            }
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
                indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights },
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
        if (!effect || !this._mesh) {
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
            if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
                this._activeEffect.setTexture("normalSampler", this.bumpTexture);
                this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
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
        // Log. depth
        BindLogDepth(defines, this._activeEffect, scene);
        // Water
        if (MaterialFlags.ReflectionTextureEnabled) {
            this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
            this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
        }
        const wrvp = this._reflectionTransform.multiply(scene.getProjectionMatrix());
        // Add delta time. Prevent adding delta time if it hasn't changed.
        const deltaTime = scene.getEngine().getDeltaTime();
        if (deltaTime !== this._lastDeltaTime) {
            this._lastDeltaTime = deltaTime;
            this._lastTime += this._lastDeltaTime;
        }
        this._activeEffect.setMatrix("reflectionViewProjection", wrvp);
        this._activeEffect.setVector2("windDirection", this.windDirection);
        this._activeEffect.setFloat("waveLength", this.waveLength);
        this._activeEffect.setFloat("time", this._lastTime / 100000);
        this._activeEffect.setFloat("windForce", this.windForce);
        this._activeEffect.setFloat("waveHeight", this.waveHeight);
        this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
        this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
        this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
        this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
        this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
        this._activeEffect.setFloat("waveSpeed", this.waveSpeed);
        this._activeEffect.setFloat("waveCount", this.waveCount);
        // image processing
        if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
            this._imageProcessingConfiguration.bind(this._activeEffect);
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    _createRenderTargets(scene, renderTargetSize) {
        // Render targets
        this._refractionRTT = new RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
        this._refractionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._refractionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._refractionRTT.ignoreCameraViewport = true;
        let boundingBoxRendererEnabled = false;
        this._refractionRTT.onBeforeRenderObservable.add(() => {
            boundingBoxRendererEnabled = scene.getBoundingBoxRenderer().enabled;
            scene.getBoundingBoxRenderer().enabled = false;
        });
        this._refractionRTT.onAfterRenderObservable.add(() => {
            scene.getBoundingBoxRenderer().enabled = boundingBoxRendererEnabled;
        });
        this._reflectionRTT = new RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
        this._reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._reflectionRTT.ignoreCameraViewport = true;
        let isVisible;
        let clipPlane = null;
        let savedViewMatrix;
        const mirrorMatrix = Matrix.Zero();
        this._refractionRTT.onBeforeRender = () => {
            if (this._mesh) {
                isVisible = this._mesh.isVisible;
                this._mesh.isVisible = false;
            }
            // Clip plane
            if (!this.disableClipPlane) {
                clipPlane = scene.clipPlane;
                const positiony = this._mesh ? this._mesh.absolutePosition.y : 0.0;
                scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony + 0.05, 0), new Vector3(0, 1, 0));
            }
        };
        this._refractionRTT.onAfterRender = () => {
            if (this._mesh) {
                this._mesh.isVisible = isVisible;
            }
            // Clip plane
            if (!this.disableClipPlane) {
                scene.clipPlane = clipPlane;
            }
        };
        this._reflectionRTT.onBeforeRender = () => {
            if (this._mesh) {
                isVisible = this._mesh.isVisible;
                this._mesh.isVisible = false;
            }
            // Clip plane
            if (!this.disableClipPlane) {
                clipPlane = scene.clipPlane;
                const positiony = this._mesh ? this._mesh.absolutePosition.y : 0.0;
                scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony - 0.05, 0), new Vector3(0, -1, 0));
                Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
            }
            // Transform
            savedViewMatrix = scene.getViewMatrix();
            mirrorMatrix.multiplyToRef(savedViewMatrix, this._reflectionTransform);
            scene.setTransformMatrix(this._reflectionTransform, scene.getProjectionMatrix());
            scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.position, mirrorMatrix);
        };
        this._reflectionRTT.onAfterRender = () => {
            if (this._mesh) {
                this._mesh.isVisible = isVisible;
            }
            // Clip plane
            scene.clipPlane = clipPlane;
            // Transform
            scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
            scene._mirroredCameraPosition = null;
        };
    }
    getAnimatables() {
        const results = [];
        if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
            results.push(this.bumpTexture);
        }
        if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
            results.push(this._reflectionRTT);
        }
        if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
            results.push(this._refractionRTT);
        }
        return results;
    }
    getActiveTextures() {
        const activeTextures = super.getActiveTextures();
        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }
        return activeTextures;
    }
    hasTexture(texture) {
        if (super.hasTexture(texture)) {
            return true;
        }
        if (this._bumpTexture === texture) {
            return true;
        }
        return false;
    }
    dispose(forceDisposeEffect) {
        if (this.bumpTexture) {
            this.bumpTexture.dispose();
        }
        let index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
        if (index != -1) {
            this.getScene().customRenderTargets.splice(index, 1);
        }
        index = -1;
        index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
        if (index != -1) {
            this.getScene().customRenderTargets.splice(index, 1);
        }
        if (this._reflectionRTT) {
            this._reflectionRTT.dispose();
        }
        if (this._refractionRTT) {
            this._refractionRTT.dispose();
        }
        // Remove image-processing observer
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }
        super.dispose(forceDisposeEffect);
    }
    clone(name) {
        return SerializationHelper.Clone(() => new WaterMaterial(name, this.getScene()), this);
    }
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.WaterMaterial";
        serializationObject.renderList = [];
        if (this._refractionRTT && this._refractionRTT.renderList) {
            for (let i = 0; i < this._refractionRTT.renderList.length; i++) {
                serializationObject.renderList.push(this._refractionRTT.renderList[i].id);
            }
        }
        return serializationObject;
    }
    getClassName() {
        return "WaterMaterial";
    }
    // Statics
    static Parse(source, scene, rootUrl) {
        const mat = SerializationHelper.Parse(() => new WaterMaterial(source.name, scene), source, scene, rootUrl);
        mat._waitingRenderList = source.renderList;
        return mat;
    }
    static CreateDefaultMesh(name, scene) {
        const mesh = CreateGround(name, { width: 512, height: 512, subdivisions: 32, updatable: false }, scene);
        return mesh;
    }
}
__decorate([
    serializeAsTexture("bumpTexture")
], WaterMaterial.prototype, "_bumpTexture", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsTexturesDirty")
], WaterMaterial.prototype, "bumpTexture", void 0);
__decorate([
    serializeAsColor3()
], WaterMaterial.prototype, "diffuseColor", void 0);
__decorate([
    serializeAsColor3()
], WaterMaterial.prototype, "specularColor", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "specularPower", void 0);
__decorate([
    serialize("disableLighting")
], WaterMaterial.prototype, "_disableLighting", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], WaterMaterial.prototype, "disableLighting", void 0);
__decorate([
    serialize("maxSimultaneousLights")
], WaterMaterial.prototype, "_maxSimultaneousLights", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsLightsDirty")
], WaterMaterial.prototype, "maxSimultaneousLights", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "windForce", void 0);
__decorate([
    serializeAsVector2()
], WaterMaterial.prototype, "windDirection", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "waveHeight", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "bumpHeight", void 0);
__decorate([
    serialize("bumpSuperimpose")
], WaterMaterial.prototype, "_bumpSuperimpose", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], WaterMaterial.prototype, "bumpSuperimpose", void 0);
__decorate([
    serialize("fresnelSeparate")
], WaterMaterial.prototype, "_fresnelSeparate", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], WaterMaterial.prototype, "fresnelSeparate", void 0);
__decorate([
    serialize("bumpAffectsReflection")
], WaterMaterial.prototype, "_bumpAffectsReflection", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], WaterMaterial.prototype, "bumpAffectsReflection", void 0);
__decorate([
    serializeAsColor3()
], WaterMaterial.prototype, "waterColor", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "colorBlendFactor", void 0);
__decorate([
    serializeAsColor3()
], WaterMaterial.prototype, "waterColor2", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "colorBlendFactor2", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "waveLength", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "waveSpeed", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "waveCount", void 0);
__decorate([
    serialize()
], WaterMaterial.prototype, "disableClipPlane", void 0);
__decorate([
    serialize("useWorldCoordinatesForWaveDeformation")
], WaterMaterial.prototype, "_useWorldCoordinatesForWaveDeformation", void 0);
__decorate([
    expandToProperty("_markAllSubMeshesAsMiscDirty")
], WaterMaterial.prototype, "useWorldCoordinatesForWaveDeformation", void 0);
RegisterClass("BABYLON.WaterMaterial", WaterMaterial);
//# sourceMappingURL=waterMaterial.js.map