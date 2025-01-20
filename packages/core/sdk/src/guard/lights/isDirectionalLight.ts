import {DirectionalLight} from "@babylonjs/core";

export function isDirectionalLight(value: any): value is DirectionalLight {
    return value instanceof DirectionalLight;
}

