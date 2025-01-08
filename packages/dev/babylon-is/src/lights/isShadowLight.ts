import {ShadowLight} from "@babylonjs/core";

export function isShadowLight(value: any): value is ShadowLight {
    return value instanceof ShadowLight;
}


