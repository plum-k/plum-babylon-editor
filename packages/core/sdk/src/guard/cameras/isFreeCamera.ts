import {FreeCamera} from "@babylonjs/core";

export function isFreeCamera(value: any): value is FreeCamera {
    return value instanceof FreeCamera;
}