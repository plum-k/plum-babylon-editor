import { Scene } from "../../scene.js";
import { Vector3 } from "../../Maths/math.vector.js";
import { AbstractMesh } from "../../Meshes/abstractMesh.js";
import { Ray } from "../../Culling/ray.js";
import { SceneComponentConstants } from "../../sceneComponent.js";
import { Octree } from "./octree.js";
import { EngineStore } from "../../Engines/engineStore.js";
Scene.prototype.createOrUpdateSelectionOctree = function (maxCapacity = 64, maxDepth = 2) {
    let component = this._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(this);
        this._addComponent(component);
    }
    if (!this._selectionOctree) {
        this._selectionOctree = new Octree(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
    }
    const worldExtends = this.getWorldExtends();
    // Update octree
    this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);
    return this._selectionOctree;
};
Object.defineProperty(Scene.prototype, "selectionOctree", {
    get: function () {
        return this._selectionOctree;
    },
    enumerable: true,
    configurable: true,
});
/**
 * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
 * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
 * @param maxCapacity defines the maximum size of each block (64 by default)
 * @param maxDepth defines the maximum depth to use (no more than 2 levels by default)
 * @returns the new octree
 * @see https://www.babylonjs-playground.com/#NA4OQ#12
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
 */
AbstractMesh.prototype.createOrUpdateSubmeshesOctree = function (maxCapacity = 64, maxDepth = 2) {
    const scene = this.getScene();
    let component = scene._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(scene);
        scene._addComponent(component);
    }
    if (!this._submeshesOctree) {
        this._submeshesOctree = new Octree(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
    }
    this.computeWorldMatrix(true);
    const boundingInfo = this.getBoundingInfo();
    // Update octree
    const bbox = boundingInfo.boundingBox;
    this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);
    return this._submeshesOctree;
};
/**
 * Defines the octree scene component responsible to manage any octrees
 * in a given scene.
 */
export class OctreeSceneComponent {
    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene) {
        /**
         * The component name help to identify the component in the list of scene components.
         */
        this.name = SceneComponentConstants.NAME_OCTREE;
        /**
         * Indicates if the meshes have been checked to make sure they are isEnabled()
         */
        this.checksIsEnabled = true;
        this._tempRay = new Ray(Vector3.Zero(), new Vector3(1, 1, 1));
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this.scene = scene;
        this.scene.getActiveMeshCandidates = () => this.getActiveMeshCandidates();
        this.scene.getActiveSubMeshCandidates = (mesh) => this.getActiveSubMeshCandidates(mesh);
        this.scene.getCollidingSubMeshCandidates = (mesh, collider) => this.getCollidingSubMeshCandidates(mesh, collider);
        this.scene.getIntersectingSubMeshCandidates = (mesh, localRay) => this.getIntersectingSubMeshCandidates(mesh, localRay);
    }
    /**
     * Registers the component in a given scene
     */
    register() {
        this.scene.onMeshRemovedObservable.add((mesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                const index = sceneOctree.dynamicContent.indexOf(mesh);
                if (index !== -1) {
                    sceneOctree.dynamicContent.splice(index, 1);
                }
            }
        });
        this.scene.onMeshImportedObservable.add((mesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                sceneOctree.addMesh(mesh);
            }
        });
    }
    /**
     * Return the list of active meshes
     * @returns the list of active meshes
     */
    getActiveMeshCandidates() {
        return this.scene._selectionOctree?.select(this.scene.frustumPlanes) || this.scene._getDefaultMeshCandidates();
    }
    /**
     * Return the list of active sub meshes
     * @param mesh The mesh to get the candidates sub meshes from
     * @returns the list of active sub meshes
     */
    getActiveSubMeshCandidates(mesh) {
        if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
            const intersections = mesh._submeshesOctree.select(this.scene.frustumPlanes);
            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }
    /**
     * Return the list of sub meshes intersecting with a given local ray
     * @param mesh defines the mesh to find the submesh for
     * @param localRay defines the ray in local space
     * @returns the list of intersecting sub meshes
     */
    getIntersectingSubMeshCandidates(mesh, localRay) {
        if (mesh._submeshesOctree && mesh.useOctreeForPicking) {
            Ray.TransformToRef(localRay, mesh.getWorldMatrix(), this._tempRay);
            const intersections = mesh._submeshesOctree.intersectsRay(this._tempRay);
            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }
    /**
     * Return the list of sub meshes colliding with a collider
     * @param mesh defines the mesh to find the submesh for
     * @param collider defines the collider to evaluate the collision against
     * @returns the list of colliding sub meshes
     */
    getCollidingSubMeshCandidates(mesh, collider) {
        if (mesh._submeshesOctree && mesh.useOctreeForCollisions) {
            const radius = collider._velocityWorldLength + Math.max(collider._radius.x, collider._radius.y, collider._radius.z);
            const intersections = mesh._submeshesOctree.intersects(collider._basePointWorld, radius);
            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }
    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    rebuild() {
        // Nothing to do here.
    }
    /**
     * Disposes the component and the associated resources.
     */
    dispose() {
        // Nothing to do here.
    }
}
//# sourceMappingURL=octreeSceneComponent.js.map