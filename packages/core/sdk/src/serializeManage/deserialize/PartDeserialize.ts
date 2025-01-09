import {
    AbstractMesh,
    ActionManager,
    AmmoJSPlugin,
    AssetContainer,
    BabylonFileLoaderConfiguration,
    Camera,
    CannonJSPlugin,
    Color3,
    Color4,
    CubeTexture,
    Geometry,
    GetClass,
    GetIndividualParser,
    HDRCubeTexture,
    ISceneLoaderAsyncResult,
    ISceneLoaderProgressEvent,
    Light,
    Logger,
    Material,
    Mesh,
    MorphTargetManager,
    MultiMaterial,
    Node,
    Nullable,
    OimoJSPlugin,
    Parse,
    PostProcess,
    ReflectionProbe,
    Scene,
    SceneComponentConstants,
    SceneLoader,
    Skeleton,
    SpriteManager,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {
    ChunkDeserialize,
    findMaterial,
    findParent,
    loadDetailLevels,
    parseMaterialByPredicate
} from "./ChunkDeserialize";


let tempIndexContainer: { [key: string]: Node } = {};
let tempMaterialIndexContainer: { [key: string]: Material } = {};
let tempMorphTargetManagerIndexContainer: { [key: string]: MorphTargetManager } = {};


const loadAssetContainer = (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void, addToScene = false): AssetContainer => {
    const container = new AssetContainer(scene);

    // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
    // when SceneLoader.debugLogging = true (default), or exception encountered.
    // Everything stored in var log instead of writing separate lines to support only writing in exception,
    // and avoid problems with multiple concurrent .babylon loads.
    let log = "importScene has failed JSON parse";
    try {
        // eslint-disable-next-line no-var
        var parsedData = JSON.parse(data);
        log = "";
        const fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;

        let index: number;
        let cache: number;

        // Environment texture
        if (parsedData.environmentTexture !== undefined && parsedData.environmentTexture !== null) {
            // PBR needed for both HDR texture (gamma space) & a sky box
            const isPBR = parsedData.isPBR !== undefined ? parsedData.isPBR : true;
            if (parsedData.environmentTextureType && parsedData.environmentTextureType === "BABYLON.HDRCubeTexture") {
                const hdrSize: number = parsedData.environmentTextureSize ? parsedData.environmentTextureSize : 128;
                const hdrTexture = new HDRCubeTexture(
                    (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                    scene,
                    hdrSize,
                    true,
                    !isPBR,
                    undefined,
                    parsedData.environmentTexturePrefilterOnLoad
                );
                if (parsedData.environmentTextureRotationY) {
                    hdrTexture.rotationY = parsedData.environmentTextureRotationY;
                }
                scene.environmentTexture = hdrTexture;
            } else {
                if (typeof parsedData.environmentTexture === "object") {
                    const environmentTexture = CubeTexture.Parse(parsedData.environmentTexture, scene, rootUrl);
                    scene.environmentTexture = environmentTexture;
                } else if ((parsedData.environmentTexture as string).endsWith(".env")) {
                    const compressedTexture = new CubeTexture(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        compressedTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = compressedTexture;
                } else {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        cubeTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = cubeTexture;
                }
            }
            if (parsedData.createDefaultSkybox === true) {
                const skyboxScale = scene.activeCamera !== undefined && scene.activeCamera !== null ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
                const skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
                scene.createDefaultSkybox(scene.environmentTexture, isPBR, skyboxScale, skyboxBlurLevel);
            }
            container.environmentTexture = scene.environmentTexture;
        }

        // Environment Intensity
        if (parsedData.environmentIntensity !== undefined && parsedData.environmentIntensity !== null) {
            scene.environmentIntensity = parsedData.environmentIntensity;
        }

        // Lights
        if (parsedData.lights !== undefined && parsedData.lights !== null) {
            for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                const parsedLight = parsedData.lights[index];
                const light = Light.Parse(parsedLight, scene);
                if (light) {
                    tempIndexContainer[parsedLight.uniqueId] = light;
                    container.lights.push(light);
                    light._parentContainer = container;
                    log += index === 0 ? "\n\tLights:" : "";
                    log += "\n\t\t" + light.toString(fullDetails);
                }
            }
        }

        // Reflection probes
        if (parsedData.reflectionProbes !== undefined && parsedData.reflectionProbes !== null) {
            for (index = 0, cache = parsedData.reflectionProbes.length; index < cache; index++) {
                const parsedReflectionProbe = parsedData.reflectionProbes[index];
                const reflectionProbe = ReflectionProbe.Parse(parsedReflectionProbe, scene, rootUrl);
                if (reflectionProbe) {
                    container.reflectionProbes.push(reflectionProbe);
                    reflectionProbe._parentContainer = container;
                    log += index === 0 ? "\n\tReflection Probes:" : "";
                    log += "\n\t\t" + reflectionProbe.toString(fullDetails);
                }
            }
        }

        // Animations
        if (parsedData.animations !== undefined && parsedData.animations !== null) {
            for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                const parsedAnimation = parsedData.animations[index];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    const animation = internalClass.Parse(parsedAnimation);
                    scene.animations.push(animation);
                    container.animations.push(animation);
                    log += index === 0 ? "\n\tAnimations:" : "";
                    log += "\n\t\t" + animation.toString(fullDetails);
                }
            }
        }

        // Materials
        if (parsedData.materials !== undefined && parsedData.materials !== null) {
            for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                const parsedMaterial = parsedData.materials[index];
                const mat = Material.Parse(parsedMaterial, scene, rootUrl);
                if (mat) {
                    tempMaterialIndexContainer[parsedMaterial.uniqueId || parsedMaterial.id] = mat;
                    container.materials.push(mat);
                    mat._parentContainer = container;
                    log += index === 0 ? "\n\tMaterials:" : "";
                    log += "\n\t\t" + mat.toString(fullDetails);

                    // Textures
                    const textures = mat.getActiveTextures();
                    textures.forEach((t) => {
                        if (container.textures.indexOf(t) == -1) {
                            container.textures.push(t);
                            t._parentContainer = container;
                        }
                    });
                }
            }
        }

        if (parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
            for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                const parsedMultiMaterial = parsedData.multiMaterials[index];
                const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                tempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                container.multiMaterials.push(mmat);
                mmat._parentContainer = container;

                log += index === 0 ? "\n\tMultiMaterials:" : "";
                log += "\n\t\t" + mmat.toString(fullDetails);

                // Textures
                const textures = mmat.getActiveTextures();
                textures.forEach((t) => {
                    if (container.textures.indexOf(t) == -1) {
                        container.textures.push(t);
                        t._parentContainer = container;
                    }
                });
            }
        }

        // Morph targets
        if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
            for (const parsedManager of parsedData.morphTargetManagers) {
                const manager = MorphTargetManager.Parse(parsedManager, scene);
                tempMorphTargetManagerIndexContainer[parsedManager.id] = manager;
                container.morphTargetManagers.push(manager);
                manager._parentContainer = container;
            }
        }

        // Skeletons
        if (parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
            for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                const parsedSkeleton = parsedData.skeletons[index];
                const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                container.skeletons.push(skeleton);
                skeleton._parentContainer = container;
                log += index === 0 ? "\n\tSkeletons:" : "";
                log += "\n\t\t" + skeleton.toString(fullDetails);
            }
        }

        // Geometries
        const geometries = parsedData.geometries;
        if (geometries !== undefined && geometries !== null) {
            const addedGeometry = new Array<Nullable<Geometry>>();

            // VertexData
            const vertexData = geometries.vertexData;
            if (vertexData !== undefined && vertexData !== null) {
                for (index = 0, cache = vertexData.length; index < cache; index++) {
                    const parsedVertexData = vertexData[index];
                    addedGeometry.push(Geometry.Parse(parsedVertexData, scene, rootUrl));
                }
            }

            addedGeometry.forEach((g) => {
                if (g) {
                    container.geometries.push(g);
                    g._parentContainer = container;
                }
            });
        }

        // Transform nodes
        if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
            for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                const parsedTransformNode = parsedData.transformNodes[index];
                const node = TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                tempIndexContainer[parsedTransformNode.uniqueId] = node;
                container.transformNodes.push(node);
                node._parentContainer = container;
            }
        }

        // Meshes
        if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                const parsedMesh = parsedData.meshes[index];
                const mesh = <AbstractMesh>Mesh.Parse(parsedMesh, scene, rootUrl);
                tempIndexContainer[parsedMesh.uniqueId] = mesh;
                container.meshes.push(mesh);
                mesh._parentContainer = container;
                if (mesh.hasInstances) {
                    for (const instance of (mesh as Mesh).instances) {
                        container.meshes.push(instance);
                        instance._parentContainer = container;
                    }
                }
                log += index === 0 ? "\n\tMeshes:" : "";
                log += "\n\t\t" + mesh.toString(fullDetails);
            }
        }

        // Cameras
        if (parsedData.cameras !== undefined && parsedData.cameras !== null) {
            for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                const parsedCamera = parsedData.cameras[index];
                const camera = Camera.Parse(parsedCamera, scene);
                tempIndexContainer[parsedCamera.uniqueId] = camera;
                container.cameras.push(camera);
                camera._parentContainer = container;
                log += index === 0 ? "\n\tCameras:" : "";
                log += "\n\t\t" + camera.toString(fullDetails);
            }
        }

        // Postprocesses
        if (parsedData.postProcesses !== undefined && parsedData.postProcesses !== null) {
            for (index = 0, cache = parsedData.postProcesses.length; index < cache; index++) {
                const parsedPostProcess = parsedData.postProcesses[index];
                const postProcess = PostProcess.Parse(parsedPostProcess, scene, rootUrl);
                if (postProcess) {
                    container.postProcesses.push(postProcess);
                    postProcess._parentContainer = container;
                    log += index === 0 ? "\nPostprocesses:" : "";
                    log += "\n\t\t" + postProcess.toString();
                }
            }
        }

        // Animation Groups
        // 减少循环, 在分包结束后 做加载
        // if (parsedData.animationGroups !== undefined && parsedData.animationGroups !== null) {
        //     for (index = 0, cache = parsedData.animationGroups.length; index < cache; index++) {
        //         const parsedAnimationGroup = parsedData.animationGroups[index];
        //         const animationGroup =  AnimationGroupParse(parsedAnimationGroup, scene);
        //         container.animationGroups.push(animationGroup);
        //         animationGroup._parentContainer = container;
        //         log += index === 0 ? "\n\tAnimationGroups:" : "";
        //         log += "\n\t\t" + animationGroup.toString(fullDetails);
        //     }
        // }

        // Sprites
        if (parsedData.spriteManagers) {
            for (let index = 0, cache = parsedData.spriteManagers.length; index < cache; index++) {
                const parsedSpriteManager = parsedData.spriteManagers[index];
                const spriteManager = SpriteManager.Parse(parsedSpriteManager, scene, rootUrl);
                log += "\n\t\tSpriteManager " + spriteManager.name;
            }
        }

        // Browsing all the graph to connect the dots
        for (index = 0, cache = scene.cameras.length; index < cache; index++) {
            const camera = scene.cameras[index];
            if (camera._waitingParentId !== null) {
                camera.parent = findParent(camera._waitingParentId, camera._waitingParentInstanceIndex, scene);
                camera._waitingParentId = null;
                camera._waitingParentInstanceIndex = null;
            }
        }

        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            if (light && light._waitingParentId !== null) {
                light.parent = findParent(light._waitingParentId, light._waitingParentInstanceIndex, scene);
                light._waitingParentId = null;
                light._waitingParentInstanceIndex = null;
            }
        }

        // Connect parents & children and parse actions and lods
        for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
            const transformNode = scene.transformNodes[index];
            if (transformNode._waitingParentId !== null) {
                transformNode.parent = findParent(transformNode._waitingParentId, transformNode._waitingParentInstanceIndex, scene);
                transformNode._waitingParentId = null;
                transformNode._waitingParentInstanceIndex = null;
            }
        }
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingParentId !== null) {
                mesh.parent = findParent(mesh._waitingParentId, mesh._waitingParentInstanceIndex, scene);
                mesh._waitingParentId = null;
                mesh._waitingParentInstanceIndex = null;
            }
            if (mesh._waitingData.lods) {
                loadDetailLevels(scene, mesh);
            }
        }

        // link multimats with materials
        scene.multiMaterials.forEach((multimat) => {
            multimat._waitingSubMaterialsUniqueIds.forEach((subMaterial) => {
                multimat.subMaterials.push(findMaterial(subMaterial, scene));
            });
            multimat._waitingSubMaterialsUniqueIds = [];
        });

        // link meshes with materials
        scene.meshes.forEach((mesh) => {
            if (mesh._waitingMaterialId !== null) {
                mesh.material = findMaterial(mesh._waitingMaterialId, scene);
                mesh._waitingMaterialId = null;
            }
        });

        // link meshes with morph target managers
        scene.meshes.forEach((mesh) => {
            if (mesh._waitingMorphTargetManagerId !== null) {
                mesh.morphTargetManager = tempMorphTargetManagerIndexContainer[mesh._waitingMorphTargetManagerId];
                mesh._waitingMorphTargetManagerId = null;
            }
        });

        // link skeleton transform nodes
        for (index = 0, cache = scene.skeletons.length; index < cache; index++) {
            const skeleton = scene.skeletons[index];
            if (skeleton._hasWaitingData) {
                if (skeleton.bones != null) {
                    skeleton.bones.forEach((bone) => {
                        if (bone._waitingTransformNodeId) {
                            const linkTransformNode = scene.getLastEntryById(bone._waitingTransformNodeId) as TransformNode;
                            if (linkTransformNode) {
                                bone.linkTransformNode(linkTransformNode);
                            }
                            bone._waitingTransformNodeId = null;
                        }
                    });
                }

                skeleton._hasWaitingData = null;
            }
        }

        // freeze world matrix application
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const currentMesh = scene.meshes[index];
            if (currentMesh._waitingData.freezeWorldMatrix) {
                currentMesh.freezeWorldMatrix();
                currentMesh._waitingData.freezeWorldMatrix = null;
            } else {
                currentMesh.computeWorldMatrix(true);
            }
        }

        // Lights exclusions / inclusions
        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            // Excluded check
            if (light._excludedMeshesIds.length > 0) {
                for (let excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                    const excludedMesh = scene.getMeshById(light._excludedMeshesIds[excludedIndex]);

                    if (excludedMesh) {
                        light.excludedMeshes.push(excludedMesh);
                    }
                }

                light._excludedMeshesIds = [];
            }

            // Included check
            if (light._includedOnlyMeshesIds.length > 0) {
                for (let includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                    const includedOnlyMesh = scene.getMeshById(light._includedOnlyMeshesIds[includedOnlyIndex]);

                    if (includedOnlyMesh) {
                        light.includedOnlyMeshes.push(includedOnlyMesh);
                    }
                }

                light._includedOnlyMeshesIds = [];
            }
        }

        scene.geometries.forEach((g) => {
            g._loadedUniqueId = "";
        });
        Parse(parsedData, scene, container, rootUrl);

        // Actions (scene) Done last as it can access other objects.
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingData.actions) {
                ActionManager.Parse(mesh._waitingData.actions, mesh, scene);
                mesh._waitingData.actions = null;
            }
        }
        if (parsedData.actions !== undefined && parsedData.actions !== null) {
            ActionManager.Parse(parsedData.actions, null, scene);
        }
    } catch (err) {
        throw err;
    } finally {
        tempIndexContainer = {};
        tempMaterialIndexContainer = {};
        tempMorphTargetManagerIndexContainer = {};

        if (!addToScene) {
            container.removeAllFromScene();
        }
    }

    return container;
};


