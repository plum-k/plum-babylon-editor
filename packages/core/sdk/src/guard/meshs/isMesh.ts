import {Mesh} from "@babylonjs/core";

export function isMesh(value: any): value is Mesh {
    return value instanceof Mesh;
}


