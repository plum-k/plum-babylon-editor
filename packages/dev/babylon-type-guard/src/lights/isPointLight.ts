import {PointLight} from "@babylonjs/core";

export function isPointLight(value: any): value is PointLight {
    return value instanceof PointLight;
}


