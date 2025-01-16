import {SpotLight} from "@babylonjs/core";

export function isSpotLight(value: any): value is SpotLight {
    return value instanceof SpotLight;
}


