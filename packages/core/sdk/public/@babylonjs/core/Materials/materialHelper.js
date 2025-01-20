import { BindBonesParameters, BindFogParameters, BindLight, BindLightProperties, BindLights, BindLogDepth, BindMorphTargetParameters, BindSceneUniformBuffer, BindTextureMatrix, GetFogState, HandleFallbacksForShadows, PrepareAttributesForBakedVertexAnimation, PrepareAttributesForBones, PrepareAttributesForInstances, PrepareAttributesForMorphTargets, PrepareAttributesForMorphTargetsInfluencers, PrepareDefinesForAttributes, PrepareDefinesForBakedVertexAnimation, PrepareDefinesForBones, PrepareDefinesForCamera, PrepareDefinesForFrameBoundValues, PrepareDefinesForLight, PrepareDefinesForLights, PrepareDefinesForMergedUV, PrepareDefinesForMisc, PrepareDefinesForMorphTargets, PrepareDefinesForMultiview, PrepareDefinesForOIT, PrepareDefinesForPrePass, PrepareUniformsAndSamplersForLight, PrepareUniformsAndSamplersList, PushAttributesForInstances, } from "./materialHelper.functions.js";
/**
 * "Static Class" containing the most commonly used helper while dealing with material for rendering purpose.
 *
 * It contains the basic tools to help defining defines, binding uniform for the common part of the materials.
 *
 * This works by convention in BabylonJS but is meant to be use only with shader following the in place naming rules and conventions.
 */
export class MaterialHelper {
}
/**
 * Binds the scene's uniform buffer to the effect.
 * @param effect defines the effect to bind to the scene uniform buffer
 * @param sceneUbo defines the uniform buffer storing scene data
 */
MaterialHelper.BindSceneUniformBuffer = BindSceneUniformBuffer;
/**
 * Helps preparing the defines values about the UVs in used in the effect.
 * UVs are shared as much as we can across channels in the shaders.
 * @param texture The texture we are preparing the UVs for
 * @param defines The defines to update
 * @param key The channel key "diffuse", "specular"... used in the shader
 */
MaterialHelper.PrepareDefinesForMergedUV = PrepareDefinesForMergedUV;
/**
 * Binds a texture matrix value to its corresponding uniform
 * @param texture The texture to bind the matrix for
 * @param uniformBuffer The uniform buffer receiving the data
 * @param key The channel key "diffuse", "specular"... used in the shader
 */
MaterialHelper.BindTextureMatrix = BindTextureMatrix;
/**
 * Gets the current status of the fog (should it be enabled?)
 * @param mesh defines the mesh to evaluate for fog support
 * @param scene defines the hosting scene
 * @returns true if fog must be enabled
 */
MaterialHelper.GetFogState = GetFogState;
/**
 * Helper used to prepare the list of defines associated with misc. values for shader compilation
 * @param mesh defines the current mesh
 * @param scene defines the current scene
 * @param useLogarithmicDepth defines if logarithmic depth has to be turned on
 * @param pointsCloud defines if point cloud rendering has to be turned on
 * @param fogEnabled defines if fog has to be turned on
 * @param alphaTest defines if alpha testing has to be turned on
 * @param defines defines the current list of defines
 * @param applyDecalAfterDetail Defines if the decal is applied after or before the detail
 */
MaterialHelper.PrepareDefinesForMisc = PrepareDefinesForMisc;
/**
 * Helper used to prepare the defines relative to the active camera
 * @param scene defines the current scene
 * @param defines specifies the list of active defines
 * @returns true if the defines have been updated, else false
 */
MaterialHelper.PrepareDefinesForCamera = PrepareDefinesForCamera;
/**
 * Helper used to prepare the list of defines associated with frame values for shader compilation
 * @param scene defines the current scene
 * @param engine defines the current engine
 * @param material defines the material we are compiling the shader for
 * @param defines specifies the list of active defines
 * @param useInstances defines if instances have to be turned on
 * @param useClipPlane defines if clip plane have to be turned on
 * @param useThinInstances defines if thin instances have to be turned on
 */
MaterialHelper.PrepareDefinesForFrameBoundValues = PrepareDefinesForFrameBoundValues;
/**
 * Prepares the defines for bones
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
MaterialHelper.PrepareDefinesForBones = PrepareDefinesForBones;
/**
 * Prepares the defines for morph targets
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
MaterialHelper.PrepareDefinesForMorphTargets = PrepareDefinesForMorphTargets;
/**
 * Prepares the defines for baked vertex animation
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
MaterialHelper.PrepareDefinesForBakedVertexAnimation = PrepareDefinesForBakedVertexAnimation;
/**
 * Prepares the defines used in the shader depending on the attributes data available in the mesh
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 * @param useVertexColor Precise whether vertex colors should be used or not (override mesh info)
 * @param useBones Precise whether bones should be used or not (override mesh info)
 * @param useMorphTargets Precise whether morph targets should be used or not (override mesh info)
 * @param useVertexAlpha Precise whether vertex alpha should be used or not (override mesh info)
 * @param useBakedVertexAnimation Precise whether baked vertex animation should be used or not (override mesh info)
 * @returns false if defines are considered not dirty and have not been checked
 */
MaterialHelper.PrepareDefinesForAttributes = PrepareDefinesForAttributes;
/**
 * Prepares the defines related to multiview
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 */
MaterialHelper.PrepareDefinesForMultiview = PrepareDefinesForMultiview;
/**
 * Prepares the defines related to order independant transparency
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 * @param needAlphaBlending Determines if the material needs alpha blending
 */
MaterialHelper.PrepareDefinesForOIT = PrepareDefinesForOIT;
/**
 * Prepares the defines related to the prepass
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 * @param canRenderToMRT Indicates if this material renders to several textures in the prepass
 */
