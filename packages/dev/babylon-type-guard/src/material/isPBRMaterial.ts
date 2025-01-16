import {PBRMaterial} from "@babylonjs/core";

export function isPBRMaterial(value: any): value is PBRMaterial {
    return value instanceof PBRMaterial;
}

