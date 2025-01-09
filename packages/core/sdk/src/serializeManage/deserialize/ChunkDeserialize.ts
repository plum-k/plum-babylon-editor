import {
    AbstractMesh,
    ActionManager,
    AmmoJSPlugin,
    AnimationGroup,
    AssetContainer,
    BabylonFileLoaderConfiguration,
    Camera,
    CannonJSPlugin,
    Color3,
    Color4,
    Geometry,
    GetClass,
    ISceneLoaderAsyncResult,
    ISceneLoaderProgressEvent,
    Light,
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
    SceneLoader,
    Skeleton,
    SpriteManager,
    Tools,
    TransformNode,
    Vector3
} from "@babylonjs/core";
import {presetsEnvironmentObj} from "../../manager/EnvironmentManage";
import {Viewer} from "../../core";
import {Deserialize} from "./Deserialize";


let tempIndexContainer: { [key: string]: Node } = {};
let tempMaterialIndexContainer: { [key: string]: Material } = {};
let tempMorphTargetManagerIndexContainer: { [key: string]: MorphTargetManager } = {};

export const parseMaterialByPredicate = (predicate: (parsedMaterial: any) => boolean, parsedData: any, scene: Scene, rootUrl: string) => {
    if (!parsedData.materials) {
        return null;
    }

    for (let index = 0, cache = parsedData.materials.length; index < cache; index++) {
        const parsedMaterial = parsedData.materials[index];
        if (predicate(parsedMaterial)) {
            return {parsedMaterial, material: Material.Parse(parsedMaterial, scene, rootUrl)};
        }
    }
    return null;
};


export const isDescendantOf = (mesh: any, names: Array<any>, hierarchyIds: Array<number>) => {
    for (const i in names) {
        if (mesh.name === names[i]) {
            hierarchyIds.push(mesh.id);
            return true;
        }
    }
    if (mesh.parentId !== undefined && hierarchyIds.indexOf(mesh.parentId) !== -1) {
        hierarchyIds.push(mesh.id);
        return true;
    }
    return false;
};


export const loadDetailLevels = (scene: Scene, mesh: AbstractMesh) => {
    const mastermesh: Mesh = mesh as Mesh;

    // Every value specified in the ids array of the lod data points to another mesh which should be used as the lower LOD level.
    // The distances (or coverages) array values specified are used along with the lod mesh ids as a hint to determine the switching threshold for the various LODs.
    if (mesh._waitingData.lods) {
        if (mesh._waitingData.lods.ids && mesh._waitingData.lods.ids.length > 0) {
            const lodmeshes: string[] = mesh._waitingData.lods.ids;
            const wasenabled: boolean = mastermesh.isEnabled(false);
            if (mesh._waitingData.lods.distances) {
                const distances: number[] = mesh._waitingData.lods.distances;
                if (distances.length >= lodmeshes.length) {
                    const culling: number = distances.length > lodmeshes.length ? distances[distances.length - 1] : 0;
                    mastermesh.setEnabled(false);
                    for (let index = 0; index < lodmeshes.length; index++) {
                        const lodid: string = lodmeshes[index];
                        const lodmesh: Mesh = scene.getMeshById(lodid) as Mesh;
                        if (lodmesh != null) {
                            mastermesh.addLODLevel(distances[index], lodmesh);
                        }
                    }
                    if (culling > 0) {
                        mastermesh.addLODLevel(culling, null);
                    }
                    if (wasenabled === true) {
                        mastermesh.setEnabled(true);
                    }
                } else {
                    Tools.Warn("Invalid level of detail distances for " + mesh.name);
                }
            }
        }
        mesh._waitingData.lods = null;
    }
};
export const findParent = (parentId: any, parentInstanceIndex: any, scene: Scene) => {
    if (typeof parentId !== "number") {
        const parentEntry = scene.getLastEntryById(parentId);
        if (parentEntry && parentInstanceIndex) {
            const instance = (parentEntry as Mesh).instances[parseInt(parentInstanceIndex)];
            return instance;
        }
        return parentEntry;
    }

    const parent = tempIndexContainer[parentId];
    if (parent && parentInstanceIndex) {
        const instance = (parent as Mesh).instances[parseInt(parentInstanceIndex)];
        return instance;
    }

    return parent;
};

