
import { Matrix } from "../Maths/math.vector.js";
/**
 * Type of clear operation to perform on a geometry texture.
 */
export var GeometryRenderingTextureClearType;
(function (GeometryRenderingTextureClearType) {
    /**
     * Clear the texture with zero.
     */
    GeometryRenderingTextureClearType[GeometryRenderingTextureClearType["Zero"] = 0] = "Zero";
    /**
     * Clear the texture with one.
     */
    GeometryRenderingTextureClearType[GeometryRenderingTextureClearType["One"] = 1] = "One";
    /**
     * Clear the texture with the maximum view Z value.
     */
    GeometryRenderingTextureClearType[GeometryRenderingTextureClearType["MaxViewZ"] = 2] = "MaxViewZ";
})(GeometryRenderingTextureClearType || (GeometryRenderingTextureClearType = {}));
/**
 * Helper class to manage geometry rendering.
 */
export class MaterialHelperGeometryRendering {
    /**
     * Creates a new geometry rendering configuration.
     * @param renderPassId Render pass id the configuration is created for.
     * @returns The created configuration.
     */
    static CreateConfiguration(renderPassId) {
        MaterialHelperGeometryRendering._Configurations[renderPassId] = {
            defines: {},
            previousWorldMatrices: {},
            previousViewProjection: Matrix.Zero(),
            currentViewProjection: Matrix.Zero(),
            previousBones: {},
            lastUpdateFrameId: -1,
            excludedSkinnedMesh: [],
        };
        return MaterialHelperGeometryRendering._Configurations[renderPassId];
    }
    /**
     * Deletes a geometry rendering configuration.
     * @param renderPassId The render pass id of the configuration to delete.
     */
    static DeleteConfiguration(renderPassId) {
        delete MaterialHelperGeometryRendering._Configurations[renderPassId];
    }
    /**
     * Gets a geometry rendering configuration.
     * @param renderPassId The render pass id of the configuration to get.
     * @returns The configuration.
     */
    static GetConfiguration(renderPassId) {
        return MaterialHelperGeometryRendering._Configurations[renderPassId];
    }
    /**
     * Adds uniforms and samplers for geometry rendering.
     * @param uniforms The array of uniforms to add to.
     * @param _samplers The array of samplers to add to.
     */
    static AddUniformsAndSamplers(uniforms, _samplers) {
        uniforms.push("previousWorld", "previousViewProjection", "mPreviousBones");
    }
    /**
     * Marks a list of meshes as dirty for geometry rendering.
     * @param renderPassId The render pass id the meshes are marked as dirty for.
     * @param meshes The list of meshes to mark as dirty.
     */
    static MarkAsDirty(renderPassId, meshes) {
        for (const mesh of meshes) {
            if (!mesh.subMeshes) {
                continue;
            }
            for (const subMesh of mesh.subMeshes) {
                subMesh._removeDrawWrapper(renderPassId);
            }
        }
    }
    /**
     * Prepares defines for geometry rendering.
     * @param renderPassId The render pass id the defines are prepared for.
     * @param mesh The mesh the defines are prepared for.
     * @param defines The defines to update according to the geometry rendering configuration.
     */
    static PrepareDefines(renderPassId, mesh, defines) {
        if (!defines._arePrePassDirty) {
            return;
        }
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            return;
        }
        defines["PREPASS"] = true;
        defines["PREPASS_COLOR"] = false;
        defines["PREPASS_COLOR_INDEX"] = -1;
        let numMRT = 0;
        for (let i = 0; i < MaterialHelperGeometryRendering.GeometryTextureDescriptions.length; i++) {
            const geometryTextureDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[i];
            const defineName = geometryTextureDescription.define;
            const defineIndex = geometryTextureDescription.defineIndex;
            const index = configuration.defines[defineIndex];
            if (index !== undefined) {
                defines[defineName] = true;
                defines[defineIndex] = index;
                numMRT++;
            }
            else {
                defines[defineName] = false;
                delete defines[defineIndex];
            }
        }
        defines["SCENE_MRT_COUNT"] = numMRT;
        defines["BONES_VELOCITY_ENABLED"] =
            mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton && !mesh.skeleton.isUsingTextureForMatrices && configuration.excludedSkinnedMesh.indexOf(mesh) === -1;
    }
    /**
     * Binds geometry rendering data for a mesh.
     * @param renderPassId The render pass id the geometry rendering data is bound for.
     * @param effect The effect to bind the geometry rendering data to.
     * @param mesh The mesh to bind the geometry rendering data for.
     * @param world The world matrix of the mesh.
     */
    static Bind(renderPassId, effect, mesh, world) {
        const configuration = MaterialHelperGeometryRendering._Configurations[renderPassId];
        if (!configuration) {
            return;
        }
        if (configuration.defines["PREPASS_VELOCITY_INDEX"] !== undefined || configuration.defines["PREPASS_VELOCITY_LINEAR_INDEX"] !== undefined) {
            if (!configuration.previousWorldMatrices[mesh.uniqueId]) {
                configuration.previousWorldMatrices[mesh.uniqueId] = world.clone();
            }
            const scene = mesh.getScene();
            if (!configuration.previousViewProjection) {
                configuration.previousViewProjection = scene.getTransformMatrix().clone();
                configuration.currentViewProjection = scene.getTransformMatrix().clone();
            }
            const engine = scene.getEngine();
            if (configuration.currentViewProjection.updateFlag !== scene.getTransformMatrix().updateFlag) {
                // First update of the prepass configuration for this rendering pass
                configuration.lastUpdateFrameId = engine.frameId;
                configuration.previousViewProjection.copyFrom(configuration.currentViewProjection);
                configuration.currentViewProjection.copyFrom(scene.getTransformMatrix());
            }
            else if (configuration.lastUpdateFrameId !== engine.frameId) {
                // The scene transformation did not change from the previous frame (so no camera motion), we must update previousViewProjection accordingly
                configuration.lastUpdateFrameId = engine.frameId;
                configuration.previousViewProjection.copyFrom(configuration.currentViewProjection);
            }
            effect.setMatrix("previousWorld", configuration.previousWorldMatrices[mesh.uniqueId]);
            effect.setMatrix("previousViewProjection", configuration.previousViewProjection);
            configuration.previousWorldMatrices[mesh.uniqueId] = world.clone();
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                const skeleton = mesh.skeleton;
                if (!skeleton.isUsingTextureForMatrices || effect.getUniformIndex("boneTextureWidth") === -1) {
                    const matrices = skeleton.getTransformMatrices(mesh);
                    if (matrices) {
                        if (!configuration.previousBones[mesh.uniqueId]) {
                            configuration.previousBones[mesh.uniqueId] = matrices.slice();
                        }
                        effect.setMatrices("mPreviousBones", configuration.previousBones[mesh.uniqueId]);
                        configuration.previousBones[mesh.uniqueId].set(matrices);
                    }
                }
            }
        }
    }
}
/**
 * Descriptions of the geometry textures.
 */