export const hierarchyIds: number[] = [];
export const parsedIdToNodeMap = new Map<number, Node>();

export class PartDeserialize extends ChunkDeserialize {
    public name = "PartDeserialize";

    public extensions = ".part";

    async importMeshAsync(meshesNames: string | readonly string[] | null | undefined, scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string) {
        const sceneLoaderResult: ISceneLoaderAsyncResult = {
            meshes: [],
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [],
            geometries: [],
            lights: [],
            spriteManagers: []
        };
        let log = "importMesh has failed JSON parse";
        try {
            const parsedData = JSON.parse(data);
            log = "";
            const fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;

            // Transform nodes (the overall idea is to load all of them as this is super fast and then get rid of the ones we don't need)
            const loadedTransformNodes = [];
            if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
                for (let index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                    const parsedJSONTransformNode = parsedData.transformNodes[index];
                    const parsedTransformNode = TransformNode.Parse(parsedJSONTransformNode, scene, rootUrl);
                    loadedTransformNodes.push(parsedTransformNode);
                    parsedIdToNodeMap.set(parsedTransformNode._waitingParsedUniqueId!, parsedTransformNode);
                    parsedTransformNode._waitingParsedUniqueId = null;
                }
            }
            if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                const loadedSkeletonsIds = [];
                const loadedMaterialsIds: string[] = [];
                const loadedMaterialsUniqueIds: string[] = [];
                const loadedMorphTargetManagerIds: number[] = [];
                for (let index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                    const parsedMesh = parsedData.meshes[index];

                    //Geometry?
                    if (parsedMesh.geometryId && parsedData.geometries) {
                        parsedData.geometries.vertexData.forEach((parsedGeometryData: any) => {
                            if (parsedGeometryData.id === parsedMesh.geometryId) {
                                Geometry.Parse(parsedGeometryData, scene, rootUrl);
                            }
                        });
                    }

                    // Material ?
                    if (parsedMesh.materialUniqueId || parsedMesh.materialId) {
                        // if we have a unique ID, look up and store in loadedMaterialsUniqueIds, else use loadedMaterialsIds
                        const materialArray = parsedMesh.materialUniqueId ? loadedMaterialsUniqueIds : loadedMaterialsIds;
                        let materialFound = materialArray.indexOf(parsedMesh.materialUniqueId || parsedMesh.materialId) !== -1;
                        if (materialFound === false && parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                            // Loads a submaterial of a multimaterial
                            const loadSubMaterial = (subMatId: string, predicate: (parsedMaterial: any) => boolean) => {
                                materialArray.push(subMatId);
                                const mat = parseMaterialByPredicate(predicate, parsedData, scene, rootUrl);
                                if (mat && mat.material) {
                                    tempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                    log += "\n\tMaterial " + mat.material.toString(fullDetails);
                                }
                            };
                            for (let multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                const parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                if (
                                    (parsedMesh.materialUniqueId && parsedMultiMaterial.uniqueId === parsedMesh.materialUniqueId) ||
                                    parsedMultiMaterial.id === parsedMesh.materialId
                                ) {
                                    if (parsedMultiMaterial.materialsUniqueIds) {
                                        // if the materials inside the multimat are stored by unique id
                                        parsedMultiMaterial.materialsUniqueIds.forEach((subMatId: string) =>
                                            loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.uniqueId === subMatId)
                                        );
                                    } else {
                                        // if the mats are stored by id instead
                                        parsedMultiMaterial.materials.forEach((subMatId: string) =>
                                            loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.id === subMatId)
                                        );
                                    }
                                    materialArray.push(parsedMultiMaterial.uniqueId || parsedMultiMaterial.id);
                                    const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                                    tempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                                    if (mmat) {
                                        materialFound = true;
                                        log += "\n\tMulti-Material " + mmat.toString(fullDetails);
                                    }
                                    break;
                                }
                            }
                        }

                        if (materialFound === false) {
                            materialArray.push(parsedMesh.materialUniqueId || parsedMesh.materialId);
                            const mat = parseMaterialByPredicate(
                                (parsedMaterial) =>
                                    (parsedMesh.materialUniqueId && parsedMaterial.uniqueId === parsedMesh.materialUniqueId) || parsedMaterial.id === parsedMesh.materialId,
                                parsedData,
                                scene,
                                rootUrl
                            );
                            if (!mat || !mat.material) {
                                Logger.Warn("Material not found for mesh " + parsedMesh.id);
                            } else {
                                tempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                log += "\n\tMaterial " + mat.material.toString(fullDetails);
                            }
                        }
                    }

