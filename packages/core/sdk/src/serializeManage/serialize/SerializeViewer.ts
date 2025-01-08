import {Constants, CubeTexture, Light, Material, Mesh, SerializationHelper, Texture} from "@babylonjs/core";
import {Viewer} from "../../core";
import {clearCache, SerializeGeometry, SerializeMesh} from "./SerializeTool";


export interface SerializeOptions {
    serializeFog?: boolean,
    serializePhysics?: boolean,
    serializeMetadata?: boolean,
    serializeMorphTargets?: boolean,
    serializeLights?: boolean,
    serializeCameras?: boolean,
    serializeAnimations?: boolean,
    serializeReflectionProbes?: boolean,
    serializeMaterials?: boolean,
    serializeEnvironmentTexture?: boolean,
    serializeSkeletons?: boolean,
    serializeTransformNodes?: boolean,
    serializeGeometries?: boolean,
    serializeMeshes?: boolean,
    serializeParticleSystems?: boolean,
    serializePostProcesses?: boolean,
    serializeSprites?: boolean,
    serializeActions?: boolean,
    serializeComponents?: boolean
}

// 默认配置
export const defaultSerializeOptions: SerializeOptions = {
    serializeFog: true,
    serializePhysics: true,
    serializeMetadata: true,
    serializeMorphTargets: true,
    serializeLights: true,
    serializeCameras: true,
    serializeAnimations: true,
    serializeReflectionProbes: true,
    serializeMaterials: true,
    serializeEnvironmentTexture: true,
    serializeSkeletons: true,
    serializeTransformNodes: true,
    serializeGeometries: true,
    serializeMeshes: true,
    serializeParticleSystems: true,
    serializePostProcesses: true,
    serializeSprites: true,
    serializeActions: true,
    serializeComponents: true,
};

/**
 * 导出场景, 只导关键部分
 * 修改自 packages/dev/core/src/Misc/sceneSerializer.ts
 */
export class SerializeViewer {

    constructor(public viewer: Viewer) {
    }