export const findMaterial = (materialId: any, scene: Scene) => {
    if (typeof materialId !== "number") {
        return scene.getLastMaterialById(materialId, true);
    }

    return tempMaterialIndexContainer[materialId];
};

const loadAssetContainer = (viewer: Viewer, data: unknown, rootUrl: string, onError?: (message: string, exception?: any) => void, addToScene = false): AssetContainer => {
    const scene = viewer.scene;

    const container = new AssetContainer(scene);
    try {
        const parsedData = data as any

        let index: number;
        let cache: number;

        // 注释默认的环境贴图 还原逻辑

        // Environment texture
        // if (parsedData.environmentTexture) {
        //     // PBR needed for both HDR texture (gamma space) & a sky box
        //     const isPBR = parsedData.isPBR !== undefined ? parsedData.isPBR : true;
        //     if (parsedData.environmentTextureType && parsedData.environmentTextureType === "BABYLON.HDRCubeTexture") {
        //         const hdrSize: number = parsedData.environmentTextureSize ? parsedData.environmentTextureSize : 128;
        //         const hdrTexture = new HDRCubeTexture(
        //             (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
        //             scene,
        //             hdrSize,
        //             true,
        //             !isPBR,
        //             undefined,
        //             parsedData.environmentTexturePrefilterOnLoad
        //         );
        //         if (parsedData.environmentTextureRotationY) {
        //             hdrTexture.rotationY = parsedData.environmentTextureRotationY;
        //         }
        //         scene.environmentTexture = hdrTexture;
        //     } else {
        //         if (typeof parsedData.environmentTexture === "object") {
        //             const environmentTexture = CubeTexture.Parse(parsedData.environmentTexture, scene, rootUrl);
        //             scene.environmentTexture = environmentTexture;
        //         } else if ((parsedData.environmentTexture as string).endsWith(".env")) {
        //             const compressedTexture = new CubeTexture(
        //                 (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
        //                 scene,
        //                 parsedData.environmentTextureForcedExtension
        //             );
        //             if (parsedData.environmentTextureRotationY) {
        //                 compressedTexture.rotationY = parsedData.environmentTextureRotationY;
        //             }
        //             scene.environmentTexture = compressedTexture;
        //         } else {
        //             const cubeTexture = CubeTexture.CreateFromPrefilteredData(
        //                 (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
        //                 scene,
        //                 parsedData.environmentTextureForcedExtension
        //             );
        //             if (parsedData.environmentTextureRotationY) {
        //                 cubeTexture.rotationY = parsedData.environmentTextureRotationY;
        //             }
        //             scene.environmentTexture = cubeTexture;
        //         }
        //     }
        //     if (parsedData.createDefaultSkybox === true) {
        //         const skyboxScale = scene.activeCamera !== undefined && scene.activeCamera !== null ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
        //         const skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
        //         scene.createDefaultSkybox(scene.environmentTexture, isPBR, skyboxScale, skyboxBlurLevel);
        //     }
        //     container.environmentTexture = scene.environmentTexture;
        // }

        if (parsedData.environmentTexture) {
            for (const [key, value] of Object.entries(presetsEnvironmentObj)) {
                if (value === parsedData.environmentTexture) {
                    viewer.environmentManage.setEnvironment(key, true)
                    break;
                }
            }
            if (parsedData.environmentTextureRotationY && viewer.environmentManage.hDRCubeTexture) {
                viewer.environmentManage.hDRCubeTexture.rotationY = parsedData.environmentTextureRotationY;
            }
        }

        // Environment Intensity
        if (parsedData.environmentIntensity) {
            scene.environmentIntensity = parsedData.environmentIntensity;
        }

        // Lights
        if (parsedData.lights) {
            for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                const parsedLight = parsedData.lights[index];
                const light = Light.Parse(parsedLight, scene);
                if (light) {
                    tempIndexContainer[parsedLight.uniqueId] = light;
                    container.lights.push(light);
                    light._parentContainer = container;
                }
            }
        }

        // Reflection probes
        if (parsedData.reflectionProbes) {
            for (index = 0, cache = parsedData.reflectionProbes.length; index < cache; index++) {
                const parsedReflectionProbe = parsedData.reflectionProbes[index];
                const reflectionProbe = ReflectionProbe.Parse(parsedReflectionProbe, scene, rootUrl);
                if (reflectionProbe) {
                    container.reflectionProbes.push(reflectionProbe);
                    reflectionProbe._parentContainer = container;
                }
            }
        }

        // Animations
        if (parsedData.animations) {
            for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                const parsedAnimation = parsedData.animations[index];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    const animation = internalClass.Parse(parsedAnimation);
                    scene.animations.push(animation);
                    container.animations.push(animation);
                }
            }
        }

        // Materials
        if (parsedData.materials) {
            for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                const parsedMaterial = parsedData.materials[index];
                const mat = Material.Parse(parsedMaterial, scene, rootUrl);
                if (mat) {
                    tempMaterialIndexContainer[parsedMaterial.uniqueId || parsedMaterial.id] = mat;
                    container.materials.push(mat);
                    mat._parentContainer = container;

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

        if (parsedData.multiMaterials) {
            for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                const parsedMultiMaterial = parsedData.multiMaterials[index];
                const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                tempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                container.multiMaterials.push(mmat);
                mmat._parentContainer = container;

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
        if (parsedData.morphTargetManagers) {
            for (const parsedManager of parsedData.morphTargetManagers) {
                const manager = MorphTargetManager.Parse(parsedManager, scene);
                tempMorphTargetManagerIndexContainer[parsedManager.id] = manager;
                container.morphTargetManagers.push(manager);
                manager._parentContainer = container;
            }
        }

        // Skeletons
        if (parsedData.skeletons) {
            for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                const parsedSkeleton = parsedData.skeletons[index];
                const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                container.skeletons.push(skeleton);
                skeleton._parentContainer = container;
            }
        }

        // Geometries
        const geometries = parsedData.geometries;
        if (geometries) {
            const addedGeometry = new Array<Nullable<Geometry>>();

            // VertexData
            const vertexData = geometries.vertexData;
            if (vertexData) {
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
        if (parsedData.transformNodes) {
            for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                const parsedTransformNode = parsedData.transformNodes[index];
                const node = TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                tempIndexContainer[parsedTransformNode.uniqueId] = node;
                container.transformNodes.push(node);
                node._parentContainer = container;
            }
        }

        // Meshes
        if (parsedData.meshes) {
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
            }
        }

        // Cameras
        if (parsedData.cameras) {
            for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                const parsedCamera = parsedData.cameras[index];
                const camera = Camera.Parse(parsedCamera, scene);
                tempIndexContainer[parsedCamera.uniqueId] = camera;
                container.cameras.push(camera);
                camera._parentContainer = container;
            }
        }

        // Postprocesses
        if (parsedData.postProcesses) {
            for (index = 0, cache = parsedData.postProcesses.length; index < cache; index++) {
                const parsedPostProcess = parsedData.postProcesses[index];
                const postProcess = PostProcess.Parse(parsedPostProcess, scene, rootUrl);
                if (postProcess) {
                    container.postProcesses.push(postProcess);
                    postProcess._parentContainer = container;
                }
            }
        }

        // Animation Groups
        if (parsedData.animationGroups) {
            for (index = 0, cache = parsedData.animationGroups.length; index < cache; index++) {
                const parsedAnimationGroup = parsedData.animationGroups[index];
                const animationGroup = AnimationGroup.Parse(parsedAnimationGroup, scene);
                container.animationGroups.push(animationGroup);
                animationGroup._parentContainer = container;
            }
        }

        // Sprites
        if (parsedData.spriteManagers) {
            for (let index = 0, cache = parsedData.spriteManagers.length; index < cache; index++) {
                const parsedSpriteManager = parsedData.spriteManagers[index];
                const spriteManager = SpriteManager.Parse(parsedSpriteManager, scene, rootUrl);
            }
        }

        // Browsing all the graph to connect the dots
        for (index = 0, cache = scene.cameras.length; index < cache; index++) {
            const camera = scene.cameras[index];
            if (camera._waitingParentId) {
                camera.parent = findParent(camera._waitingParentId, camera._waitingParentInstanceIndex, scene);
                camera._waitingParentId = null;
                camera._waitingParentInstanceIndex = null;
            }
        }

        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            if (light && light._waitingParentId) {
                light.parent = findParent(light._waitingParentId, light._waitingParentInstanceIndex, scene);
                light._waitingParentId = null;
                light._waitingParentInstanceIndex = null;
            }
        }

        // Connect parents & children and parse actions and lods
        for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
            const transformNode = scene.transformNodes[index];
            if (transformNode._waitingParentId) {
                transformNode.parent = findParent(transformNode._waitingParentId, transformNode._waitingParentInstanceIndex, scene);
                transformNode._waitingParentId = null;
                transformNode._waitingParentInstanceIndex = null;
            }
        }
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingParentId) {
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
            if (mesh._waitingMaterialId) {
                mesh.material = findMaterial(mesh._waitingMaterialId, scene);
                mesh._waitingMaterialId = null;
            }
        });

        // link meshes with morph target managers
        scene.meshes.forEach((mesh) => {
            if (mesh._waitingMorphTargetManagerId) {
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
        if (parsedData.actions) {
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

export class ChunkDeserialize implements Deserialize {
    public name = "ChunkDeserialize";
    public extensions = ".chunk";

    constructor(public viewer: Viewer) {

    }

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
        return sceneLoaderResult;
    }

    async loadAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
        try {
            const parsedData = data as any
            // Scene
            if (parsedData.useDelayedTextureLoading) {
                scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !SceneLoader.ForceFullSceneLoadingForIncremental;
            }
            if (parsedData.autoClear) {
                scene.autoClear = parsedData.autoClear;
            }
            if (parsedData.clearColor) {
                scene.clearColor = Color4.FromArray(parsedData.clearColor);
            }
            if (parsedData.ambientColor) {
                scene.ambientColor = Color3.FromArray(parsedData.ambientColor);
            }
            if (parsedData.gravity) {
                scene.gravity = Vector3.FromArray(parsedData.gravity);
            }

            if (parsedData.useRightHandedSystem !== undefined) {
                scene.useRightHandedSystem = !!parsedData.useRightHandedSystem;
            }

            // Fog
            if (parsedData.fogMode) {
                scene.fogMode = parsedData.fogMode;
            }
            if (parsedData.fogColor) {
                scene.fogColor = Color3.FromArray(parsedData.fogColor);
            }
            if (parsedData.fogStart) {
                scene.fogStart = parsedData.fogStart;
            }
            if (parsedData.fogEnd) {
                scene.fogEnd = parsedData.fogEnd;
            }
            if (parsedData.fogDensity) {
                scene.fogDensity = parsedData.fogDensity;
            }

            //Physics
            if (parsedData.physicsEnabled) {
                const physicsGravity = parsedData.gravity ? Vector3.FromArray(parsedData.gravity) : parsedData.physicsGravity ? Vector3.FromArray(parsedData.physicsGravity) : new Vector3(0, -9.8, 0);
                await this.viewer.physics.init(physicsGravity);
            }

            // Metadata
            if (parsedData.metadata) {
                scene.metadata = parsedData.metadata;
            }

            //collisions, if defined. otherwise, default is true
            if (parsedData.collisionsEnabled) {
                scene.collisionsEnabled = parsedData.collisionsEnabled;
            }
            const container = loadAssetContainer(this.viewer, data, rootUrl, () => {

            }, true);
            if (!container) {

            }

            if (parsedData.autoAnimate) {
                scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
            }

            if (parsedData.activeCameraID) {
                // 场景有一个默认相机, 删除掉
                if (scene.activeCamera) {
                    scene.activeCamera.dispose();
                    scene.activeCamera = null;
                }
                scene.setActiveCameraById(parsedData.activeCameraID);

                scene.activeCamera!.attachControl();
            }

        } catch (err) {
            throw err;
        } finally {

        }

    }

    async loadAssetContainerAsync(scene: Scene, data: unknown, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<AssetContainer> {
        return loadAssetContainer(this.viewer, data as string, rootUrl);
    }
}

