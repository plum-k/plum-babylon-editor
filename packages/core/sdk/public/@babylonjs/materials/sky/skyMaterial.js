import { __decorate } from "@babylonjs/core/tslib.es6.js";
import { serializeAsVector3, serialize } from "@babylonjs/core/Misc/decorators.js";
import { SerializationHelper } from "@babylonjs/core/Misc/decorators.serialization.js";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { MaterialDefines } from "@babylonjs/core/Materials/materialDefines.js";
import { PushMaterial } from "@babylonjs/core/Materials/pushMaterial.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { Scene } from "@babylonjs/core/scene.js";
import { RegisterClass } from "@babylonjs/core/Misc/typeStore.js";
import "./sky.fragment.js";
import "./sky.vertex.js";
import { EffectFallbacks } from "@babylonjs/core/Materials/effectFallbacks.js";
import { addClipPlaneUniforms, bindClipPlane } from "@babylonjs/core/Materials/clipPlaneMaterialHelper.js";
import { BindFogParameters, BindLogDepth, PrepareDefinesForAttributes, PrepareDefinesForMisc } from "@babylonjs/core/Materials/materialHelper.functions.js";
/** @internal */
class SkyMaterialDefines extends MaterialDefines {
    constructor() {
        super();
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.POINTSIZE = false;
        this.FOG = false;
        this.VERTEXCOLOR = false;
        this.VERTEXALPHA = false;
        this.IMAGEPROCESSINGPOSTPROCESS = false;
        this.SKIPFINALCOLORCLAMP = false;
        this.DITHER = false;
        this.LOGARITHMICDEPTH = false;
        this.rebuild();
    }
}
/**
 * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
 * @see https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat
 */
