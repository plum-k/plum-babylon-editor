import {Camera, Constants, Geometry, Light, Material, Mesh, MultiMaterial, Node, TransformNode} from "@babylonjs/core";

export const SerializeMesh = (mesh: Mesh, serializationScene: any): any => {
    const serializationObject: any = {};

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


export let serializedGeometries: Geometry[] = [];
export const SerializeGeometry = (geometry: Geometry, serializationGeometries: any): any => {
    if (geometry.doNotSerialize) {
        return;
    }

    serializationGeometries.vertexData.push(geometry.serializeVerticeData());

    (<any>serializedGeometries)[geometry.id] = true;
};

export const FinalizeSingleNode = (node: Node, serializationObject: any) => {
    if ((node as Mesh)._isMesh) {
        const mesh = node as Mesh;
        //only works if the mesh is already loaded
        if (mesh.delayLoadState === Constants.DELAYLOADSTATE_LOADED || mesh.delayLoadState === Constants.DELAYLOADSTATE_NONE) {
            const serializeMaterial = (material: Material) => {
                serializationObject.materials = serializationObject.materials || [];
                if (mesh.material && !serializationObject.materials.some((mat: Material) => mat.id === (<Material>mesh.material).id)) {
                    serializationObject.materials.push(material.serialize());
                }
            };

            //serialize material
            if (mesh.material && !mesh.material.doNotSerialize) {
                if (mesh.material instanceof MultiMaterial) {
                    serializationObject.multiMaterials = serializationObject.multiMaterials || [];
                    if (!serializationObject.multiMaterials.some((mat: Material) => mat.id === (<Material>mesh.material).id)) {
                        serializationObject.multiMaterials.push(mesh.material.serialize());
                        for (const submaterial of mesh.material.subMaterials) {
                            if (submaterial) {
                                serializeMaterial(submaterial);
                            }
                        }
                    }
                } else {
                    serializeMaterial(mesh.material);
                }
            } else if (!mesh.material) {
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
    } else if (node.getClassName() === "TransformNode") {
        const transformNode = node as TransformNode;
        serializationObject.transformNodes.push(transformNode.serialize());
    } else if (node.getClassName().indexOf("Camera") !== -1) {
        const camera = node as Camera;
        serializationObject.cameras.push(camera.serialize());
    } else if (node.getClassName().indexOf("Light") !== -1) {
        const light = node as Light;
        serializationObject.lights.push(light.serialize());
    }
};

export function clearCache() {
    serializedGeometries = [];
}
