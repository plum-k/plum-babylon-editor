import { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter.js";
/**
 * Class to convert an interactivity pointer path to a smart object
 */
export class InteractivityPathToObjectConverter extends GLTFPathToObjectConverter {
    constructor(gltf) {
        super(gltf, gltfTree);
    }
}
const nodesTree = {
    __array__: {
        __target__: true,
        translation: {
            type: "Vector3",
            get: (node) => {
                const babylonObject = node._babylonTransformNode;
                return babylonObject.position;
            },
            set: (value, node) => {
                const babylonObject = node._babylonTransformNode;
                babylonObject.position = value;
            },
            getObject(node) {
                return node._babylonTransformNode;
            },
        },
    },
};
const gltfTree = {
    nodes: nodesTree,
};
//# sourceMappingURL=interactivityPathToObjectConverter.js.map