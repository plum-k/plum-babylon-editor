import { Logger } from "../Misc/logger.js";

import { Color3 } from "../Maths/math.color.js";
import { EngineStore } from "../Engines/engineStore.js";
import { LightConstants } from "../Lights/lightConstants.js";
import { prepareDefinesForClipPlanes } from "./clipPlaneMaterialHelper.js";
// Temps
const _TempFogColor = Color3.Black();
const _TmpMorphInfluencers = {
    NUM_MORPH_INFLUENCERS: 0,
    NORMAL: false,
    TANGENT: false,
    UV: false,
    UV2: false,
};
/**
 * Binds the logarithmic depth information from the scene to the effect for the given defines.
 * @param defines The generated defines used in the effect
 * @param effect The effect we are binding the data to
 * @param scene The scene we are willing to render with logarithmic scale for
 */
export function BindLogDepth(defines, effect, scene) {
    if (!defines || defines["LOGARITHMICDEPTH"] || (defines.indexOf && defines.indexOf("LOGARITHMICDEPTH") >= 0)) {
        const camera = scene.activeCamera;
        if (camera.mode === 1) {
            Logger.Error("Logarithmic depth is not compatible with orthographic cameras!", 20);
        }
        effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(camera.maxZ + 1.0) / Math.LN2));
    }
}
/**
 * Binds the fog information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param linearSpace Defines if the fog effect is applied in linear space
 */
export function BindFogParameters(scene, mesh, effect, linearSpace = false) {
    if (effect && scene.fogEnabled && (!mesh || mesh.applyFog) && scene.fogMode !== 0) {
        effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
        // Convert fog color to linear space if used in a linear space computed shader.
        if (linearSpace) {
            scene.fogColor.toLinearSpaceToRef(_TempFogColor, scene.getEngine().useExactSrgbConversions);
            effect.setColor3("vFogColor", _TempFogColor);
        }
        else {
            effect.setColor3("vFogColor", scene.fogColor);
        }
    }
}
/**
 * Prepares the list of attributes and defines required for morph targets.
 * @param morphTargetManager The manager for the morph targets
 * @param defines The current list of defines
 * @param attribs The current list of attributes
 * @param mesh The mesh to prepare the defines and attributes for
 * @param usePositionMorph Whether the position morph target is used
 * @param useNormalMorph Whether the normal morph target is used
 * @param useTangentMorph Whether the tangent morph target is used
 * @param useUVMorph Whether the UV morph target is used
 * @param useUV2Morph Whether the UV2 morph target is used
 * @returns The maxSimultaneousMorphTargets for the effect
 */
export function PrepareDefinesAndAttributesForMorphTargets(morphTargetManager, defines, attribs, mesh, usePositionMorph, useNormalMorph, useTangentMorph, useUVMorph, useUV2Morph) {
    const numMorphInfluencers = morphTargetManager.numMaxInfluencers || morphTargetManager.numInfluencers;
    if (numMorphInfluencers <= 0) {
        return 0;
    }
    defines.push("#define MORPHTARGETS");
    if (morphTargetManager.hasPositions)
        defines.push("#define MORPHTARGETTEXTURE_HASPOSITIONS");
    if (morphTargetManager.hasNormals)
        defines.push("#define MORPHTARGETTEXTURE_HASNORMALS");
    if (morphTargetManager.hasTangents)
        defines.push("#define MORPHTARGETTEXTURE_HASTANGENTS");
    if (morphTargetManager.hasUVs)
        defines.push("#define MORPHTARGETTEXTURE_HASUVS");
    if (morphTargetManager.hasUV2s)
        defines.push("#define MORPHTARGETTEXTURE_HASUV2S");
    if (morphTargetManager.supportsPositions && usePositionMorph)
        defines.push("#define MORPHTARGETS_POSITION");
    if (morphTargetManager.supportsNormals && useNormalMorph)
        defines.push("#define MORPHTARGETS_NORMAL");
    if (morphTargetManager.supportsTangents && useTangentMorph)
        defines.push("#define MORPHTARGETS_TANGENT");
    if (morphTargetManager.supportsUVs && useUVMorph)
        defines.push("#define MORPHTARGETS_UV");
    if (morphTargetManager.supportsUV2s && useUV2Morph)
        defines.push("#define MORPHTARGETS_UV2");
    defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);
    if (morphTargetManager.isUsingTextureForTargets) {
        defines.push("#define MORPHTARGETS_TEXTURE");
    }
    _TmpMorphInfluencers.NUM_MORPH_INFLUENCERS = numMorphInfluencers;
    _TmpMorphInfluencers.NORMAL = useNormalMorph;
    _TmpMorphInfluencers.TANGENT = useTangentMorph;
    _TmpMorphInfluencers.UV = useUVMorph;
    _TmpMorphInfluencers.UV2 = useUV2Morph;
    PrepareAttributesForMorphTargets(attribs, mesh, _TmpMorphInfluencers, usePositionMorph);
    return numMorphInfluencers;
}
/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param influencers The number of influencers
 */
