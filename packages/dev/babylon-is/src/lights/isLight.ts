import {Light} from "@babylonjs/core";

export function isLight(value: any): value is Light {
    return value instanceof Light;
}

