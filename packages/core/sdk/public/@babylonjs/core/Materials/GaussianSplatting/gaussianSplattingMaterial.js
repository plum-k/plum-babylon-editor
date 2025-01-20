import { SerializationHelper } from "../../Misc/decorators.serialization.js";
import { VertexBuffer } from "../../Buffers/buffer.js";
import { MaterialDefines } from "../../Materials/materialDefines.js";
import { PushMaterial } from "../../Materials/pushMaterial.js";
import { RegisterClass } from "../../Misc/typeStore.js";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper.js";
import { Camera } from "../../Cameras/camera.js";
import "../../Shaders/gaussianSplatting.fragment.js";
import "../../Shaders/gaussianSplatting.vertex.js";
import "../../ShadersWGSL/gaussianSplatting.fragment.js";
import "../../ShadersWGSL/gaussianSplatting.vertex.js";
import { BindFogParameters, BindLogDepth, PrepareAttributesForInstances, PrepareDefinesForAttributes, PrepareDefinesForFrameBoundValues, PrepareDefinesForMisc, PrepareUniformsAndSamplersList, } from "../materialHelper.functions.js";
/**
 * @internal
 */
class GaussianSplattingMaterialDefines extends MaterialDefines {
    /**
     * Constructor of the defines.
     */
    constructor() {
        super();
        this.FOG = false;
        this.THIN_INSTANCES = true;
        this.LOGARITHMICDEPTH = false;
        this.CLIPPLANE = false;
        this.CLIPPLANE2 = false;
        this.CLIPPLANE3 = false;
        this.CLIPPLANE4 = false;
        this.CLIPPLANE5 = false;
        this.CLIPPLANE6 = false;
        this.SH_DEGREE = 0;
        this.rebuild();
    }
}
/**
 * GaussianSplattingMaterial material used to render Gaussian Splatting
 * @experimental
 */
