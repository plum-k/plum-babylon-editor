import {InstancedMesh} from "@babylonjs/core";

export function isInstancedMesh(value: any): value is InstancedMesh {
    return value instanceof InstancedMesh;
}