    serialize(checkSyncReadSupported = true, options: SerializeOptions = defaultSerializeOptions): any {
        const scene = this.viewer.scene;
        const serializationObject: any = {};

        if (checkSyncReadSupported && !scene.getEngine()._features.supportSyncTextureRead && Texture.ForceSerializeBuffers) {
            console.warn("The serialization object may not contain the proper base64 encoded texture data! You should use the SerializeAsync method instead.");
        }

        clearCache();

        // Scene
        serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
        serializationObject.autoClear = scene.autoClear;
        serializationObject.clearColor = scene.clearColor.asArray();
        serializationObject.ambientColor = scene.ambientColor.asArray();
        serializationObject.gravity = scene.gravity.asArray();
        serializationObject.collisionsEnabled = scene.collisionsEnabled;
        serializationObject.useRightHandedSystem = scene.useRightHandedSystem;

        // Fog
        if (options.serializeFog) {
            if (scene.fogMode) {
                serializationObject.fogMode = scene.fogMode;
            }
            if (scene.fogColor) {
                serializationObject.fogColor = scene.fogColor.asArray();
            }
            if (scene.fogStart) {
                serializationObject.fogStart = scene.fogStart;
            }
            if (scene.fogEnd) {
                serializationObject.fogEnd = scene.fogEnd;
            }
            if (scene.fogDensity) {
                serializationObject.fogDensity = scene.fogDensity;
            }
        }

        // Physics
        if (options.serializePhysics && scene.isPhysicsEnabled && scene.isPhysicsEnabled()) {
            const physicEngine = scene.getPhysicsEngine();

            if (physicEngine) {
                serializationObject.physicsEnabled = true;
                serializationObject.physicsGravity = physicEngine.gravity.asArray();
                serializationObject.physicsEngine = physicEngine.getPhysicsPluginName();
            }
        }

        // Metadata
        if (options.serializeMetadata && scene.metadata) {
            serializationObject.metadata = scene.metadata;
        }

        // Morph targets
        if (options.serializeMorphTargets) {
            serializationObject.morphTargetManagers = [];
            for (const abstractMesh of scene.meshes) {
                const manager = (<Mesh>abstractMesh).morphTargetManager;

                if (manager) {
                    serializationObject.morphTargetManagers.push(manager.serialize());
                }
            }
        }
        let index: number;

        // Lights
        if (options.serializeLights) {
            serializationObject.lights = [];
            let light: Light;
            for (index = 0; index < scene.lights.length; index++) {
                light = scene.lights[index];

                if (!light.doNotSerialize) {
                    serializationObject.lights.push(light.serialize());
                }
            }
        }

        // Cameras
        if (options.serializeCameras) {
            serializationObject.cameras = [];
            for (index = 0; index < scene.cameras.length; index++) {
                const camera = scene.cameras[index];

                if (!camera.doNotSerialize) {
                    serializationObject.cameras.push(camera.serialize());
                }
            }

            if (scene.activeCamera) {
                serializationObject.activeCameraID = scene.activeCamera.id;
            }
        }

        // Animations
        if (options.serializeAnimations) {
            SerializationHelper.AppendSerializedAnimations(scene, serializationObject);
        }

        // Animation Groups
        if (scene.animationGroups && scene.animationGroups.length > 0) {
            serializationObject.animationGroups = [];
            for (let animationGroupIndex = 0; animationGroupIndex < scene.animationGroups.length; animationGroupIndex++) {
                const animationGroup = scene.animationGroups[animationGroupIndex];

                serializationObject.animationGroups.push(animationGroup.serialize());
            }
        }

        // Reflection probes
        if (options.serializeReflectionProbes && scene.reflectionProbes && scene.reflectionProbes.length > 0) {
            serializationObject.reflectionProbes = [];

            for (index = 0; index < scene.reflectionProbes.length; index++) {
                const reflectionProbe = scene.reflectionProbes[index];
                serializationObject.reflectionProbes.push(reflectionProbe.serialize());
            }
        }

        // Materials
        if (options.serializeMaterials) {
            serializationObject.materials = [];
            serializationObject.multiMaterials = [];
            let material: Material;
            for (index = 0; index < scene.materials.length; index++) {
                material = scene.materials[index];
                if (!material.doNotSerialize) {
                    serializationObject.materials.push(material.serialize());
                }
            }

            // MultiMaterials
            serializationObject.multiMaterials = [];
            for (index = 0; index < scene.multiMaterials.length; index++) {
                const multiMaterial = scene.multiMaterials[index];
                serializationObject.multiMaterials.push(multiMaterial.serialize());
            }
        }

        // Environment texture
        if (options.serializeEnvironmentTexture && scene.environmentTexture) {
            if ((scene.environmentTexture as CubeTexture)._files) {
                serializationObject.environmentTexture = scene.environmentTexture.serialize();
            } else {
                serializationObject.environmentTexture = scene.environmentTexture.name;
                serializationObject.environmentTextureRotationY = (scene.environmentTexture as CubeTexture).rotationY;
            }
        }

        // Environment Intensity
        serializationObject.environmentIntensity = scene.environmentIntensity;

        // Skeletons
        if (options.serializeSkeletons) {
            serializationObject.skeletons = [];
            for (index = 0; index < scene.skeletons.length; index++) {
                const skeleton = scene.skeletons[index];
                if (!skeleton.doNotSerialize) {
                    serializationObject.skeletons.push(skeleton.serialize());
                }
            }
        }

        // Transform nodes
        if (options.serializeTransformNodes) {
            serializationObject.transformNodes = [];
            for (index = 0; index < scene.transformNodes.length; index++) {
                if (!scene.transformNodes[index].doNotSerialize) {
                    serializationObject.transformNodes.push(scene.transformNodes[index].serialize());
                }
            }
        }

        // Geometries
        if (options.serializeGeometries) {
            serializationObject.geometries = {};
            serializationObject.geometries.vertexData = [];

            const geometries = scene.getGeometries();
            for (index = 0; index < geometries.length; index++) {
                const geometry = geometries[index];

                if (geometry.isReady()) {
                    SerializeGeometry(geometry, serializationObject.geometries);
                }
            }
        }

        // Meshes
        if (options.serializeMeshes) {
            serializationObject.meshes = [];
            for (index = 0; index < scene.meshes.length; index++) {
                const abstractMesh = scene.meshes[index];

                if (abstractMesh instanceof Mesh) {
                    const mesh = abstractMesh;
                    if (!mesh.doNotSerialize) {
                        if (mesh.delayLoadState === Constants.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Constants.DELAYLOADSTATE_NONE) {
                            serializationObject.meshes.push(SerializeMesh(mesh, serializationObject));
                        }
                    }
                }
            }
        }

        // Particles Systems
        if (options.serializeParticleSystems) {
            serializationObject.particleSystems = [];
            for (index = 0; index < scene.particleSystems.length; index++) {
                serializationObject.particleSystems.push(scene.particleSystems[index].serialize(false));
            }
        }

        // Post processes
        if (options.serializePostProcesses) {
            serializationObject.postProcesses = [];
            for (index = 0; index < scene.postProcesses.length; index++) {
                serializationObject.postProcesses.push(scene.postProcesses[index].serialize());
            }
        }

        // Action Manager
        if (options.serializeActions && scene.actionManager) {
            serializationObject.actions = scene.actionManager.serialize("scene");
        }

        // Components
        if (options.serializeComponents) {
            for (const component of scene._serializableComponents) {
                component.serialize(serializationObject);
            }
        }

        // Sprites
        if (options.serializeSprites && scene.spriteManagers) {
            serializationObject.spriteManagers = [];
            for (index = 0; index < scene.spriteManagers.length; index++) {
                serializationObject.spriteManagers.push(scene.spriteManagers[index].serialize(true));
            }
        }

        return serializationObject;
    }

    /**
     * 异步导出
     */
    serializeAsync(): Promise<any> {
        const serializationObject = this.serialize(false);

        const promises: Array<Promise<any>> = [];

        this.collectPromises(serializationObject, promises);
        return Promise.all(promises).then(() => serializationObject);
    }

    collectPromises(obj: any, promises: Array<Promise<any>>): void {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; ++i) {
                const o = obj[i];
                if (o instanceof Promise) {
                    promises.push(o.then((res: any) => (obj[i] = res)));
                } else if (o instanceof Object || Array.isArray(o)) {
                    this.collectPromises(o, promises);
                }
            }
        } else if (obj instanceof Object) {
            for (const name in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, name)) {
                    const o = obj[name];
                    if (o instanceof Promise) {
                        promises.push(o.then((res: any) => (obj[name] = res)));
                    } else if (o instanceof Object || Array.isArray(o)) {
                        this.collectPromises(o, promises);
                    }
                }
            }
        }
    }
}