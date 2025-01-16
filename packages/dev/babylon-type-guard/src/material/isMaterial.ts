import {Material} from "@babylonjs/core";

export function isMaterial(value: any): value is Material {
    return value instanceof Material;
}

