import {ArcRotateCamera} from "@babylonjs/core";

export function isArcRotateCamera(value: any): value is ArcRotateCamera {
    return value instanceof ArcRotateCamera;
}