export function PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, influencers) {
    _TmpMorphInfluencers.NUM_MORPH_INFLUENCERS = influencers;
    _TmpMorphInfluencers.NORMAL = false;
    _TmpMorphInfluencers.TANGENT = false;
    _TmpMorphInfluencers.UV = false;
    _TmpMorphInfluencers.UV2 = false;
    PrepareAttributesForMorphTargets(attribs, mesh, _TmpMorphInfluencers, true);
}
/**
 * Prepares the list of attributes required for morph targets according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the morph targets attributes for
 * @param defines The current Defines of the effect
 * @param usePositionMorph Whether the position morph target is used
 */
export function PrepareAttributesForMorphTargets(attribs, mesh, defines, usePositionMorph = true) {
    const influencers = defines["NUM_MORPH_INFLUENCERS"];
    if (influencers > 0 && EngineStore.LastCreatedEngine) {
        const maxAttributesCount = EngineStore.LastCreatedEngine.getCaps().maxVertexAttribs;
        const manager = mesh.morphTargetManager;
        if (manager?.isUsingTextureForTargets) {
            return;
        }
        const position = manager && manager.supportsPositions && usePositionMorph;
        const normal = manager && manager.supportsNormals && defines["NORMAL"];
        const tangent = manager && manager.supportsTangents && defines["TANGENT"];
        const uv = manager && manager.supportsUVs && defines["UV1"];
        const uv2 = manager && manager.supportsUV2s && defines["UV2"];
        for (let index = 0; index < influencers; index++) {
            if (position) {
                attribs.push(`position` + index);
            }
            if (normal) {
                attribs.push(`normal` + index);
            }
            if (tangent) {
                attribs.push(`tangent` + index);
            }
            if (uv) {
                attribs.push(`uv` + "_" + index);
            }
            if (uv2) {
                attribs.push(`uv2` + "_" + index);
            }
            if (attribs.length > maxAttributesCount) {
                Logger.Error("Cannot add more vertex attributes for mesh " + mesh.name);
            }
        }
    }
}
/**
 * Add the list of attributes required for instances to the attribs array.
 * @param attribs The current list of supported attribs
 * @param needsPreviousMatrices If the shader needs previous matrices
 */
export function PushAttributesForInstances(attribs, needsPreviousMatrices = false) {
    attribs.push("world0");
    attribs.push("world1");
    attribs.push("world2");
    attribs.push("world3");
    if (needsPreviousMatrices) {
        attribs.push("previousWorld0");
        attribs.push("previousWorld1");
        attribs.push("previousWorld2");
        attribs.push("previousWorld3");
    }
}
/**
 * Binds the morph targets information from the mesh to the effect.
 * @param abstractMesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 */
export function BindMorphTargetParameters(abstractMesh, effect) {
    const manager = abstractMesh.morphTargetManager;
    if (!abstractMesh || !manager) {
        return;
    }
    effect.setFloatArray("morphTargetInfluences", manager.influences);
}
/**
 * Binds the scene's uniform buffer to the effect.
 * @param effect defines the effect to bind to the scene uniform buffer
 * @param sceneUbo defines the uniform buffer storing scene data
 */
export function BindSceneUniformBuffer(effect, sceneUbo) {
    sceneUbo.bindToEffect(effect, "Scene");
}
/**
 * Helps preparing the defines values about the UVs in used in the effect.
 * UVs are shared as much as we can across channels in the shaders.
 * @param texture The texture we are preparing the UVs for
 * @param defines The defines to update
 * @param key The channel key "diffuse", "specular"... used in the shader
 */
export function PrepareDefinesForMergedUV(texture, defines, key) {
    defines._needUVs = true;
    defines[key] = true;
    if (texture.optimizeUVAllocation && texture.getTextureMatrix().isIdentityAs3x2()) {
        defines[key + "DIRECTUV"] = texture.coordinatesIndex + 1;
        defines["MAINUV" + (texture.coordinatesIndex + 1)] = true;
    }
    else {
        defines[key + "DIRECTUV"] = 0;
    }
}
/**
 * Binds a texture matrix value to its corresponding uniform
 * @param texture The texture to bind the matrix for
 * @param uniformBuffer The uniform buffer receiving the data
 * @param key The channel key "diffuse", "specular"... used in the shader
 */
export function BindTextureMatrix(texture, uniformBuffer, key) {
    const matrix = texture.getTextureMatrix();
    uniformBuffer.updateMatrix(key + "Matrix", matrix);
}
/**
 * Prepares the list of attributes required for baked vertex animations according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare for baked vertex animations
 * @param defines The current Defines of the effect
 */