export class SkyMaterial extends PushMaterial {
    /**
     * Instantiates a new sky material.
     * This material allows to create dynamic and texture free
     * effects for skyboxes by taking care of the atmosphere state.
     * @see https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat
     * @param name Define the name of the material in the scene
     * @param scene Define the scene the material belong to
     */
    constructor(name, scene) {
        super(name, scene);
        /**
         * Defines the overall luminance of sky in interval ]0, 1[.
         */
        this.luminance = 1.0;
        /**
         * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
         */
        this.turbidity = 10.0;
        /**
         * Defines the sky appearance (light intensity).
         */
        this.rayleigh = 2.0;
        /**
         * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
         */
        this.mieCoefficient = 0.005;
        /**
         * Defines the amount of haze particles following the Mie scattering theory.
         */
        this.mieDirectionalG = 0.8;
        /**
         * Defines the distance of the sun according to the active scene camera.
         */
        this.distance = 500;
        /**
         * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
         * "inclined".
         */
        this.inclination = 0.49;
        /**
         * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
         * an object direction and a reference direction.
         */
        this.azimuth = 0.25;
        /**
         * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
         * the property is overridden by the inclination and the azimuth and can be read at any moment.
         */
        this.sunPosition = new Vector3(0, 100, 0);
        /**
         * Defines if the sun position should be computed (inclination and azimuth) according to the given
         * .sunPosition property.
         */
        this.useSunPosition = false;
        /**
         * Defines an offset vector used to get a horizon offset.
         * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
         */
        this.cameraOffset = Vector3.Zero();
        /**
         * Defines the vector the skyMaterial should consider as up. (default is Vector3(0, 1, 0) as returned by Vector3.Up())
         */
        this.up = Vector3.Up();
        /**
         * Defines if sky should be dithered.
         */
        this.dithering = false;
        // Private members
        this._cameraPosition = Vector3.Zero();
        this._skyOrientation = new Quaternion();
    }
    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    needAlphaBlending() {
        return this.alpha < 1.0;
    }
    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns false as the sky material doesn't need alpha testing.
     */
    needAlphaTesting() {
        return false;
    }
    /**
     * Get the texture used for alpha test purpose.
     * @returns null as the sky material has no texture.
     */
    getAlphaTestTexture() {
        return null;
    }
    /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @returns a boolean indicating that the submesh is ready or not
     */
    isReadyForSubMesh(mesh, subMesh) {
        const drawWrapper = subMesh._drawWrapper;
        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new SkyMaterialDefines();
        }
        const defines = subMesh.materialDefines;
        const scene = this.getScene();
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, false, defines);
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, false);
        if (defines.IMAGEPROCESSINGPOSTPROCESS !== scene.imageProcessingConfiguration.applyByPostProcess) {
            defines.markAsMiscDirty();
        }
        if (defines.DITHER !== this.dithering) {
            defines.markAsMiscDirty();
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
            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            defines.DITHER = this.dithering;
            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }
            const shaderName = "sky";
            const uniforms = [
                "world",
                "viewProjection",
                "view",
                "vFogInfos",
                "vFogColor",
                "logarithmicDepthConstant",
                "pointSize",
                "luminance",
                "turbidity",
                "rayleigh",
                "mieCoefficient",
                "mieDirectionalG",
                "sunPosition",
                "cameraPosition",
                "cameraOffset",
                "up",
            ];
            addClipPlaneUniforms(uniforms);
            const join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect(shaderName, attribs, uniforms, [], join, fallbacks, this.onCompiled, this.onError), defines, this._materialContext);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        return true;
    }
    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
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
        if (this._mustRebind(scene, effect, subMesh)) {
            bindClipPlane(effect, this, scene);
            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }
            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
        }
        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }
        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);
        // Sky
        const camera = scene.activeCamera;
        if (camera) {
            const cameraWorldMatrix = camera.getWorldMatrix();
            this._cameraPosition.x = cameraWorldMatrix.m[12];
            this._cameraPosition.y = cameraWorldMatrix.m[13];
            this._cameraPosition.z = cameraWorldMatrix.m[14];
            this._activeEffect.setVector3("cameraPosition", this._cameraPosition);
        }
        this._activeEffect.setVector3("cameraOffset", this.cameraOffset);
        this._activeEffect.setVector3("up", this.up);
        if (this.luminance > 0) {
            this._activeEffect.setFloat("luminance", this.luminance);
        }
        this._activeEffect.setFloat("turbidity", this.turbidity);
        this._activeEffect.setFloat("rayleigh", this.rayleigh);
        this._activeEffect.setFloat("mieCoefficient", this.mieCoefficient);
        this._activeEffect.setFloat("mieDirectionalG", this.mieDirectionalG);
        if (!this.useSunPosition) {
            const theta = Math.PI * (this.inclination - 0.5);
            const phi = 2 * Math.PI * (this.azimuth - 0.5);
            this.sunPosition.x = this.distance * Math.cos(phi) * Math.cos(theta);
            this.sunPosition.y = this.distance * Math.sin(-theta);
            this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, this.up, this._skyOrientation);
            this.sunPosition.rotateByQuaternionToRef(this._skyOrientation, this.sunPosition);
        }
        this._activeEffect.setVector3("sunPosition", this.sunPosition);
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    /**
     * Get the list of animatables in the material.
     * @returns the list of animatables object used in the material
     */
    getAnimatables() {
        return [];
    }
    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     */
    dispose(forceDisposeEffect) {
        super.dispose(forceDisposeEffect);
    }
    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @returns the cloned material
     */
    clone(name) {
        return SerializationHelper.Clone(() => new SkyMaterial(name, this.getScene()), this);
    }
    /**
     * Serializes this material in a JSON representation
     * @returns the serialized material object
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.SkyMaterial";
        return serializationObject;
    }
    /**
     * Gets the current class name of the material e.g. "SkyMaterial"
     * Mainly use in serialization.
     * @returns the class name
     */
    getClassName() {
        return "SkyMaterial";
    }
    /**
     * Creates a sky material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new sky material
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new SkyMaterial(source.name, scene), source, scene, rootUrl);
    }
}
__decorate([
    serialize()
], SkyMaterial.prototype, "luminance", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "turbidity", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "rayleigh", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "mieCoefficient", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "mieDirectionalG", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "distance", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "inclination", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "azimuth", void 0);
__decorate([
    serializeAsVector3()
], SkyMaterial.prototype, "sunPosition", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "useSunPosition", void 0);
__decorate([
    serializeAsVector3()
], SkyMaterial.prototype, "cameraOffset", void 0);
__decorate([
    serializeAsVector3()
], SkyMaterial.prototype, "up", void 0);
__decorate([
    serialize()
], SkyMaterial.prototype, "dithering", void 0);
RegisterClass("BABYLON.SkyMaterial", SkyMaterial);
//# sourceMappingURL=skyMaterial.js.map