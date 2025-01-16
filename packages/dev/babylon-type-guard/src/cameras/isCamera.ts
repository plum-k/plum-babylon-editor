import {Camera} from "@babylonjs/core";

export function isCamera(value: any): value is Camera {
    return value instanceof Camera;
}

