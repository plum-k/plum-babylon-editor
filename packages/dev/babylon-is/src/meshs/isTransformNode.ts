import {TransformNode} from "@babylonjs/core";

export function isTransformNode(value: any): value is TransformNode {
    return value instanceof TransformNode && value.getClassName() === "TransformNode";
}



