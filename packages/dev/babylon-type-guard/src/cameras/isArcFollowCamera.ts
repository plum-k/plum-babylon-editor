import {ArcFollowCamera} from "@babylonjs/core";

export function isArcFollowCamera(value: any): value is ArcFollowCamera {
    return value instanceof ArcFollowCamera;
}