import {type TransformNode} from "@babylonjs/core";
import { invoke} from "lodash-es";
export function isExtendsTransformNode(value: any): value is TransformNode {
    return invoke(value, "getClassName") === "TransformNode";
}



