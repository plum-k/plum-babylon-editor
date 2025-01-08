import {FlyCamera} from "@babylonjs/core";

export function isFlyCamera(value: any): value is FlyCamera {
    return value instanceof FlyCamera;
}