import { Mesh } from "../Meshes/mesh.js";

import { MultiMaterial } from "../Materials/multiMaterial.js";
import { SerializationHelper } from "./decorators.serialization.js";
import { Texture } from "../Materials/Textures/texture.js";
import { Logger } from "./logger.js";
let serializedGeometries = [];
const SerializeGeometry = (geometry, serializationGeometries) => {
    if (geometry.doNotSerialize) {
        return;
    }
    serializationGeometries.vertexData.push(geometry.serializeVerticeData());
    serializedGeometries[geometry.id] = true;
};
const SerializeMesh = (mesh, serializationScene) => {
    const serializationObject = {};
    // Geometry
    const geometry = mesh._geometry;
    if (geometry) {
        if (!mesh.getScene().getGeometryById(geometry.id)) {
            // Geometry was in the memory but not added to the scene, nevertheless it's better to serialize to be able to reload the mesh with its geometry
            SerializeGeometry(geometry, serializationScene.geometries);
        }
    }
    // Custom
    if (mesh.serialize) {
        mesh.serialize(serializationObject);
    }
    return serializationObject;
};
const FinalizeSingleNode = (node, serializationObject) => {
    if (node._isMesh) {
        const mesh = node;
        //only works if the mesh is already loaded
        if (mesh.delayLoadState === 1 || mesh.delayLoadState === 0) {
            const serializeMaterial = (material) => {
                serializationObject.materials = serializationObject.materials || [];
                if (mesh.material && !serializationObject.materials.some((mat) => mat.id === mesh.material.id)) {
                    serializationObject.materials.push(material.serialize());
                }
            };
            //serialize material
            if (mesh.material && !mesh.material.doNotSerialize) {
                if (mesh.material instanceof MultiMaterial) {
                    serializationObject.multiMaterials = serializationObject.multiMaterials || [];
                    if (!serializationObject.multiMaterials.some((mat) => mat.id === mesh.material.id)) {
                        serializationObject.multiMaterials.push(mesh.material.serialize());
                        for (const submaterial of mesh.material.subMaterials) {
                            if (submaterial) {
                                serializeMaterial(submaterial);
                            }
                        }
                    }
                }
                else {
                    serializeMaterial(mesh.material);
                }
            }
            else if (!mesh.material) {
                serializeMaterial(mesh.getScene().defaultMaterial);
            }
            //serialize geometry
            const geometry = mesh._geometry;
            if (geometry) {
                if (!serializationObject.geometries) {
                    serializationObject.geometries = {};
                    serializationObject.geometries.boxes = [];
                    serializationObject.geometries.spheres = [];
                    serializationObject.geometries.cylinders = [];
                    serializationObject.geometries.toruses = [];
                    serializationObject.geometries.grounds = [];
                    serializationObject.geometries.planes = [];
                    serializationObject.geometries.torusKnots = [];
                    serializationObject.geometries.vertexData = [];
                }
                SerializeGeometry(geometry, serializationObject.geometries);
            }
            // Skeletons
            if (mesh.skeleton && !mesh.skeleton.doNotSerialize) {
                serializationObject.skeletons = serializationObject.skeletons || [];
                serializationObject.skeletons.push(mesh.skeleton.serialize());
            }
            //serialize the actual mesh
            serializationObject.meshes = serializationObject.meshes || [];
            serializationObject.meshes.push(SerializeMesh(mesh, serializationObject));
        }
    }
    else if (node.getClassName() === "TransformNode") {
        const transformNode = node;
        serializationObject.transformNodes.push(transformNode.serialize());
    }
    else if (node.getClassName().indexOf("Camera") !== -1) {
        const camera = node;
        serializationObject.cameras.push(camera.serialize());
    }
    else if (node.getClassName().indexOf("Light") !== -1) {
        const light = node;
        serializationObject.lights.push(light.serialize());
    }
};
/**
 * Class used to serialize a scene into a string
 */
