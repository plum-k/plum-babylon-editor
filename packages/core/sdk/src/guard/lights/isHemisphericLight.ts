import {HemisphericLight} from "@babylonjs/core";

export function isHemisphericLight(value: any): value is HemisphericLight {
    return value instanceof HemisphericLight;
}