MaterialHelper.PrepareDefinesForPrePass = PrepareDefinesForPrePass;
/**
 * Prepares the defines related to the light information passed in parameter
 * @param scene The scene we are intending to draw
 * @param mesh The mesh the effect is compiling for
 * @param light The light the effect is compiling for
 * @param lightIndex The index of the light
 * @param defines The defines to update
 * @param specularSupported Specifies whether specular is supported or not (override lights data)
 * @param state Defines the current state regarding what is needed (normals, etc...)
 * @param state.needNormals
 * @param state.needRebuild
 * @param state.shadowEnabled
 * @param state.specularEnabled
 * @param state.lightmapMode
 */
MaterialHelper.PrepareDefinesForLight = PrepareDefinesForLight;
/**
 * Prepares the defines related to the light information passed in parameter
 * @param scene The scene we are intending to draw
 * @param mesh The mesh the effect is compiling for
 * @param defines The defines to update
 * @param specularSupported Specifies whether specular is supported or not (override lights data)
 * @param maxSimultaneousLights Specifies how manuy lights can be added to the effect at max
 * @param disableLighting Specifies whether the lighting is disabled (override scene and light)
 * @returns true if normals will be required for the rest of the effect
 */
MaterialHelper.PrepareDefinesForLights = PrepareDefinesForLights;
/**
 * Prepares the uniforms and samplers list to be used in the effect (for a specific light)
 * @param lightIndex defines the light index
 * @param uniformsList The uniform list
 * @param samplersList The sampler list
 * @param projectedLightTexture defines if projected texture must be used
 * @param uniformBuffersList defines an optional list of uniform buffers
 * @param updateOnlyBuffersList True to only update the uniformBuffersList array
 */
MaterialHelper.PrepareUniformsAndSamplersForLight = PrepareUniformsAndSamplersForLight;
/**
 * Prepares the uniforms and samplers list to be used in the effect
 * @param uniformsListOrOptions The uniform names to prepare or an EffectCreationOptions containing the list and extra information
 * @param samplersList The sampler list
 * @param defines The defines helping in the list generation
 * @param maxSimultaneousLights The maximum number of simultaneous light allowed in the effect
 */
MaterialHelper.PrepareUniformsAndSamplersList = PrepareUniformsAndSamplersList;
/**
 * This helps decreasing rank by rank the shadow quality (0 being the highest rank and quality)
 * @param defines The defines to update while falling back
 * @param fallbacks The authorized effect fallbacks
 * @param maxSimultaneousLights The maximum number of lights allowed
 * @param rank the current rank of the Effect
 * @returns The newly affected rank
 */
MaterialHelper.HandleFallbacksForShadows = HandleFallbacksForShadows;
/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param influencers The number of influencers
 */
MaterialHelper.PrepareAttributesForMorphTargetsInfluencers = PrepareAttributesForMorphTargetsInfluencers;
/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param defines The current Defines of the effect
 */
MaterialHelper.PrepareAttributesForMorphTargets = PrepareAttributesForMorphTargets;
/**
 * Prepares the list of attributes required for baked vertex animations according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare for baked vertex animations
 * @param defines The current Defines of the effect
 */
MaterialHelper.PrepareAttributesForBakedVertexAnimation = PrepareAttributesForBakedVertexAnimation;
/**
 * Prepares the list of attributes required for bones according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the bones attributes for
 * @param defines The current Defines of the effect
 * @param fallbacks The current effect fallback strategy
 */
MaterialHelper.PrepareAttributesForBones = PrepareAttributesForBones;
/**
 * Check and prepare the list of attributes required for instances according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param defines The current MaterialDefines of the effect
 */
MaterialHelper.PrepareAttributesForInstances = PrepareAttributesForInstances;
/**
 * Add the list of attributes required for instances to the attribs array.
 * @param attribs The current list of supported attribs
 * @param needsPreviousMatrices If the shader needs previous matrices
 */
MaterialHelper.PushAttributesForInstances = PushAttributesForInstances;
/**
 * Binds the light information to the effect.
 * @param light The light containing the generator
 * @param effect The effect we are binding the data to
 * @param lightIndex The light index in the effect used to render
 */
MaterialHelper.BindLightProperties = BindLightProperties;
/**
 * Binds the lights information from the scene to the effect for the given mesh.
 * @param light Light to bind
 * @param lightIndex Light index
 * @param scene The scene where the light belongs to
 * @param effect The effect we are binding the data to
 * @param useSpecular Defines if specular is supported
 * @param receiveShadows Defines if the effect (mesh) we bind the light for receives shadows
 */
MaterialHelper.BindLight = BindLight;
/**
 * Binds the lights information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param defines The generated defines for the effect
 * @param maxSimultaneousLights The maximum number of light that can be bound to the effect
 */
MaterialHelper.BindLights = BindLights;
/**
 * Binds the fog information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param linearSpace Defines if the fog effect is applied in linear space
 */
MaterialHelper.BindFogParameters = BindFogParameters;
/**
 * Binds the bones information from the mesh to the effect.
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param prePassConfiguration Configuration for the prepass, in case prepass is activated
 */
MaterialHelper.BindBonesParameters = BindBonesParameters;
/**
 * Binds the morph targets information from the mesh to the effect.
 * @param abstractMesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 */
MaterialHelper.BindMorphTargetParameters = BindMorphTargetParameters;
/**
 * Binds the logarithmic depth information from the scene to the effect for the given defines.
 * @param defines The generated defines used in the effect
 * @param effect The effect we are binding the data to
 * @param scene The scene we are willing to render with logarithmic scale for
 */
MaterialHelper.BindLogDepth = BindLogDepth;
//# sourceMappingURL=materialHelper.js.map