export class SceneSerializer {
    /**
     * Clear cache used by a previous serialization
     */
    static ClearCache() {
        serializedGeometries = [];
    }
    /**
     * Serialize a scene into a JSON compatible object
     * Note that if the current engine does not support synchronous texture reading (like WebGPU), you should use SerializeAsync instead
     * as else you may not retrieve the proper base64 encoded texture data (when using the Texture.ForceSerializeBuffers flag)
     * @param scene defines the scene to serialize
     * @returns a JSON compatible object
     */
    static Serialize(scene) {
        return SceneSerializer._Serialize(scene);
    }
    static _Serialize(scene, checkSyncReadSupported = true) {
        const serializationObject = {};
        if (checkSyncReadSupported && !scene.getEngine()._features.supportSyncTextureRead && Texture.ForceSerializeBuffers) {
            Logger.Warn("The serialization object may not contain the proper base64 encoded texture data! You should use the SerializeAsync method instead.");
        }
        SceneSerializer.ClearCache();
        // Scene
        serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
        serializationObject.autoClear = scene.autoClear;
        serializationObject.clearColor = scene.clearColor.asArray();
        serializationObject.ambientColor = scene.ambientColor.asArray();
        serializationObject.gravity = scene.gravity.asArray();
        serializationObject.collisionsEnabled = scene.collisionsEnabled;
        serializationObject.useRightHandedSystem = scene.useRightHandedSystem;
        // Fog
        if (scene.fogMode !== undefined && scene.fogMode !== null) {
            serializationObject.fogMode = scene.fogMode;
        }
        if (scene.fogColor !== undefined && scene.fogColor !== null) {
            serializationObject.fogColor = scene.fogColor.asArray();
        }
        if (scene.fogStart !== undefined && scene.fogStart !== null) {
            serializationObject.fogStart = scene.fogStart;
        }
        if (scene.fogEnd !== undefined && scene.fogEnd !== null) {
            serializationObject.fogEnd = scene.fogEnd;
        }
        if (scene.fogDensity !== undefined && scene.fogDensity !== null) {
            serializationObject.fogDensity = scene.fogDensity;
        }
        //Physics
        if (scene.isPhysicsEnabled && scene.isPhysicsEnabled()) {
            const physicEngine = scene.getPhysicsEngine();
            if (physicEngine) {
                serializationObject.physicsEnabled = true;
                serializationObject.physicsGravity = physicEngine.gravity.asArray();
                serializationObject.physicsEngine = physicEngine.getPhysicsPluginName();
            }
        }
        // Metadata
        if (scene.metadata) {
            serializationObject.metadata = scene.metadata;
        }
        // Morph targets
        serializationObject.morphTargetManagers = [];
        for (const abstractMesh of scene.meshes) {
            const manager = abstractMesh.morphTargetManager;
            if (manager) {
                serializationObject.morphTargetManagers.push(manager.serialize());
            }
        }
        // Lights
        serializationObject.lights = [];
        let index;
        let light;
        for (index = 0; index < scene.lights.length; index++) {
            light = scene.lights[index];
            if (!light.doNotSerialize) {
                serializationObject.lights.push(light.serialize());
            }
        }
        // Cameras
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
        // Animations
        SerializationHelper.AppendSerializedAnimations(scene, serializationObject);
        // Animation Groups
        if (scene.animationGroups && scene.animationGroups.length > 0) {
            serializationObject.animationGroups = [];
            for (let animationGroupIndex = 0; animationGroupIndex < scene.animationGroups.length; animationGroupIndex++) {
                const animationGroup = scene.animationGroups[animationGroupIndex];
                serializationObject.animationGroups.push(animationGroup.serialize());
            }
        }
        // Reflection probes
        if (scene.reflectionProbes && scene.reflectionProbes.length > 0) {
            serializationObject.reflectionProbes = [];
            for (index = 0; index < scene.reflectionProbes.length; index++) {
                const reflectionProbe = scene.reflectionProbes[index];
                serializationObject.reflectionProbes.push(reflectionProbe.serialize());
            }
        }
        // Materials
        serializationObject.materials = [];
        serializationObject.multiMaterials = [];
        let material;
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
        // Environment texture
        if (scene.environmentTexture) {
            if (scene.environmentTexture._files) {
                serializationObject.environmentTexture = scene.environmentTexture.serialize();
            }
            else {
                serializationObject.environmentTexture = scene.environmentTexture.name;
                serializationObject.environmentTextureRotationY = scene.environmentTexture.rotationY;
            }
        }
        // Environment Intensity
        serializationObject.environmentIntensity = scene.environmentIntensity;
        // Skeletons
        serializationObject.skeletons = [];
        for (index = 0; index < scene.skeletons.length; index++) {
            const skeleton = scene.skeletons[index];
            if (!skeleton.doNotSerialize) {
                serializationObject.skeletons.push(skeleton.serialize());
            }
        }
        // Transform nodes
        serializationObject.transformNodes = [];
        for (index = 0; index < scene.transformNodes.length; index++) {
            if (!scene.transformNodes[index].doNotSerialize) {
                serializationObject.transformNodes.push(scene.transformNodes[index].serialize());
            }
        }
        // Geometries
        serializationObject.geometries = {};
        serializationObject.geometries.boxes = [];
        serializationObject.geometries.spheres = [];
        serializationObject.geometries.cylinders = [];
        serializationObject.geometries.toruses = [];
        serializationObject.geometries.grounds = [];
        serializationObject.geometries.planes = [];
        serializationObject.geometries.torusKnots = [];
        serializationObject.geometries.vertexData = [];
        serializedGeometries = [];
        const geometries = scene.getGeometries();
        for (index = 0; index < geometries.length; index++) {
            const geometry = geometries[index];
            if (geometry.isReady()) {
                SerializeGeometry(geometry, serializationObject.geometries);
            }
        }
        // Meshes
        serializationObject.meshes = [];
        for (index = 0; index < scene.meshes.length; index++) {
            const abstractMesh = scene.meshes[index];
            if (abstractMesh instanceof Mesh) {
                const mesh = abstractMesh;
                if (!mesh.doNotSerialize) {
                    if (mesh.delayLoadState === 1 || mesh.delayLoadState === 0) {
                        serializationObject.meshes.push(SerializeMesh(mesh, serializationObject));
                    }
                }
            }
        }
        // Particles Systems
        serializationObject.particleSystems = [];
        for (index = 0; index < scene.particleSystems.length; index++) {
            serializationObject.particleSystems.push(scene.particleSystems[index].serialize(false));
        }
        // Post processes
        serializationObject.postProcesses = [];
        for (index = 0; index < scene.postProcesses.length; index++) {
            serializationObject.postProcesses.push(scene.postProcesses[index].serialize());
        }
        // Action Manager
        if (scene.actionManager) {
            serializationObject.actions = scene.actionManager.serialize("scene");
        }
        // Components
        for (const component of scene._serializableComponents) {
            component.serialize(serializationObject);
        }
        // Sprites
        if (scene.spriteManagers) {
            serializationObject.spriteManagers = [];
            for (index = 0; index < scene.spriteManagers.length; index++) {
                serializationObject.spriteManagers.push(scene.spriteManagers[index].serialize(true));
            }
        }
        return serializationObject;
    }
    /**
     * Serialize a scene into a JSON compatible object
     * @param scene defines the scene to serialize
     * @returns a JSON promise compatible object
     */
    static SerializeAsync(scene) {
        const serializationObject = SceneSerializer._Serialize(scene, false);
        const promises = [];
        this._CollectPromises(serializationObject, promises);
        return Promise.all(promises).then(() => serializationObject);
    }
    static _CollectPromises(obj, promises) {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; ++i) {
                const o = obj[i];
                if (o instanceof Promise) {
                    promises.push(o.then((res) => (obj[i] = res)));
                }
                else if (o instanceof Object || Array.isArray(o)) {
                    this._CollectPromises(o, promises);
                }
            }
        }
        else if (obj instanceof Object) {
            for (const name in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, name)) {
                    const o = obj[name];
                    if (o instanceof Promise) {
                        promises.push(o.then((res) => (obj[name] = res)));
                    }
                    else if (o instanceof Object || Array.isArray(o)) {
                        this._CollectPromises(o, promises);
                    }
                }
            }
        }
    }
    /**
     * Serialize a mesh into a JSON compatible object
     * @param toSerialize defines the mesh to serialize
     * @param withParents defines if parents must be serialized as well
     * @param withChildren defines if children must be serialized as well
     * @returns a JSON compatible object
     */
    static SerializeMesh(toSerialize /* Mesh || Mesh[] */, withParents = false, withChildren = false) {
        const serializationObject = {};
        serializationObject.meshes = [];
        serializationObject.transformNodes = [];
        serializationObject.cameras = [];
        serializationObject.lights = [];
        SceneSerializer.ClearCache();
        toSerialize = toSerialize instanceof Array ? toSerialize : [toSerialize];
        if (withParents || withChildren) {
            //deliberate for loop! not for each, appended should be processed as well.
            for (let i = 0; i < toSerialize.length; ++i) {
                if (withChildren) {
                    toSerialize[i].getDescendants().forEach((node) => {
                        if (toSerialize.indexOf(node) < 0 && !node.doNotSerialize) {
                            toSerialize.push(node);
                        }
                    });
                }
                //make sure the array doesn't contain the object already
                if (withParents && toSerialize[i].parent && toSerialize.indexOf(toSerialize[i].parent) < 0 && !toSerialize[i].parent.doNotSerialize) {
                    toSerialize.push(toSerialize[i].parent);
                }
            }
        }
        toSerialize.forEach((mesh) => {
            FinalizeSingleNode(mesh, serializationObject);
        });
        return serializationObject;
    }
}
//# sourceMappingURL=sceneSerializer.js.map