export class GaussianSplattingMaterial extends PushMaterial {
    /**
     * Instantiates a Gaussian Splatting Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     */
    constructor(name, scene) {
        super(name, scene);
        this.backFaceCulling = false;
    }
    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    get hasRenderTargetTextures() {
        return false;
    }
    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     * @returns false
     */
    needAlphaTesting() {
        return false;
    }
    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     * @returns true
     */
    needAlphaBlending() {
        return true;
    }
    /**
     * Checks whether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    isReadyForSubMesh(mesh, subMesh) {
        const useInstances = true;
        const drawWrapper = subMesh._drawWrapper;
        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }
        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GaussianSplattingMaterialDefines();
        }
        const scene = this.getScene();
        const defines = subMesh.materialDefines;
        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }
        const engine = scene.getEngine();
        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, false, defines);
        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, true);
        // Attribs
        PrepareDefinesForAttributes(mesh, defines, false, false);
        // SH is disabled for webGL1
        if (engine.version > 1 || engine.isWebGPU) {
            defines["SH_DEGREE"] = mesh.shDegree;
        }
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();
            //Attributes
            const attribs = [VertexBuffer.PositionKind, "splatIndex"];
            PrepareAttributesForInstances(attribs, defines);
            const uniforms = ["world", "view", "projection", "vFogInfos", "vFogColor", "logarithmicDepthConstant", "invViewport", "dataTextureSize", "focal", "vEyePosition"];
            const samplers = ["covariancesATexture", "covariancesBTexture", "centersTexture", "colorsTexture", "shTexture0", "shTexture1", "shTexture2"];
            const uniformBuffers = ["Scene", "Mesh"];
            PrepareUniformsAndSamplersList({
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
            });
            addClipPlaneUniforms(uniforms);
            const join = defines.toString();
            const effect = scene.getEngine().createEffect("gaussianSplatting", {
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: {},
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: async () => {
                    if (this._shaderLanguage === 1 /* ShaderLanguage.WGSL */) {
                        await Promise.all([import("../../ShadersWGSL/gaussianSplatting.fragment.js"), import("../../ShadersWGSL/gaussianSplatting.vertex.js")]);
                    }
                    else {
                        await Promise.all([import("../../Shaders/gaussianSplatting.fragment.js"), import("../../Shaders/gaussianSplatting.vertex.js")]);
                    }
                },
            }, engine);
            subMesh.setEffect(effect, defines, this._materialContext);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }
        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;
        return true;
    }
    /**
     * Bind material effect for a specific Gaussian Splatting mesh
     * @param mesh Gaussian splatting mesh
     * @param effect Splatting material or node material
     * @param scene scene that contains mesh and camera used for rendering
     */
    static BindEffect(mesh, effect, scene) {
        const engine = scene.getEngine();
        const camera = scene.activeCamera;
        const renderWidth = engine.getRenderWidth();
        const renderHeight = engine.getRenderHeight();
        // check if rigcamera, get number of rigs
        const numberOfRigs = camera?.rigParent?.rigCameras.length || 1;
        effect.setFloat2("invViewport", 1 / (renderWidth / numberOfRigs), 1 / renderHeight);
        let focal = 1000;
        if (camera) {
            /*
            more explicit version:
            const t = camera.getProjectionMatrix().m[5];
            const FovY = Math.atan(1.0 / t) * 2.0;
            focal = renderHeight / 2.0 / Math.tan(FovY / 2.0);
            Using a shorter version here to not have tan(atan) and 2.0 factor
            */
            const t = camera.getProjectionMatrix().m[5];
            if (camera.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                focal = (renderHeight * t) / 2.0;
            }
            else {
                focal = (renderWidth * t) / 2.0;
            }
        }
        effect.setFloat2("focal", focal, focal);
        const gsMesh = mesh;
        if (gsMesh.covariancesATexture) {
            const textureSize = gsMesh.covariancesATexture.getSize();
            effect.setFloat2("dataTextureSize", textureSize.width, textureSize.height);
            effect.setTexture("covariancesATexture", gsMesh.covariancesATexture);
            effect.setTexture("covariancesBTexture", gsMesh.covariancesBTexture);
            effect.setTexture("centersTexture", gsMesh.centersTexture);
            effect.setTexture("colorsTexture", gsMesh.colorsTexture);
            if (gsMesh.shTextures) {
                for (let i = 0; i < gsMesh.shTextures?.length; i++) {
                    effect.setTexture(`shTexture${i}`, gsMesh.shTextures[i]);
                }
            }
        }
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
        // Matrices Mesh.
        mesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
        mesh.transferToEffect(world);
        // Bind data
        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);
        if (mustRebind) {
            this.bindView(effect);
            this.bindViewProjection(effect);
            GaussianSplattingMaterial.BindEffect(mesh, this._activeEffect, scene);
            // Clip plane
            bindClipPlane(effect, this, scene);
        }
        else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }
        // Fog
        BindFogParameters(scene, mesh, effect);
        // Log. depth
        if (this.useLogarithmicDepth) {
            BindLogDepth(defines, effect, scene);
        }
        this._afterBind(mesh, this._activeEffect, subMesh);
    }
    /**
     * Clones the material.
     * @param name The cloned name.
     * @returns The cloned material.
     */
    clone(name) {
        return SerializationHelper.Clone(() => new GaussianSplattingMaterial(name, this.getScene()), this);
    }
    /**
     * Serializes the current material to its JSON representation.
     * @returns The JSON representation.
     */
    serialize() {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GaussianSplattingMaterial";
        return serializationObject;
    }
    /**
     * Gets the class name of the material
     * @returns "GaussianSplattingMaterial"
     */
    getClassName() {
        return "GaussianSplattingMaterial";
    }
    /**
     * Parse a JSON input to create back a Gaussian Splatting material.
     * @param source The JSON data to parse
     * @param scene The scene to create the parsed material in
     * @param rootUrl The root url of the assets the material depends upon
     * @returns the instantiated GaussianSplattingMaterial.
     */
    static Parse(source, scene, rootUrl) {
        return SerializationHelper.Parse(() => new GaussianSplattingMaterial(source.name, scene), source, scene, rootUrl);
    }
}
RegisterClass("BABYLON.GaussianSplattingMaterial", GaussianSplattingMaterial);
//# sourceMappingURL=gaussianSplattingMaterial.js.map