export function PrepareAttributesForBakedVertexAnimation(attribs, mesh, defines) {
    const enabled = defines["BAKED_VERTEX_ANIMATION_TEXTURE"] && defines["INSTANCES"];
    if (enabled) {
        attribs.push("bakedVertexAnimationSettingsInstanced");
    }
}
// Copies the bones transformation matrices into the target array and returns the target's reference
function _CopyBonesTransformationMatrices(source, target) {
    target.set(source);
    return target;
}
/**
 * Binds the bones information from the mesh to the effect.
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param prePassConfiguration Configuration for the prepass, in case prepass is activated
 */
export function BindBonesParameters(mesh, effect, prePassConfiguration) {
    if (!effect || !mesh) {
        return;
    }
    if (mesh.computeBonesUsingShaders && effect._bonesComputationForcedToCPU) {
        mesh.computeBonesUsingShaders = false;
    }
    if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
        const skeleton = mesh.skeleton;
        if (skeleton.isUsingTextureForMatrices && effect.getUniformIndex("boneTextureWidth") > -1) {
            const boneTexture = skeleton.getTransformMatrixTexture(mesh);
            effect.setTexture("boneSampler", boneTexture);
            effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
        }
        else {
            const matrices = skeleton.getTransformMatrices(mesh);
            if (matrices) {
                effect.setMatrices("mBones", matrices);
                if (prePassConfiguration && mesh.getScene().prePassRenderer && mesh.getScene().prePassRenderer.getIndex(2)) {
                    if (!prePassConfiguration.previousBones[mesh.uniqueId]) {
                        prePassConfiguration.previousBones[mesh.uniqueId] = matrices.slice();
                    }
                    effect.setMatrices("mPreviousBones", prePassConfiguration.previousBones[mesh.uniqueId]);
                    _CopyBonesTransformationMatrices(matrices, prePassConfiguration.previousBones[mesh.uniqueId]);
                }
            }
        }
    }
}
/**
 * Binds the light information to the effect.
 * @param light The light containing the generator
 * @param effect The effect we are binding the data to
 * @param lightIndex The light index in the effect used to render
 */
export function BindLightProperties(light, effect, lightIndex) {
    light.transferToEffect(effect, lightIndex + "");
}
/**
 * Binds the lights information from the scene to the effect for the given mesh.
 * @param light Light to bind
 * @param lightIndex Light index
 * @param scene The scene where the light belongs to
 * @param effect The effect we are binding the data to
 * @param useSpecular Defines if specular is supported
 * @param receiveShadows Defines if the effect (mesh) we bind the light for receives shadows
 */
export function BindLight(light, lightIndex, scene, effect, useSpecular, receiveShadows = true) {
    light._bindLight(lightIndex, scene, effect, useSpecular, receiveShadows);
}
/**
 * Binds the lights information from the scene to the effect for the given mesh.
 * @param scene The scene the lights belongs to
 * @param mesh The mesh we are binding the information to render
 * @param effect The effect we are binding the data to
 * @param defines The generated defines for the effect
 * @param maxSimultaneousLights The maximum number of light that can be bound to the effect
 */
export function BindLights(scene, mesh, effect, defines, maxSimultaneousLights = 4) {
    const len = Math.min(mesh.lightSources.length, maxSimultaneousLights);
    for (let i = 0; i < len; i++) {
        const light = mesh.lightSources[i];
        BindLight(light, i, scene, effect, typeof defines === "boolean" ? defines : defines["SPECULARTERM"], mesh.receiveShadows);
    }
}
/**
 * Prepares the list of attributes required for bones according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param mesh The mesh to prepare the bones attributes for
 * @param defines The current Defines of the effect
 * @param fallbacks The current effect fallback strategy
 */
export function PrepareAttributesForBones(attribs, mesh, defines, fallbacks) {
    if (defines["NUM_BONE_INFLUENCERS"] > 0) {
        fallbacks.addCPUSkinningFallback(0, mesh);
        attribs.push(`matricesIndices`);
        attribs.push(`matricesWeights`);
        if (defines["NUM_BONE_INFLUENCERS"] > 4) {
            attribs.push(`matricesIndicesExtra`);
            attribs.push(`matricesWeightsExtra`);
        }
    }
}
/**
 * Check and prepare the list of attributes required for instances according to the effect defines.
 * @param attribs The current list of supported attribs
 * @param defines The current MaterialDefines of the effect
 */
export function PrepareAttributesForInstances(attribs, defines) {
    if (defines["INSTANCES"] || defines["THIN_INSTANCES"]) {
        PushAttributesForInstances(attribs, !!defines["PREPASS_VELOCITY"]);
    }
    if (defines.INSTANCESCOLOR) {
        attribs.push(`instanceColor`);
    }
}
/**
 * This helps decreasing rank by rank the shadow quality (0 being the highest rank and quality)
 * @param defines The defines to update while falling back
 * @param fallbacks The authorized effect fallbacks
 * @param maxSimultaneousLights The maximum number of lights allowed
 * @param rank the current rank of the Effect
 * @returns The newly affected rank
 */
