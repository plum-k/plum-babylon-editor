import {AbstractMesh} from "@babylonjs/core";

export function isAbstractMesh(value: any): value is AbstractMesh {
    return value instanceof AbstractMesh;
}


