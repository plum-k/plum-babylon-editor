import {TransformNode} from "@babylonjs/core";

export function isExtendsTransformNode(value: any): value is TransformNode {
    return value instanceof TransformNode;

}