                    // Skeleton ?
                    if (
                        parsedMesh.skeletonId !== null &&
                        parsedMesh.skeletonId !== undefined &&
                        parsedData.skeletonId !== -1 &&
                        parsedData.skeletons !== undefined &&
                        parsedData.skeletons !== null
                    ) {
                        const skeletonAlreadyLoaded = loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1;
                        if (!skeletonAlreadyLoaded) {
                            for (let skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                const parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                    const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                                    sceneLoaderResult.skeletons.push(skeleton);
                                    loadedSkeletonsIds.push(parsedSkeleton.id);
                                    log += "\n\tSkeleton " + skeleton.toString(fullDetails);
                                }
                            }
                        }
                    }

                    // Morph targets ?
                    if (parsedMesh.morphTargetManagerId > -1 && parsedData.morphTargetManagers) {
                        const morphTargetManagerAlreadyLoaded = loadedMorphTargetManagerIds.indexOf(parsedMesh.morphTargetManagerId) > -1;
                        if (!morphTargetManagerAlreadyLoaded) {
                            for (let morphTargetManagerIndex = 0; morphTargetManagerIndex < parsedData.morphTargetManagers.length; morphTargetManagerIndex++) {
                                const parsedManager = parsedData.morphTargetManagers[morphTargetManagerIndex];
                                if (parsedManager.id === parsedMesh.morphTargetManagerId) {
                                    const morphTargetManager = MorphTargetManager.Parse(parsedManager, scene);
                                    tempMorphTargetManagerIndexContainer[parsedManager.id] = morphTargetManager;
                                    loadedMorphTargetManagerIds.push(parsedManager.id);
                                    log += "\nMorph target manager" + morphTargetManager.toString();
                                }
                            }
                        }
                    }

                    const mesh = Mesh.Parse(parsedMesh, scene, rootUrl);
                    sceneLoaderResult.meshes.push(mesh);
                    parsedIdToNodeMap.set(mesh._waitingParsedUniqueId!, mesh);
                    mesh._waitingParsedUniqueId = null;
                    log += "\n\tMesh " + mesh.toString(fullDetails);
                }

                // link multimats with materials
                scene.multiMaterials.forEach((multimat) => {
                    multimat._waitingSubMaterialsUniqueIds.forEach((subMaterial) => {
                        multimat.subMaterials.push(findMaterial(subMaterial, scene));
                    });
                    multimat._waitingSubMaterialsUniqueIds = [];
                });

                // link meshes with materials
                scene.meshes.forEach((mesh) => {
                    if (mesh._waitingMaterialId !== null) {
                        mesh.material = findMaterial(mesh._waitingMaterialId, scene);
                        mesh._waitingMaterialId = null;
                    }
                });

                // link meshes with morph target managers
                scene.meshes.forEach((mesh) => {
                    if (mesh._waitingMorphTargetManagerId !== null) {
                        mesh.morphTargetManager = tempMorphTargetManagerIndexContainer[mesh._waitingMorphTargetManagerId];
                        mesh._waitingMorphTargetManagerId = null;
                    }
                });

                // 最后一个包做处理
                // Connecting parents and lods
                for (let index = 0, cache = scene.transformNodes.length; index < cache; index++) {
                    const transformNode = scene.transformNodes[index];
                    if (transformNode._waitingParentId !== null) {
                        let parent = parsedIdToNodeMap.get(parseInt(transformNode._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(transformNode._waitingParentId);
                        }
                        let parentNode = parent;
                        if (transformNode._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(transformNode._waitingParentInstanceIndex)];
                            transformNode._waitingParentInstanceIndex = null;
                        }
                        if (parentNode) {
                            transformNode.parent = parentNode;
                            transformNode._waitingParentId = null;
                        }
                    }
                }
                let currentMesh: AbstractMesh;
                for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingParentId) {
                        let parent = parsedIdToNodeMap.get(parseInt(currentMesh._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(currentMesh._waitingParentId);
                        }
                        let parentNode = parent;
                        if (currentMesh._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(currentMesh._waitingParentInstanceIndex)];
                            currentMesh._waitingParentInstanceIndex = null;
                        }
                        if (parentNode) {
                            currentMesh.parent = parentNode;
                            currentMesh._waitingParentId = null;
                        }
                    }
                    if (currentMesh._waitingData.lods) {
                        loadDetailLevels(scene, currentMesh);
                    }
                }
                // 不删除空节点, 避免后面的包找不到
                // Remove unused transform nodes
                // for (const transformNode of loadedTransformNodes) {
                //     const childMeshes = transformNode.getChildMeshes(false);
                //     if (!childMeshes.length) {
                //         transformNode.dispose();
                //     }
                // }

                // link skeleton transform nodes
                // 完全加载后再链接
                // for (let index = 0, cache = scene.skeletons.length; index < cache; index++) {
                //     const skeleton = scene.skeletons[index];
                //     if (skeleton._hasWaitingData) {
                //         if (skeleton.bones != null) {
                //             skeleton.bones.forEach((bone) => {
                //                 if (bone._waitingTransformNodeId) {
                //                     
                //                     const linkTransformNode = scene.getLastEntryById(bone._waitingTransformNodeId) as TransformNode;
                //                     if (linkTransformNode) {
                //                         bone.linkTransformNode(linkTransformNode);
                //                     }
                //                     bone._waitingTransformNodeId = null;
                //                 }
                //             });
                //         }
                //
                //         skeleton._hasWaitingData = null;
                //     }
                // }

                // let currentMesh: AbstractMesh;
                // // freeze and compute world matrix application
                // for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                //     currentMesh = scene.meshes[index];
                //     if (currentMesh._waitingData.freezeWorldMatrix) {
                //         currentMesh.freezeWorldMatrix();
                //         currentMesh._waitingData.freezeWorldMatrix = null;
                //     } else {
                //         currentMesh.computeWorldMatrix(true);
                //     }
                // }
            }

            // Particles
            if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                const parser = GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);
                if (parser) {
                    for (let index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        const parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            sceneLoaderResult.particleSystems.push(parser(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
            }

            scene.geometries.forEach((g) => {
                g._loadedUniqueId = "";
            });

            return sceneLoaderResult;
        } catch (err) {
            throw err;
        } finally {
            tempMaterialIndexContainer = {};
            tempMorphTargetManagerIndexContainer = {};
        }
    }
}