MaterialHelperGeometryRendering.GeometryTextureDescriptions = [
    {
        type: 0,
        name: "Irradiance",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_IRRADIANCE",
        defineIndex: "PREPASS_IRRADIANCE_INDEX",
    },
    {
        type: 1,
        name: "WorldPosition",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_POSITION",
        defineIndex: "PREPASS_POSITION_INDEX",
    },
    {
        type: 2,
        name: "Velocity",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_VELOCITY",
        defineIndex: "PREPASS_VELOCITY_INDEX",
    },
    {
        type: 3,
        name: "Reflectivity",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_REFLECTIVITY",
        defineIndex: "PREPASS_REFLECTIVITY_INDEX",
    },
    {
        type: 5,
        name: "ViewDepth",
        clearType: 2 /* GeometryRenderingTextureClearType.MaxViewZ */,
        define: "PREPASS_DEPTH",
        defineIndex: "PREPASS_DEPTH_INDEX",
    },
    {
        type: 6,
        name: "ViewNormal",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_NORMAL",
        defineIndex: "PREPASS_NORMAL_INDEX",
    },
    {
        type: 7,
        name: "AlbedoSqrt",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_ALBEDO_SQRT",
        defineIndex: "PREPASS_ALBEDO_SQRT_INDEX",
    },
    {
        type: 8,
        name: "WorldNormal",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_WORLD_NORMAL",
        defineIndex: "PREPASS_WORLD_NORMAL_INDEX",
    },
    {
        type: 9,
        name: "LocalPosition",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_LOCAL_POSITION",
        defineIndex: "PREPASS_LOCAL_POSITION_INDEX",
    },
    {
        type: 10,
        name: "ScreenDepth",
        clearType: 1 /* GeometryRenderingTextureClearType.One */,
        define: "PREPASS_SCREENSPACE_DEPTH",
        defineIndex: "PREPASS_SCREENSPACE_DEPTH_INDEX",
    },
    {
        type: 11,
        name: "LinearVelocity",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_VELOCITY_LINEAR",
        defineIndex: "PREPASS_VELOCITY_LINEAR_INDEX",
    },
    {
        type: 12,
        name: "Albedo",
        clearType: 0 /* GeometryRenderingTextureClearType.Zero */,
        define: "PREPASS_ALBEDO",
        defineIndex: "PREPASS_ALBEDO_INDEX",
    },
];
MaterialHelperGeometryRendering._Configurations = {};
//# sourceMappingURL=materialHelper.geometryrendering.js.map