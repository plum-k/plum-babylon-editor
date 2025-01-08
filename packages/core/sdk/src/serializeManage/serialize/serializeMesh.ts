import {Node} from "@babylonjs/core";
import {clearCache, FinalizeSingleNode} from "./SerializeTool";


export function serializeMesh(toSerialize: any /* Mesh || Mesh[] */, withParents: boolean = false, withChildren: boolean = false) {
    const serializationObject: any = {};
    serializationObject.meshes = [];
    serializationObject.transformNodes = [];
    serializationObject.cameras = [];
    serializationObject.lights = [];

    clearCache();

    toSerialize = toSerialize instanceof Array ? toSerialize : [toSerialize];

    if (withParents || withChildren) {
        //deliberate for loop! not for each, appended should be processed as well.
        for (let i = 0; i < toSerialize.length; ++i) {
            if (withChildren) {
                toSerialize[i].getDescendants().forEach((node: Node) => {
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

    toSerialize.forEach((mesh: Node) => {
        FinalizeSingleNode(mesh, serializationObject);
    });

    return serializationObject;
}