export function HandleFallbacksForShadows(defines, fallbacks, maxSimultaneousLights = 4, rank = 0) {
    let lightFallbackRank = 0;
    for (let lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
        if (!defines["LIGHT" + lightIndex]) {
            break;
        }
        if (lightIndex > 0) {
            lightFallbackRank = rank + lightIndex;
            fallbacks.addFallback(lightFallbackRank, "LIGHT" + lightIndex);
        }
        if (!defines["SHADOWS"]) {
            if (defines["SHADOW" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOW" + lightIndex);
            }
            if (defines["SHADOWPCF" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOWPCF" + lightIndex);
            }
            if (defines["SHADOWPCSS" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOWPCSS" + lightIndex);
            }
            if (defines["SHADOWPOISSON" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOWPOISSON" + lightIndex);
            }
            if (defines["SHADOWESM" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOWESM" + lightIndex);
            }
            if (defines["SHADOWCLOSEESM" + lightIndex]) {
                fallbacks.addFallback(rank, "SHADOWCLOSEESM" + lightIndex);
            }
        }
    }
    return lightFallbackRank++;
}
/**
 * Gets the current status of the fog (should it be enabled?)
 * @param mesh defines the mesh to evaluate for fog support
 * @param scene defines the hosting scene
 * @returns true if fog must be enabled
 */
export function GetFogState(mesh, scene) {
    return scene.fogEnabled && mesh.applyFog && scene.fogMode !== 0;
}
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
export function PrepareDefinesForMisc(mesh, scene, useLogarithmicDepth, pointsCloud, fogEnabled, alphaTest, defines, applyDecalAfterDetail = false) {
    if (defines._areMiscDirty) {
        defines["LOGARITHMICDEPTH"] = useLogarithmicDepth;
        defines["POINTSIZE"] = pointsCloud;
        defines["FOG"] = fogEnabled && GetFogState(mesh, scene);
        defines["NONUNIFORMSCALING"] = mesh.nonUniformScaling;
        defines["ALPHATEST"] = alphaTest;
        defines["DECAL_AFTER_DETAIL"] = applyDecalAfterDetail;
    }
}
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
export function PrepareDefinesForLights(scene, mesh, defines, specularSupported, maxSimultaneousLights = 4, disableLighting = false) {
    if (!defines._areLightsDirty) {
        return defines._needNormals;
    }
    let lightIndex = 0;
    const state = {
        needNormals: defines._needNormals, // prevents overriding previous reflection or other needs for normals
        needRebuild: false,
        lightmapMode: false,
        shadowEnabled: false,
        specularEnabled: false,
    };
    if (scene.lightsEnabled && !disableLighting) {
        for (const light of mesh.lightSources) {
            PrepareDefinesForLight(scene, mesh, light, lightIndex, defines, specularSupported, state);
            lightIndex++;
            if (lightIndex === maxSimultaneousLights) {
                break;
            }
        }
    }
    defines["SPECULARTERM"] = state.specularEnabled;
    defines["SHADOWS"] = state.shadowEnabled;
    // Resetting all other lights if any
    for (let index = lightIndex; index < maxSimultaneousLights; index++) {
        if (defines["LIGHT" + index] !== undefined) {
            defines["LIGHT" + index] = false;
            defines["HEMILIGHT" + index] = false;
            defines["POINTLIGHT" + index] = false;
            defines["DIRLIGHT" + index] = false;
            defines["SPOTLIGHT" + index] = false;
            defines["SHADOW" + index] = false;
            defines["SHADOWCSM" + index] = false;
            defines["SHADOWCSMDEBUG" + index] = false;
            defines["SHADOWCSMNUM_CASCADES" + index] = false;
            defines["SHADOWCSMUSESHADOWMAXZ" + index] = false;
            defines["SHADOWCSMNOBLEND" + index] = false;
            defines["SHADOWCSM_RIGHTHANDED" + index] = false;
            defines["SHADOWPCF" + index] = false;
            defines["SHADOWPCSS" + index] = false;
            defines["SHADOWPOISSON" + index] = false;
            defines["SHADOWESM" + index] = false;
            defines["SHADOWCLOSEESM" + index] = false;
            defines["SHADOWCUBE" + index] = false;
            defines["SHADOWLOWQUALITY" + index] = false;
            defines["SHADOWMEDIUMQUALITY" + index] = false;
        }
    }
    const caps = scene.getEngine().getCaps();
    if (defines["SHADOWFLOAT"] === undefined) {
        state.needRebuild = true;
    }
    defines["SHADOWFLOAT"] =
        state.shadowEnabled && ((caps.textureFloatRender && caps.textureFloatLinearFiltering) || (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering));
    defines["LIGHTMAPEXCLUDED"] = state.lightmapMode;
    if (state.needRebuild) {
        defines.rebuild();
    }
    return state.needNormals;
}
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
export function PrepareDefinesForLight(scene, mesh, light, lightIndex, defines, specularSupported, state) {
    state.needNormals = true;
    if (defines["LIGHT" + lightIndex] === undefined) {
        state.needRebuild = true;
    }
    defines["LIGHT" + lightIndex] = true;
    defines["SPOTLIGHT" + lightIndex] = false;
    defines["HEMILIGHT" + lightIndex] = false;
    defines["POINTLIGHT" + lightIndex] = false;
    defines["DIRLIGHT" + lightIndex] = false;
    light.prepareLightSpecificDefines(defines, lightIndex);
    // FallOff.
    defines["LIGHT_FALLOFF_PHYSICAL" + lightIndex] = false;
    defines["LIGHT_FALLOFF_GLTF" + lightIndex] = false;
    defines["LIGHT_FALLOFF_STANDARD" + lightIndex] = false;
    switch (light.falloffType) {
        case LightConstants.FALLOFF_GLTF:
            defines["LIGHT_FALLOFF_GLTF" + lightIndex] = true;
            break;
        case LightConstants.FALLOFF_PHYSICAL:
            defines["LIGHT_FALLOFF_PHYSICAL" + lightIndex] = true;
            break;
        case LightConstants.FALLOFF_STANDARD:
            defines["LIGHT_FALLOFF_STANDARD" + lightIndex] = true;
            break;
    }
    // Specular
    if (specularSupported && !light.specular.equalsFloats(0, 0, 0)) {
        state.specularEnabled = true;
    }
    // Shadows
    defines["SHADOW" + lightIndex] = false;
    defines["SHADOWCSM" + lightIndex] = false;
    defines["SHADOWCSMDEBUG" + lightIndex] = false;
    defines["SHADOWCSMNUM_CASCADES" + lightIndex] = false;
    defines["SHADOWCSMUSESHADOWMAXZ" + lightIndex] = false;
    defines["SHADOWCSMNOBLEND" + lightIndex] = false;
    defines["SHADOWCSM_RIGHTHANDED" + lightIndex] = false;
    defines["SHADOWPCF" + lightIndex] = false;
    defines["SHADOWPCSS" + lightIndex] = false;
    defines["SHADOWPOISSON" + lightIndex] = false;
    defines["SHADOWESM" + lightIndex] = false;
    defines["SHADOWCLOSEESM" + lightIndex] = false;
    defines["SHADOWCUBE" + lightIndex] = false;
    defines["SHADOWLOWQUALITY" + lightIndex] = false;
    defines["SHADOWMEDIUMQUALITY" + lightIndex] = false;
    if (mesh && mesh.receiveShadows && scene.shadowsEnabled && light.shadowEnabled) {
        const shadowGenerator = light.getShadowGenerator(scene.activeCamera) ?? light.getShadowGenerator();
        if (shadowGenerator) {
            const shadowMap = shadowGenerator.getShadowMap();
            if (shadowMap) {
                if (shadowMap.renderList && shadowMap.renderList.length > 0) {
                    state.shadowEnabled = true;
                    shadowGenerator.prepareDefines(defines, lightIndex);
                }
            }
        }
    }
    if (light.lightmapMode != LightConstants.LIGHTMAP_DEFAULT) {
        state.lightmapMode = true;
        defines["LIGHTMAPEXCLUDED" + lightIndex] = true;
        defines["LIGHTMAPNOSPECULAR" + lightIndex] = light.lightmapMode == LightConstants.LIGHTMAP_SHADOWSONLY;
    }
    else {
        defines["LIGHTMAPEXCLUDED" + lightIndex] = false;
        defines["LIGHTMAPNOSPECULAR" + lightIndex] = false;
    }
}
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
export function PrepareDefinesForFrameBoundValues(scene, engine, material, defines, useInstances, useClipPlane = null, useThinInstances = false) {
    let changed = PrepareDefinesForCamera(scene, defines);
    if (useClipPlane !== false) {
        changed = prepareDefinesForClipPlanes(material, scene, defines);
    }
    if (defines["DEPTHPREPASS"] !== !engine.getColorWrite()) {
        defines["DEPTHPREPASS"] = !defines["DEPTHPREPASS"];
        changed = true;
    }
    if (defines["INSTANCES"] !== useInstances) {
        defines["INSTANCES"] = useInstances;
        changed = true;
    }
    if (defines["THIN_INSTANCES"] !== useThinInstances) {
        defines["THIN_INSTANCES"] = useThinInstances;
        changed = true;
    }
    if (changed) {
        defines.markAsUnprocessed();
    }
}
/**
 * Prepares the defines for bones
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
export function PrepareDefinesForBones(mesh, defines) {
    if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
        defines["NUM_BONE_INFLUENCERS"] = mesh.numBoneInfluencers;
        const materialSupportsBoneTexture = defines["BONETEXTURE"] !== undefined;
        if (mesh.skeleton.isUsingTextureForMatrices && materialSupportsBoneTexture) {
            defines["BONETEXTURE"] = true;
        }
        else {
            defines["BonesPerMesh"] = mesh.skeleton.bones.length + 1;
            defines["BONETEXTURE"] = materialSupportsBoneTexture ? false : undefined;
            const prePassRenderer = mesh.getScene().prePassRenderer;
            if (prePassRenderer && prePassRenderer.enabled) {
                const nonExcluded = prePassRenderer.excludedSkinnedMesh.indexOf(mesh) === -1;
                defines["BONES_VELOCITY_ENABLED"] = nonExcluded;
            }
        }
    }
    else {
        defines["NUM_BONE_INFLUENCERS"] = 0;
        defines["BonesPerMesh"] = 0;
        if (defines["BONETEXTURE"] !== undefined) {
            defines["BONETEXTURE"] = false;
        }
    }
}
/**
 * Prepares the defines for morph targets
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
export function PrepareDefinesForMorphTargets(mesh, defines) {
    const manager = mesh.morphTargetManager;
    if (manager) {
        defines["MORPHTARGETS_UV"] = manager.supportsUVs && defines["UV1"];
        defines["MORPHTARGETS_UV2"] = manager.supportsUV2s && defines["UV2"];
        defines["MORPHTARGETS_TANGENT"] = manager.supportsTangents && defines["TANGENT"];
        defines["MORPHTARGETS_NORMAL"] = manager.supportsNormals && defines["NORMAL"];
        defines["MORPHTARGETS_POSITION"] = manager.supportsPositions;
        defines["MORPHTARGETTEXTURE_HASUVS"] = manager.hasUVs;
        defines["MORPHTARGETTEXTURE_HASUV2S"] = manager.hasUV2s;
        defines["MORPHTARGETTEXTURE_HASTANGENTS"] = manager.hasTangents;
        defines["MORPHTARGETTEXTURE_HASNORMALS"] = manager.hasNormals;
        defines["MORPHTARGETTEXTURE_HASPOSITIONS"] = manager.hasPositions;
        defines["NUM_MORPH_INFLUENCERS"] = manager.numMaxInfluencers || manager.numInfluencers;
        defines["MORPHTARGETS"] = defines["NUM_MORPH_INFLUENCERS"] > 0;
        defines["MORPHTARGETS_TEXTURE"] = manager.isUsingTextureForTargets;
    }
    else {
        defines["MORPHTARGETS_UV"] = false;
        defines["MORPHTARGETS_UV2"] = false;
        defines["MORPHTARGETS_TANGENT"] = false;
        defines["MORPHTARGETS_NORMAL"] = false;
        defines["MORPHTARGETS_POSITION"] = false;
        defines["MORPHTARGETTEXTURE_HASUVS"] = false;
        defines["MORPHTARGETTEXTURE_HASUV2S"] = false;
        defines["MORPHTARGETTEXTURE_HASTANGENTS"] = false;
        defines["MORPHTARGETTEXTURE_HASNORMALS"] = false;
        defines["MORPHTARGETTEXTURE_HASPOSITIONS"] = false;
        defines["MORPHTARGETS"] = false;
        defines["NUM_MORPH_INFLUENCERS"] = 0;
    }
}
/**
 * Prepares the defines for baked vertex animation
 * @param mesh The mesh containing the geometry data we will draw
 * @param defines The defines to update
 */
export function PrepareDefinesForBakedVertexAnimation(mesh, defines) {
    const manager = mesh.bakedVertexAnimationManager;
    defines["BAKED_VERTEX_ANIMATION_TEXTURE"] = manager && manager.isEnabled ? true : false;
}
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
export function PrepareDefinesForAttributes(mesh, defines, useVertexColor, useBones, useMorphTargets = false, useVertexAlpha = true, useBakedVertexAnimation = true) {
    if (!defines._areAttributesDirty && defines._needNormals === defines._normals && defines._needUVs === defines._uvs) {
        return false;
    }
    defines._normals = defines._needNormals;
    defines._uvs = defines._needUVs;
    defines["NORMAL"] = defines._needNormals && mesh.isVerticesDataPresent(`normal`);
    if (defines._needNormals && mesh.isVerticesDataPresent(`tangent`)) {
        defines["TANGENT"] = true;
    }
    for (let i = 1; i <= 6; ++i) {
        defines["UV" + i] = defines._needUVs ? mesh.isVerticesDataPresent(`uv${i === 1 ? "" : i}`) : false;
    }
    if (useVertexColor) {
        const hasVertexColors = mesh.useVertexColors && mesh.isVerticesDataPresent(`color`);
        defines["VERTEXCOLOR"] = hasVertexColors;
        defines["VERTEXALPHA"] = mesh.hasVertexAlpha && hasVertexColors && useVertexAlpha;
    }
    if (mesh.isVerticesDataPresent(`instanceColor`) && (mesh.hasInstances || mesh.hasThinInstances)) {
        defines["INSTANCESCOLOR"] = true;
    }
    if (useBones) {
        PrepareDefinesForBones(mesh, defines);
    }
    if (useMorphTargets) {
        PrepareDefinesForMorphTargets(mesh, defines);
    }
    if (useBakedVertexAnimation) {
        PrepareDefinesForBakedVertexAnimation(mesh, defines);
    }
    return true;
}
/**
 * Prepares the defines related to multiview
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 */
export function PrepareDefinesForMultiview(scene, defines) {
    if (scene.activeCamera) {
        const previousMultiview = defines.MULTIVIEW;
        defines.MULTIVIEW = scene.activeCamera.outputRenderTarget !== null && scene.activeCamera.outputRenderTarget.getViewCount() > 1;
        if (defines.MULTIVIEW != previousMultiview) {
            defines.markAsUnprocessed();
        }
    }
}
/**
 * Prepares the defines related to order independant transparency
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 * @param needAlphaBlending Determines if the material needs alpha blending
 */
export function PrepareDefinesForOIT(scene, defines, needAlphaBlending) {
    const previousDefine = defines.ORDER_INDEPENDENT_TRANSPARENCY;
    const previousDefine16Bits = defines.ORDER_INDEPENDENT_TRANSPARENCY_16BITS;
    defines.ORDER_INDEPENDENT_TRANSPARENCY = scene.useOrderIndependentTransparency && needAlphaBlending;
    defines.ORDER_INDEPENDENT_TRANSPARENCY_16BITS = !scene.getEngine().getCaps().textureFloatLinearFiltering;
    if (previousDefine !== defines.ORDER_INDEPENDENT_TRANSPARENCY || previousDefine16Bits !== defines.ORDER_INDEPENDENT_TRANSPARENCY_16BITS) {
        defines.markAsUnprocessed();
    }
}
/**
 * Prepares the defines related to the prepass
 * @param scene The scene we are intending to draw
 * @param defines The defines to update
 * @param canRenderToMRT Indicates if this material renders to several textures in the prepass
 */
export function PrepareDefinesForPrePass(scene, defines, canRenderToMRT) {
    const previousPrePass = defines.PREPASS;
    if (!defines._arePrePassDirty) {
        return;
    }
    const texturesList = [
        {
            type: 1,
            define: "PREPASS_POSITION",
            index: "PREPASS_POSITION_INDEX",
        },
        {
            type: 9,
            define: "PREPASS_LOCAL_POSITION",
            index: "PREPASS_LOCAL_POSITION_INDEX",
        },
        {
            type: 2,
            define: "PREPASS_VELOCITY",
            index: "PREPASS_VELOCITY_INDEX",
        },
        {
            type: 11,
            define: "PREPASS_VELOCITY_LINEAR",
            index: "PREPASS_VELOCITY_LINEAR_INDEX",
        },
        {
            type: 3,
            define: "PREPASS_REFLECTIVITY",
            index: "PREPASS_REFLECTIVITY_INDEX",
        },
        {
            type: 0,
            define: "PREPASS_IRRADIANCE",
            index: "PREPASS_IRRADIANCE_INDEX",
        },
        {
            type: 7,
            define: "PREPASS_ALBEDO_SQRT",
            index: "PREPASS_ALBEDO_SQRT_INDEX",
        },
        {
            type: 5,
            define: "PREPASS_DEPTH",
            index: "PREPASS_DEPTH_INDEX",
        },
        {
            type: 10,
            define: "PREPASS_SCREENSPACE_DEPTH",
            index: "PREPASS_SCREENSPACE_DEPTH_INDEX",
        },
        {
            type: 6,
            define: "PREPASS_NORMAL",
            index: "PREPASS_NORMAL_INDEX",
        },
        {
            type: 8,
            define: "PREPASS_WORLD_NORMAL",
            index: "PREPASS_WORLD_NORMAL_INDEX",
        },
    ];
    if (scene.prePassRenderer && scene.prePassRenderer.enabled && canRenderToMRT) {
        defines.PREPASS = true;
        defines.SCENE_MRT_COUNT = scene.prePassRenderer.mrtCount;
        defines.PREPASS_NORMAL_WORLDSPACE = scene.prePassRenderer.generateNormalsInWorldSpace;
        defines.PREPASS_COLOR = true;
        defines.PREPASS_COLOR_INDEX = 0;
        for (let i = 0; i < texturesList.length; i++) {
            const index = scene.prePassRenderer.getIndex(texturesList[i].type);
            if (index !== -1) {
                defines[texturesList[i].define] = true;
                defines[texturesList[i].index] = index;
            }
            else {
                defines[texturesList[i].define] = false;
            }
        }
    }
    else {
        defines.PREPASS = false;
        for (let i = 0; i < texturesList.length; i++) {
            defines[texturesList[i].define] = false;
        }
    }
    if (defines.PREPASS != previousPrePass) {
        defines.markAsUnprocessed();
        defines.markAsImageProcessingDirty();
    }
}
/**
 * Helper used to prepare the defines relative to the active camera
 * @param scene defines the current scene
 * @param defines specifies the list of active defines
 * @returns true if the defines have been updated, else false
 */
export function PrepareDefinesForCamera(scene, defines) {
    let changed = false;
    if (scene.activeCamera) {
        const wasOrtho = defines["CAMERA_ORTHOGRAPHIC"] ? 1 : 0;
        const wasPersp = defines["CAMERA_PERSPECTIVE"] ? 1 : 0;
        const isOrtho = scene.activeCamera.mode === 1 ? 1 : 0;
        const isPersp = scene.activeCamera.mode === 0 ? 1 : 0;
        if (wasOrtho ^ isOrtho || wasPersp ^ isPersp) {
            defines["CAMERA_ORTHOGRAPHIC"] = isOrtho === 1;
            defines["CAMERA_PERSPECTIVE"] = isPersp === 1;
            changed = true;
        }
    }
    return changed;
}
/**
 * Prepares the uniforms and samplers list to be used in the effect (for a specific light)
 * @param lightIndex defines the light index
 * @param uniformsList The uniform list
 * @param samplersList The sampler list
 * @param projectedLightTexture defines if projected texture must be used
 * @param uniformBuffersList defines an optional list of uniform buffers
 * @param updateOnlyBuffersList True to only update the uniformBuffersList array
 * @param iesLightTexture defines if IES texture must be used
 */
export function PrepareUniformsAndSamplersForLight(lightIndex, uniformsList, samplersList, projectedLightTexture, uniformBuffersList = null, updateOnlyBuffersList = false, iesLightTexture = false) {
    if (uniformBuffersList) {
        uniformBuffersList.push("Light" + lightIndex);
    }
    if (updateOnlyBuffersList) {
        return;
    }
    uniformsList.push("vLightData" + lightIndex, "vLightDiffuse" + lightIndex, "vLightSpecular" + lightIndex, "vLightDirection" + lightIndex, "vLightFalloff" + lightIndex, "vLightGround" + lightIndex, "lightMatrix" + lightIndex, "shadowsInfo" + lightIndex, "depthValues" + lightIndex);
    samplersList.push("shadowTexture" + lightIndex);
    samplersList.push("depthTexture" + lightIndex);
    uniformsList.push("viewFrustumZ" + lightIndex, "cascadeBlendFactor" + lightIndex, "lightSizeUVCorrection" + lightIndex, "depthCorrection" + lightIndex, "penumbraDarkness" + lightIndex, "frustumLengths" + lightIndex);
    if (projectedLightTexture) {
        samplersList.push("projectionLightTexture" + lightIndex);
        uniformsList.push("textureProjectionMatrix" + lightIndex);
    }
    if (iesLightTexture) {
        samplersList.push("iesLightTexture" + lightIndex);
    }
}
/**
 * Prepares the uniforms and samplers list to be used in the effect
 * @param uniformsListOrOptions The uniform names to prepare or an EffectCreationOptions containing the list and extra information
 * @param samplersList The sampler list
 * @param defines The defines helping in the list generation
 * @param maxSimultaneousLights The maximum number of simultaneous light allowed in the effect
 */
export function PrepareUniformsAndSamplersList(uniformsListOrOptions, samplersList, defines, maxSimultaneousLights = 4) {
    let uniformsList;
    let uniformBuffersList = null;
    if (uniformsListOrOptions.uniformsNames) {
        const options = uniformsListOrOptions;
        uniformsList = options.uniformsNames;
        uniformBuffersList = options.uniformBuffersNames;
        samplersList = options.samplers;
        defines = options.defines;
        maxSimultaneousLights = options.maxSimultaneousLights || 0;
    }
    else {
        uniformsList = uniformsListOrOptions;
        if (!samplersList) {
            samplersList = [];
        }
    }
    for (let lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
        if (!defines["LIGHT" + lightIndex]) {
            break;
        }
        PrepareUniformsAndSamplersForLight(lightIndex, uniformsList, samplersList, defines["PROJECTEDLIGHTTEXTURE" + lightIndex], uniformBuffersList, false, defines["IESLIGHTTEXTURE" + lightIndex]);
    }
    if (defines["NUM_MORPH_INFLUENCERS"]) {
        uniformsList.push("morphTargetInfluences");
        uniformsList.push("morphTargetCount");
    }
    if (defines["BAKED_VERTEX_ANIMATION_TEXTURE"]) {
        uniformsList.push("bakedVertexAnimationSettings");
        uniformsList.push("bakedVertexAnimationTextureSizeInverted");
        uniformsList.push("bakedVertexAnimationTime");
        samplersList.push("bakedVertexAnimationTexture");
    }
}
//# sourceMappingURL=materialHelper.functions.js.map